use axum::{routing::{get, post}, Router};
use serde::Deserialize;
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

#[derive(Deserialize)]
struct SubmissionPayload { title: String, description: Option<String>, url: Option<String> }

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let pool = db::init_db().await;
    let state = AppState { pool };

    let app = Router::new()
        .route("/health", get(|| async { axum::Json(json!({"status":"ok"})) }))
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me))
        .route("/submissions", post(submit_work))
        .route("/admin/stats", get(admin_stats))
        .route("/admin/users", get(admin_users))
        .with_state(state);

    let addr = SocketAddr::from(([127,0,0,1], 8080));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn register(axum::extract::State(state): axum::extract::State<AppState>, axum::Json(payload): axum::Json<RegisterPayload>) -> axum::Json<serde_json::Value> {
    let hashed = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).unwrap();
    let role = payload.role.unwrap_or_else(|| "participant".to_string());

    let res = sqlx::query("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)")
        .bind(&payload.email)
        .bind(&hashed)
        .bind(&role)
        .bind(&payload.name)
        .execute(&state.pool).await;

    match res {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => {
            tracing::error!("register error: {:?}", e);
            axum::Json(json!({"status":"error", "error": format!("{}", e)}))
        }
    }
}

async fn login(axum::extract::State(state): axum::extract::State<AppState>, axum::Json(payload): axum::Json<LoginPayload>) -> axum::Json<serde_json::Value> {
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
                    Ok(token) => axum::Json(json!({"status":"ok", "token": token, "role": role})),
                    Err(e) => axum::Json(json!({"status":"error", "error": format!("{}", e)})),
                }
            } else {
                axum::Json(json!({"status":"error", "error": "invalid credentials"}))
            }
        }
        Ok(None) => axum::Json(json!({"status":"error", "error": "user not found"})),
        Err(e) => {
            tracing::error!("db error: {:?}", e);
            axum::Json(json!({"status":"error", "error": format!("{}", e)}))
        }
    }
}

async fn me(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
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
                                    return axum::Json(json!({"status":"ok","user":{"id":id,"email":email,"role":role,"name":name}}));
                                }
                                Ok(None) => return axum::Json(json!({"status":"error","error":"user not found"})),
                                Err(e) => {
                                    tracing::error!("db error: {:?}", e);
                                    return axum::Json(json!({"status":"error","error": format!("{}", e)}));
                                }
                            }
                    }
                    Err(_) => return axum::Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    axum::Json(json!({"status":"error","error":"missing authorization"}))
}

async fn submit_work(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::Json(payload): axum::Json<SubmissionPayload>) -> axum::Json<serde_json::Value> {
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match auth::decode_jwt(token) {
                    Ok(data) => {
                        let user_id: i64 = data.claims.sub.parse().unwrap_or(0);
                        
                        match sqlx::query("INSERT INTO submissions (user_id, title, description, url) VALUES (?, ?, ?, ?)")
                            .bind(user_id).bind(&payload.title).bind(&payload.description).bind(&payload.url)
                            .execute(&state.pool).await {
                                Ok(r) => {
                                    let id = r.last_insert_rowid();
                                    return axum::Json(json!({"status":"ok","id": id}));
                                }
                                Err(e) => {
                                    tracing::error!("db error: {:?}", e);
                                    return axum::Json(json!({"status":"error","error": format!("{}", e)}));
                                }
                            }
                    }
                    Err(_) => return axum::Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    axum::Json(json!({"status":"error","error":"missing authorization"}))
}

async fn admin_stats(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match auth::decode_jwt(token) {
                    Ok(data) => {
                        let role = data.claims.role;
                        if role != "admin" && role != "hq" {
                            return axum::Json(json!({"status":"error","error":"forbidden"}));
                        }
                        let users_cnt = match sqlx::query("SELECT COUNT(*) as cnt FROM users").fetch_one(&state.pool).await {
                            Ok(r) => r.get::<i64, _>("cnt"),
                            Err(_) => 0,
                        };
                        let submissions_cnt = match sqlx::query("SELECT COUNT(*) as cnt FROM submissions").fetch_one(&state.pool).await {
                            Ok(r) => r.get::<i64, _>("cnt"),
                            Err(_) => 0,
                        };
                        return axum::Json(json!({"status":"ok","counts": {"users": users_cnt, "submissions": submissions_cnt}}));
                    }
                    Err(_) => return axum::Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    axum::Json(json!({"status":"error","error":"missing authorization"}))
}

async fn admin_users(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match auth::decode_jwt(token) {
                    Ok(data) => {
                        let role = data.claims.role;
                        if role != "admin" && role != "hq" {
                            return axum::Json(json!({"status":"error","error":"forbidden"}));
                        }
                        match sqlx::query("SELECT id, email, role, name FROM users").fetch_all(&state.pool).await {
                            Ok(rows) => {
                                let users: Vec<serde_json::Value> = rows.iter().map(|r| {
                                    json!({
                                        "id": r.get::<i64, _>("id"),
                                        "email": r.get::<String, _>("email"),
                                        "name": r.get::<Option<String>, _>("name"),
                                        "role": r.get::<String, _>("role"),
                                    })
                                }).collect();
                                return axum::Json(json!({"status":"ok","users": users}));
                            }
                            Err(e) => {
                                tracing::error!("db error: {:?}", e);
                                return axum::Json(json!({"status":"error","error": format!("{}", e)}));
                            }
                        }
                    }
                    Err(_) => return axum::Json(json!({"status":"error","error":"invalid token"})),
                }
            }
        }
    }
    axum::Json(json!({"status":"error","error":"missing authorization"}))
}
