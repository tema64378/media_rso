use axum::{routing::{get, post}, Router, response::Json, extract::State, http::HeaderMap};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use tracing_subscriber;

mod db;
mod models;
mod auth;
use db::DbPool;
use sqlx::Row;

#[derive(Clone)]
struct AppState { pool: DbPool }

#[derive(Deserialize)]
struct RegisterPayload { email: String, password: String, name: Option<String>, role: Option<String> }

#[derive(Deserialize)]
struct LoginPayload { email: String, password: String }

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let pool = db::init_db().await;
    let state = AppState { pool };

    let app = Router::new()
        .route("/health", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me))
        .with_state(state);

    let addr = SocketAddr::from(([127,0,0,1], 8080));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await.unwrap();
}

async fn register(State(state): State<AppState>, axum::Json(payload): axum::Json<RegisterPayload>) -> Json<serde_json::Value> {
    let hashed = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).unwrap();
    let role = payload.role.unwrap_or_else(|| "participant".to_string());

    let res = sqlx::query("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)")
        .bind(&payload.email)
        .bind(&hashed)
        .bind(&role)
        .bind(&payload.name)
        .execute(&state.pool).await;

    match res {
        Ok(_) => Json(json!({"status":"ok"})),
        Err(e) => {
            tracing::error!("register error: {:?}", e);
            Json(json!({"status":"error", "error": format!("{}", e)}))
        }
    }
}

async fn login(State(state): State<AppState>, axum::Json(payload): axum::Json<LoginPayload>) -> Json<serde_json::Value> {
    let row = sqlx::query("SELECT id, password_hash, role FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.pool).await;

    match row {
        Ok(Some(r)) => {
            let id: i64 = r.get("id");
            let pw_hash: String = r.get("password_hash");
            let role: String = r.get("role");
            if bcrypt::verify(&payload.password, &pw_hash).unwrap_or(false) {
                match auth::generate_jwt(id, &role) {
                    Ok(token) => Json(json!({"status":"ok", "token": token, "role": role})),
                    Err(e) => Json(json!({"status":"error", "error": format!("{}", e)})),
                }
            } else {
                Json(json!({"status":"error", "error": "invalid credentials"}))
            }
        }
        Ok(None) => Json(json!({"status":"error", "error": "user not found"})),
        Err(e) => {
            tracing::error!("db error: {:?}", e);
            Json(json!({"status":"error", "error": format!("{}", e)}))
        }
    }
}

async fn me(State(state): State<AppState>, headers: HeaderMap) -> Json<serde_json::Value> {
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match auth::decode_jwt(token) {
                    Ok(data) => {
                        let user_id: i64 = data.claims.sub.parse().unwrap_or(0);
                        match sqlx::query("SELECT id, email, role, name FROM users WHERE id = ?")
                            .bind(user_id)
                            .fetch_optional(&state.pool).await {
                                Ok(Some(r)) => {
                                    let id: i64 = r.get("id");
                                    let email: String = r.get("email");
                                    let role: String = r.get("role");
                                    let name: Option<String> = r.get("name");
                                    return Json(json!({"status":"ok","user":{"id":id,"email":email,"role":role,"name":name}}));
                                }
                                Ok(None) => return Json(json!({"status":"error","error":"user not found"})),
                                Err(e) => {
                                    tracing::error!("db error: {:?}", e);
                                    return Json(json!({"status":"error","error": format!("{}", e)}));
                                }
                            }
                    }
                    Err(_) => return Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    Json(json!({"status":"error","error":"missing authorization"}))
}

async fn submit_work(State(state): State<AppState>, headers: HeaderMap, axum::Json(payload): axum::Json<serde_json::Value>) -> Json<serde_json::Value> {
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match auth::decode_jwt(token) {
                    Ok(data) => {
                        let user_id: i64 = data.claims.sub.parse().unwrap_or(0);
                        let title = payload.get("title").and_then(|v| v.as_str()).unwrap_or("");
                        let desc = payload.get("description").and_then(|v| v.as_str());
                        let url = payload.get("url").and_then(|v| v.as_str());
                        
                        match sqlx::query("INSERT INTO submissions (user_id, title, description, url) VALUES (?, ?, ?, ?)")
                            .bind(user_id).bind(title).bind(desc).bind(url)
                            .execute(&state.pool).await {
                                Ok(r) => {
                                    let id = r.last_insert_id();
                                    return Json(json!({"status":"ok","id": id}));
                                }
                                Err(e) => {
                                    tracing::error!("db error: {:?}", e);
                                    return Json(json!({"status":"error","error": format!("{}", e)}));
                                }
                            }
                    }
                    Err(_) => return Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    Json(json!({"status":"error","error":"missing authorization"}))
}
