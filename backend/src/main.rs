use axum::{routing::{get, post, put, MethodRouter}, Router};
use axum::extract::Multipart;
use serde::Deserialize;
use serde_json::json;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::ffi::OsStr;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use uuid::Uuid;
use tracing_subscriber;

mod db;
mod models;
mod auth;
mod email;
use db::DbPool;
use sqlx::Row;

const ALLOWED_EXTENSIONS: &[&str] = &["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "mp4", "mov", "avi", "zip", "rar", "7z", "txt", "xls", "xlsx", "ppt", "pptx", "mp3", "wav", "flac"];
const MAX_FILE_SIZE: usize = 100 * 1024 * 1024;

async fn log_audit(pool: &DbPool, admin_id: i64, action: &str, entity_type: &str, entity_id: Option<i64>, details: Option<&str>) {
    let _ = sqlx::query("INSERT INTO audit_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)")
        .bind(admin_id).bind(action).bind(entity_type).bind(entity_id).bind(details)
        .execute(pool).await;
}

#[derive(Clone)]
struct AppState { pool: DbPool }

#[derive(Deserialize)]
struct RegisterPayload { email: String, password: String, name: Option<String>, role: Option<String>, team_name: Option<String>, squad_name: Option<String>, position: Option<String> }

#[derive(Deserialize)]
struct LoginPayload { email: String, password: String }

#[derive(Deserialize)]
struct SubmissionPayload { title: String, description: Option<String>, url: Option<String> }

#[derive(Deserialize)]
struct ScorePayload { criterion_id: i64, score: i32, comment: Option<String> }

#[derive(Deserialize)]
struct ChangePasswordPayload { old_password: String, new_password: String }

#[derive(Deserialize)]
struct ForgotPasswordPayload { email: String }

#[derive(Deserialize)]
struct ResetPasswordPayload { email: String, token: String, new_password: String }

#[derive(Deserialize)]
struct UpdateSubmissionPayload { title: Option<String>, description: Option<String>, url: Option<String> }

#[derive(Deserialize)]
struct UpdateProfilePayload {
    name: Option<String>, phone: Option<String>, birth_date: Option<String>,
    birth_place: Option<String>, passport_series: Option<String>, passport_number: Option<String>,
    passport_issued_by: Option<String>, passport_issue_date: Option<String>,
    passport_code: Option<String>, registration_address: Option<String>,
    inn: Option<String>, snils: Option<String>, team_name: Option<String>, squad_name: Option<String>,
    position: Option<String>,
}

fn user_from_row(r: &sqlx::sqlite::SqliteRow) -> serde_json::Value {
    json!({
        "id": r.get::<i64, _>("id"),
        "email": r.get::<String, _>("email"),
        "role": r.get::<String, _>("role"),
        "name": r.get::<Option<String>, _>("name"),
        "phone": r.get::<Option<String>, _>("phone"),
        "birth_date": r.get::<Option<String>, _>("birth_date"),
        "birth_place": r.get::<Option<String>, _>("birth_place"),
        "avatar_url": r.get::<Option<String>, _>("avatar_url"),
        "passport_series": r.get::<Option<String>, _>("passport_series"),
        "passport_number": r.get::<Option<String>, _>("passport_number"),
        "passport_issued_by": r.get::<Option<String>, _>("passport_issued_by"),
        "passport_issue_date": r.get::<Option<String>, _>("passport_issue_date"),
        "passport_code": r.get::<Option<String>, _>("passport_code"),
        "registration_address": r.get::<Option<String>, _>("registration_address"),
        "inn": r.get::<Option<String>, _>("inn"),
        "snils": r.get::<Option<String>, _>("snils"),
        "team_name": r.get::<Option<String>, _>("team_name"),
        "squad_name": r.get::<Option<String>, _>("squad_name"),
        "position": r.get::<Option<String>, _>("position"),
    })
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();
    let pool = db::init_db().await;
    let state = AppState { pool };

    std::fs::create_dir_all("./uploads").ok();

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/health", get(|| async { axum::Json(json!({"status":"ok"})) }))
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(me).put(update_me))
        .route("/me/password", post(change_password))
        .route("/me/pd-consent", get(pd_consent))
        .route("/me/avatar", post(upload_avatar))
        .route("/verify-email/:token", get(verify_email))
        .route("/submissions", MethodRouter::new()
            .post(submit_work).get(list_submissions).with_state(state.clone()))
        .route("/submissions/upload", post(upload_work).with_state(state.clone()))
        .route("/submissions/my-nominations", get(list_submissions_by_my_nominations).with_state(state.clone()))
        .route("/submissions/:id", get(get_submission).put(update_submission).with_state(state.clone()))
        .route("/submissions/:id/status", post(update_submission_status).with_state(state.clone()))
        .route("/submissions/:id/winner", get(get_winner).with_state(state.clone()))
        .route("/submissions/:id/scores", MethodRouter::new()
            .post(add_score).get(get_scores).with_state(state.clone()))
        .route("/submissions/:id/comments", get(get_admin_comments).post(add_admin_comment).with_state(state.clone()))
        .route("/favorites", get(list_favorites).with_state(state.clone()))
        .route("/favorites/:id", post(add_favorite).delete(remove_favorite).with_state(state.clone()))
        .route("/scores/my-history", get(scores_my_history).with_state(state.clone()))
        .route("/scores/:id", put(update_score).with_state(state.clone()))
        .route("/compare", get(get_compare).with_state(state.clone()))
        .route("/admin/stats", get(admin_stats).with_state(state.clone()))
        .route("/admin/users", get(admin_users).with_state(state.clone()))
        .route("/admin/users/:id/role", post(admin_change_role).with_state(state.clone()))
        .route("/admin/seed", post(admin_seed).with_state(state.clone()))
        .route("/admin/assign-expert", post(admin_assign_expert).with_state(state.clone()))
        .route("/admin/auto-assign", post(admin_auto_assign).with_state(state.clone()))
        .route("/admin/submissions", get(admin_submissions_list).with_state(state.clone()))
        .route("/admin/submissions/:id/moderate", post(admin_moderate_submission).with_state(state.clone()))
        .route("/admin/audit-log", get(admin_audit_log).with_state(state.clone()))
        .route("/admin/reports/nominations", get(admin_nomination_report).with_state(state.clone()))
        .route("/criteria", get(list_criteria).with_state(state.clone()))
        .route("/nominations", get(list_nominations).with_state(state.clone()))
        .route("/admin/users/:id/nominations", get(get_user_nominations).post(update_user_nominations).with_state(state.clone()))
        .route("/forgot-password", post(forgot_password))
        .route("/reset-password", post(reset_password))
        .route("/timeline", get(get_timeline))
        .route("/settings", get(list_settings).with_state(state.clone()))
        .route("/admin/settings/:key", post(update_setting).with_state(state.clone()))
        .route("/media-teams", post(create_media_team).with_state(state.clone()))
        .route("/media-teams/mine", get(get_my_team).with_state(state.clone()))
        .route("/media-teams/leave", post(leave_media_team).with_state(state.clone()))
        .route("/users/search", get(search_users).with_state(state.clone()))
        .route("/dashboard/expert", get(expert_dashboard_data).with_state(state.clone()))
        .nest_service("/uploads", ServeDir::new("./uploads"))
        .layer(cors).with_state(state);

    let addr = SocketAddr::from(([127,0,0,1], 8080));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn register(axum::extract::State(state): axum::extract::State<AppState>, axum::Json(payload): axum::Json<RegisterPayload>) -> axum::Json<serde_json::Value> {
    let hashed = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).unwrap();
    let role = payload.role.unwrap_or_else(|| "participant".to_string());
    let verify_token = Uuid::new_v4().to_string();
    let res = sqlx::query("INSERT INTO users (email, password_hash, role, name, team_name, squad_name, position, email_verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&payload.email).bind(&hashed).bind(&role).bind(&payload.name).bind(&payload.team_name).bind(&payload.squad_name).bind(&payload.position).bind(&verify_token).execute(&state.pool).await;
    match res {
        Ok(_) => {
            let name = payload.name.as_deref().unwrap_or("Участник");
            let _ = email::send_welcome_email(&payload.email, name).await;
            let _ = email::send_verification_email(&payload.email, name, &verify_token).await;
            axum::Json(json!({"status":"ok"}))
        }
        Err(e) => axum::Json(json!({"status":"error", "error": format!("{}", e)})),
    }
}

async fn verify_email(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(token): axum::extract::Path<String>,
) -> axum::Json<serde_json::Value> {
    let _ = sqlx::query("UPDATE users SET email_verified_at = CURRENT_TIMESTAMP, email_verification_token = NULL WHERE email_verification_token = ?")
        .bind(&token).execute(&state.pool).await;
    axum::Json(json!({"status":"ok","message": "Email подтверждён"}))
}

async fn forgot_password(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::Json(payload): axum::Json<ForgotPasswordPayload>,
) -> axum::Json<serde_json::Value> {
    match sqlx::query("SELECT id, name FROM users WHERE email = ?")
        .bind(&payload.email).fetch_optional(&state.pool).await
    {
        Ok(Some(row)) => {
            let name: Option<String> = row.get("name");
            let token = Uuid::new_v4().to_string();
            let _ = sqlx::query("DELETE FROM password_reset_tokens WHERE email = ?")
                .bind(&payload.email).execute(&state.pool).await;
            let _ = sqlx::query("INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))")
                .bind(&payload.email).bind(&token).execute(&state.pool).await;
            let _ = email::send_password_reset_email(&payload.email, name.as_deref().unwrap_or("Участник"), &token).await;
            axum::Json(json!({"status":"ok"}))
        }
        _ => axum::Json(json!({"status":"error","error":"Пользователь не найден"})),
    }
}

async fn reset_password(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::Json(payload): axum::Json<ResetPasswordPayload>,
) -> axum::Json<serde_json::Value> {
    let valid = sqlx::query(
        "SELECT 1 FROM password_reset_tokens WHERE email = ? AND token = ? AND expires_at > datetime('now')"
    )
        .bind(&payload.email).bind(&payload.token)
        .fetch_optional(&state.pool).await.ok().flatten().is_some();

    if !valid {
        return axum::Json(json!({"status":"error","error":"Неверный или просроченный токен"}));
    }

    let hashed = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST).unwrap();
    let _ = sqlx::query("UPDATE users SET password_hash = ? WHERE email = ?")
        .bind(&hashed).bind(&payload.email).execute(&state.pool).await;
    let _ = sqlx::query("DELETE FROM password_reset_tokens WHERE email = ?")
        .bind(&payload.email).execute(&state.pool).await;
    axum::Json(json!({"status":"ok"}))
}

async fn login(axum::extract::State(state): axum::extract::State<AppState>, axum::Json(payload): axum::Json<LoginPayload>) -> axum::Json<serde_json::Value> {
    let row = sqlx::query("SELECT id, password_hash, role FROM users WHERE email = ?")
        .bind(&payload.email).fetch_optional(&state.pool).await;
    match row {
        Ok(Some(r)) => {
            let id: i64 = r.get("id"); let pw_hash: String = r.get("password_hash"); let role: String = r.get("role");
            if bcrypt::verify(&payload.password, &pw_hash).unwrap_or(false) {
                match auth::generate_jwt(id, &role) {
                    Ok(token) => axum::Json(json!({"status":"ok", "token": token, "role": role})),
                    Err(e) => axum::Json(json!({"status":"error", "error": format!("{}", e)})),
                }
            } else { axum::Json(json!({"status":"error", "error":"invalid credentials"})) }
        }
        Ok(None) => axum::Json(json!({"status":"error", "error":"user not found"})),
        Err(e) => axum::Json(json!({"status":"error", "error": format!("{}", e)})),
    }
}

async fn get_auth_user(headers: &axum::http::HeaderMap) -> Result<(i64, String), axum::Json<serde_json::Value>> {
    let auth = headers.get("authorization").and_then(|v| v.to_str().ok());
    match auth {
        Some(a) if a.starts_with("Bearer ") => {
            match auth::decode_jwt(&a[7..]) {
                Ok(data) => Ok((data.claims.sub.parse().unwrap_or(0), data.claims.role)),
                Err(_) => Err(axum::Json(json!({"status":"error","error":"invalid token"}))),
            }
        }
        _ => Err(axum::Json(json!({"status":"error","error":"missing authorization"}))),
    }
}

async fn me(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    match sqlx::query("SELECT * FROM users WHERE id = ?").bind(user_id).fetch_optional(&state.pool).await {
        Ok(Some(r)) => axum::Json(json!({"status":"ok","user": user_from_row(&r)})),
        Ok(None) => axum::Json(json!({"status":"error","error":"user not found"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn update_me(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::Json(payload): axum::Json<UpdateProfilePayload>) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let res = sqlx::query(
         "UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), birth_date=COALESCE(?,birth_date), \
         birth_place=COALESCE(?,birth_place), passport_series=COALESCE(?,passport_series), \
         passport_number=COALESCE(?,passport_number), passport_issued_by=COALESCE(?,passport_issued_by), \
         passport_issue_date=COALESCE(?,passport_issue_date), passport_code=COALESCE(?,passport_code), \
         registration_address=COALESCE(?,registration_address), inn=COALESCE(?,inn), \
         snils=COALESCE(?,snils), team_name=COALESCE(?,team_name), squad_name=COALESCE(?,squad_name), \
         position=COALESCE(?,position) WHERE id=?"
    )
        .bind(&payload.name).bind(&payload.phone).bind(&payload.birth_date)
        .bind(&payload.birth_place).bind(&payload.passport_series).bind(&payload.passport_number)
        .bind(&payload.passport_issued_by).bind(&payload.passport_issue_date).bind(&payload.passport_code)
        .bind(&payload.registration_address).bind(&payload.inn).bind(&payload.snils)
        .bind(&payload.team_name).bind(&payload.squad_name).bind(&payload.position).bind(user_id)
        .execute(&state.pool).await;

    match res {
        Ok(_) => {
            match sqlx::query("SELECT * FROM users WHERE id = ?").bind(user_id).fetch_optional(&state.pool).await {
                Ok(Some(r)) => axum::Json(json!({"status":"ok","user": user_from_row(&r)})),
                _ => axum::Json(json!({"status":"ok"})),
            }
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn pd_consent(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    match sqlx::query("SELECT * FROM users WHERE id = ?").bind(user_id).fetch_optional(&state.pool).await {
        Ok(Some(r)) => {
            let name = r.get::<Option<String>, _>("name").unwrap_or_default();
            let email = r.get::<String, _>("email");
            let phone = r.get::<Option<String>, _>("phone").unwrap_or_default();
            let birth_date = r.get::<Option<String>, _>("birth_date").unwrap_or_default();
            let birth_place = r.get::<Option<String>, _>("birth_place").unwrap_or_default();
            let passport_series = r.get::<Option<String>, _>("passport_series").unwrap_or_default();
            let passport_number = r.get::<Option<String>, _>("passport_number").unwrap_or_default();
            let passport_issued_by = r.get::<Option<String>, _>("passport_issued_by").unwrap_or_default();
            let passport_issue_date = r.get::<Option<String>, _>("passport_issue_date").unwrap_or_default();
            let registration_address = r.get::<Option<String>, _>("registration_address").unwrap_or_default();
            let inn = r.get::<Option<String>, _>("inn").unwrap_or_default();
            let snils = r.get::<Option<String>, _>("snils").unwrap_or_default();

            let text = format!(
"СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ

Я, {name}, даю своё согласие организаторам Всероссийского медиаконкурса «Медиа РСО» \
на обработку моих персональных данных в соответствии с Федеральным законом № 152-ФЗ.

Персональные данные:
- ФИО: {name}
- Email: {email}
- Телефон: {phone}
- Дата рождения: {birth_date}
- Место рождения: {birth_place}
- Паспорт: серия {passport_series} номер {passport_number}
- Паспорт выдан: {passport_issued_by}
- Дата выдачи паспорта: {passport_issue_date}
- Адрес регистрации: {registration_address}
- ИНН: {inn}
- СНИЛС: {snils}

Цель обработки: участие в конкурсе, формирование отчётности, публикация результатов.
Срок действия согласия: до окончания проведения конкурса.
Согласие может быть отозвано путём направления письменного уведомления.

Дата: _______________     Подпись: _______________
"
            );
            axum::Json(json!({"status":"ok","consent_text": text}))
        }
        Ok(None) => axum::Json(json!({"status":"error","error":"user not found"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn change_password(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::Json(payload): axum::Json<ChangePasswordPayload>) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let row = sqlx::query("SELECT password_hash FROM users WHERE id = ?")
        .bind(user_id).fetch_optional(&state.pool).await;
    match row {
        Ok(Some(r)) => {
            let pw_hash: String = r.get("password_hash");
            if !bcrypt::verify(&payload.old_password, &pw_hash).unwrap_or(false) {
                return axum::Json(json!({"status":"error","error":"Неверный текущий пароль"}));
            }
            let new_hash = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST).unwrap();
            let _ = sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
                .bind(&new_hash).bind(user_id).execute(&state.pool).await;
            axum::Json(json!({"status":"ok"}))
        }
        _ => axum::Json(json!({"status":"error","error":"Пользователь не найден"})),
    }
}

async fn upload_avatar(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, mut multipart: Multipart) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let mut avatar_path: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        if field.name() == Some("avatar") {
            let filename = field.file_name().unwrap_or("avatar.png").to_string();
            let ext = PathBuf::from(&filename).extension().and_then(OsStr::to_str).unwrap_or("png").to_string();
            let stored = format!("avatars/{}.{}", Uuid::new_v4(), ext);
            let upload_path = PathBuf::from("./uploads").join(&stored);
            std::fs::create_dir_all("./uploads/avatars").ok();
            if let Ok(data) = field.bytes().await {
                let _ = std::fs::write(&upload_path, &data);
                avatar_path = Some(stored);
            }
            break;
        }
    }

    match avatar_path {
        Some(path) => {
            let _ = sqlx::query("UPDATE users SET avatar_url = ? WHERE id = ?")
                .bind(&path).bind(user_id).execute(&state.pool).await;
            axum::Json(json!({"status":"ok","avatar_url": path}))
        }
        None => axum::Json(json!({"status":"error","error":"Файл не найден"})),
    }
}

async fn submit_work(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::Json(payload): axum::Json<SubmissionPayload>) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let author_name = sqlx::query("SELECT name, email FROM users WHERE id = ?")
        .bind(user_id).fetch_optional(&state.pool).await
        .ok().flatten();
    match sqlx::query("INSERT INTO submissions (user_id, title, description, url, status) VALUES (?, ?, ?, ?, 'submitted')")
        .bind(user_id).bind(&payload.title).bind(&payload.description).bind(&payload.url).execute(&state.pool).await {
            Ok(r) => {
                if let Some(row) = &author_name {
                    let email: String = row.get("email");
                    let name: Option<String> = row.get("name");
                    let display_name = name.as_deref().unwrap_or("Участник");
                    let _ = email::send_submission_confirmation(&email, display_name, &payload.title).await;
                    let _ = email::notify_admins_submission(&state.pool, &payload.title, display_name).await;
                }
                axum::Json(json!({"status":"ok","id": r.last_insert_rowid()}))
            }
            Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
        }
}

async fn upload_work(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    mut multipart: Multipart,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };

    let mut title = String::new();
    let mut description: Option<String> = None;
    let mut file_path: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "title" => title = field.text().await.unwrap_or_default(),
            "description" => description = Some(field.text().await.unwrap_or_default()),
            "file" => {
                let filename = field.file_name().unwrap_or("file").to_string();
                let ext = PathBuf::from(&filename)
                    .extension()
                    .and_then(OsStr::to_str)
                    .unwrap_or("bin")
                    .to_string();
                if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
                    return axum::Json(json!({"status":"error","error":"Недопустимый формат файла. Разрешены: pdf, doc, docx, jpg, png, mp4, zip и др."}));
                }
                let stored = format!("{}.{}", Uuid::new_v4(), ext);
                let upload_path = PathBuf::from("./uploads").join(&stored);
                if let Ok(data) = field.bytes().await {
                    if data.len() > MAX_FILE_SIZE {
                        return axum::Json(json!({"status":"error","error":"Файл слишком большой. Максимум 100 MB"}));
                    }
                    let _ = std::fs::write(&upload_path, &data);
                    file_path = Some(stored);
                }
            }
            _ => {}
        }
    }

    if title.is_empty() {
        return axum::Json(json!({"status":"error","error":"Название обязательно"}));
    }

    let author_row = sqlx::query("SELECT name, email FROM users WHERE id = ?")
        .bind(user_id).fetch_optional(&state.pool).await
        .ok().flatten();

    match sqlx::query("INSERT INTO submissions (user_id, title, description, file_path, status) VALUES (?, ?, ?, ?, 'submitted')")
        .bind(user_id).bind(&title).bind(&description).bind(&file_path).execute(&state.pool).await
    {
        Ok(r) => {
            if let Some(row) = &author_row {
                let email: String = row.get("email");
                let name: Option<String> = row.get("name");
                let display_name = name.as_deref().unwrap_or("Участник");
                let _ = email::send_submission_confirmation(&email, display_name, &title).await;
                let _ = email::notify_admins_submission(&state.pool, &title, display_name).await;
            }
            axum::Json(json!({"status":"ok","id": r.last_insert_rowid(), "file_path": file_path}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn update_submission(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
    axum::Json(payload): axum::Json<UpdateSubmissionPayload>,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let sub = sqlx::query("SELECT user_id FROM submissions WHERE id = ?")
        .bind(id).fetch_optional(&state.pool).await;
    match sub {
        Ok(Some(r)) => {
            let owner: i64 = r.get("user_id");
            if owner != user_id {
                return axum::Json(json!({"status":"error","error":"forbidden"}));
            }
            let _ = sqlx::query(
                "UPDATE submissions SET title=COALESCE(?,title), description=COALESCE(?,description), url=COALESCE(?,url) WHERE id=?"
            )
                .bind(&payload.title).bind(&payload.description).bind(&payload.url).bind(id)
                .execute(&state.pool).await;
            axum::Json(json!({"status":"ok"}))
        }
        _ => axum::Json(json!({"status":"error","error":"not found"})),
    }
}

#[derive(Deserialize)]
struct StatusPayload { status: String }

async fn update_submission_status(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
    axum::Json(payload): axum::Json<StatusPayload>,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" && role != "expert" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }
    let valid = ["draft", "submitted", "under_review", "reviewed", "approved", "rejected"];
    if !valid.contains(&payload.status.as_str()) {
        return axum::Json(json!({"status":"error","error":"invalid status"}));
    }
    match sqlx::query("UPDATE submissions SET status = ? WHERE id = ?")
        .bind(&payload.status).bind(id).execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn list_submissions(axum::extract::State(state): axum::extract::State<AppState>) -> axum::Json<serde_json::Value> {
    match sqlx::query(
        "SELECT s.id, s.title, s.description, s.url, s.file_path, s.status, s.user_id, u.name, u.position, \
         p.id as partner_id, p.name as partner_name, p.position as partner_position, \
         p.avatar_url as partner_avatar, p.team_name as partner_team, p.squad_name as partner_squad \
         FROM submissions s \
         LEFT JOIN users u ON s.user_id = u.id \
         LEFT JOIN media_teams mt ON s.user_id IN (mt.user1_id, mt.user2_id) \
         LEFT JOIN users p ON p.id = CASE WHEN mt.user1_id = s.user_id THEN mt.user2_id ELSE mt.user1_id END \
         ORDER BY s.created_at DESC"
    )
        .fetch_all(&state.pool).await {
            Ok(rows) => {
                let submissions: Vec<serde_json::Value> = rows.iter().map(|r| {
                    let partner_id = r.get::<Option<i64>,_>("partner_id");
                    let partner = partner_id.map(|_| json!({
                        "id": partner_id,
                        "name": r.get::<Option<String>,_>("partner_name"),
                        "position": r.get::<Option<String>,_>("partner_position"),
                        "avatar": r.get::<Option<String>,_>("partner_avatar"),
                        "team": r.get::<Option<String>,_>("partner_team"),
                        "squad": r.get::<Option<String>,_>("partner_squad"),
                    }));
                    json!({
                        "id": r.get::<i64,_>("id"), "title": r.get::<String,_>("title"),
                        "description": r.get::<Option<String>,_>("description"), "url": r.get::<Option<String>,_>("url"),
                        "file_path": r.get::<Option<String>,_>("file_path"), "status": r.get::<Option<String>,_>("status"),
                        "user_id": r.get::<i64,_>("user_id"),
                        "author": r.get::<Option<String>,_>("name").unwrap_or("Anonymous".to_string()),
                        "author_position": r.get::<Option<String>,_>("position"),
                        "partner": partner,
                    })
                }).collect();
                axum::Json(json!({"status":"ok","submissions": submissions}))
            }
            Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
        }
}

async fn list_submissions_by_my_nominations(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "expert" && role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }

    match sqlx::query(
        "SELECT DISTINCT s.id, s.title, s.description, s.url, s.file_path, s.status, s.user_id, u.name, u.position, \
         p.id as partner_id, p.name as partner_name, p.position as partner_position, \
         p.avatar_url as partner_avatar, p.team_name as partner_team, p.squad_name as partner_squad \
         FROM submissions s \
         JOIN users u ON s.user_id = u.id \
         LEFT JOIN media_teams mt ON s.user_id IN (mt.user1_id, mt.user2_id) \
         LEFT JOIN users p ON p.id = CASE WHEN mt.user1_id = s.user_id THEN mt.user2_id ELSE mt.user1_id END \
         WHERE s.user_id IN ( \
           SELECT un.user_id FROM user_nominations un \
           WHERE un.nomination_id IN ( \
             SELECT un2.nomination_id FROM user_nominations un2 WHERE un2.user_id = ? \
           ) \
         ) \
         ORDER BY s.created_at DESC"
    )
        .bind(user_id)
        .fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let submissions: Vec<serde_json::Value> = rows.iter().map(|r| {
                let partner_id = r.get::<Option<i64>,_>("partner_id");
                let partner = partner_id.map(|_| json!({
                    "id": partner_id,
                    "name": r.get::<Option<String>,_>("partner_name"),
                    "position": r.get::<Option<String>,_>("partner_position"),
                    "avatar": r.get::<Option<String>,_>("partner_avatar"),
                    "team": r.get::<Option<String>,_>("partner_team"),
                    "squad": r.get::<Option<String>,_>("partner_squad"),
                }));
                json!({
                    "id": r.get::<i64,_>("id"), "title": r.get::<String,_>("title"),
                    "description": r.get::<Option<String>,_>("description"), "url": r.get::<Option<String>,_>("url"),
                    "file_path": r.get::<Option<String>,_>("file_path"), "status": r.get::<Option<String>,_>("status"),
                    "user_id": r.get::<i64,_>("user_id"),
                    "author": r.get::<Option<String>,_>("name").unwrap_or("Anonymous".to_string()),
                    "author_position": r.get::<Option<String>,_>("position"),
                    "partner": partner,
                })
            }).collect();
            axum::Json(json!({"status":"ok","submissions": submissions}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn get_submission(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> axum::Json<serde_json::Value> {
    match sqlx::query(
        "SELECT s.id, s.title, s.description, s.url, s.file_path, s.status, s.user_id, \
         u.name, u.phone, u.avatar_url, u.team_name, u.squad_name, u.email, u.position, \
         p.id as partner_id, p.name as partner_name, p.position as partner_position, \
         p.phone as partner_phone, p.email as partner_email, \
         p.avatar_url as partner_avatar, p.team_name as partner_team, p.squad_name as partner_squad \
         FROM submissions s \
         JOIN users u ON s.user_id = u.id \
         LEFT JOIN media_teams mt ON s.user_id IN (mt.user1_id, mt.user2_id) \
         LEFT JOIN users p ON p.id = CASE WHEN mt.user1_id = s.user_id THEN mt.user2_id ELSE mt.user1_id END \
         WHERE s.id = ?"
    )
        .bind(id).fetch_optional(&state.pool).await {
            Ok(Some(r)) => {
                let user_id: i64 = r.get("user_id");
                let partner_id = r.get::<Option<i64>,_>("partner_id");
                let partner = partner_id.map(|_| json!({
                    "id": partner_id,
                    "name": r.get::<Option<String>,_>("partner_name"),
                    "position": r.get::<Option<String>,_>("partner_position"),
                    "phone": r.get::<Option<String>,_>("partner_phone"),
                    "email": r.get::<Option<String>,_>("partner_email"),
                    "avatar": r.get::<Option<String>,_>("partner_avatar"),
                    "team": r.get::<Option<String>,_>("partner_team"),
                    "squad": r.get::<Option<String>,_>("partner_squad"),
                }));
                let nomination_ids: Vec<i64> = sqlx::query("SELECT nomination_id FROM user_nominations WHERE user_id = ?")
                    .bind(user_id).fetch_all(&state.pool).await.unwrap_or_default()
                    .iter().map(|r| r.get::<i64,_>("nomination_id")).collect();

                let (viewer_id, viewer_role) = match get_auth_user(&headers).await {
                    Ok(u) => u,
                    Err(_) => (0, "".to_string()),
                };

                let has_scored = if viewer_role == "expert" && viewer_id > 0 {
                    sqlx::query("SELECT 1 FROM scores WHERE submission_id = ? AND expert_id = ? LIMIT 1")
                        .bind(id).bind(viewer_id)
                        .fetch_optional(&state.pool).await
                        .ok().flatten().is_some()
                } else {
                    true
                };

                let anonymous = viewer_role == "expert" && !has_scored;

                let (author_name, author_email, author_phone, author_avatar, author_team, author_squad, author_position) = if anonymous {
                    (Some("Анонимный участник".to_string()), "".to_string(), None, None, None, None, None)
                } else {
                    (r.get::<Option<String>,_>("name"), r.get::<String,_>("email"),
                     r.get::<Option<String>,_>("phone"), r.get::<Option<String>,_>("avatar_url"),
                     r.get::<Option<String>,_>("team_name"), r.get::<Option<String>,_>("squad_name"),
                     r.get::<Option<String>,_>("position"))
                };

                axum::Json(json!({"status":"ok","submission":{
                    "id": r.get::<i64,_>("id"), "title": r.get::<String,_>("title"),
                    "description": r.get::<Option<String>,_>("description"), "url": r.get::<Option<String>,_>("url"),
                    "file_path": r.get::<Option<String>,_>("file_path"), "status": r.get::<Option<String>,_>("status"),
                    "user_id": user_id, "nomination_ids": nomination_ids,
                    "author": author_name,
                    "author_position": author_position,
                    "author_phone": author_phone,
                    "author_avatar": author_avatar,
                    "author_team": author_team,
                    "author_squad": author_squad,
                    "author_email": author_email,
                    "anonymous": anonymous,
                    "partner": partner,
                }}))
            }
            Ok(None) => axum::Json(json!({"status":"error","error":"not found"})),
            Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
        }
}

async fn get_scores(axum::extract::State(state): axum::extract::State<AppState>, axum::extract::Path(id): axum::extract::Path<i64>) -> axum::Json<serde_json::Value> {
    match sqlx::query("SELECT s.id, s.score, s.comment, c.name as criterion, u.name as expert FROM scores s JOIN criteria c ON s.criterion_id = c.id JOIN users u ON s.expert_id = u.id WHERE s.submission_id = ?")
        .bind(id).fetch_all(&state.pool).await {
            Ok(rows) => {
                let scores: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                    "id": r.get::<i64,_>("id"), "criterion": r.get::<String,_>("criterion"),
                    "score": r.get::<i32,_>("score"), "comment": r.get::<Option<String>,_>("comment"),
                    "expert": r.get::<Option<String>,_>("expert"),
                })).collect();
                axum::Json(json!({"status":"ok","scores": scores}))
            }
            Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
        }
}

async fn add_score(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::extract::Path(id): axum::extract::Path<i64>, axum::Json(payload): axum::Json<ScorePayload>) -> axum::Json<serde_json::Value> {
    let (expert_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "expert" && role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }
    match sqlx::query("INSERT INTO scores (submission_id, expert_id, criterion_id, score, comment) VALUES (?, ?, ?, ?, ?)")
        .bind(id).bind(expert_id).bind(payload.criterion_id).bind(payload.score).bind(&payload.comment).execute(&state.pool).await {
            Ok(r) => {
                let _ = sqlx::query("UPDATE submissions SET status = 'under_review' WHERE id = ? AND status = 'submitted'")
                    .bind(id).execute(&state.pool).await;

                let submission_info = sqlx::query(
                    "SELECT u.email, u.name, s.title FROM submissions s \
                     JOIN users u ON s.user_id = u.id WHERE s.id = ?"
                ).bind(id).fetch_optional(&state.pool).await.ok().flatten();
                if let Some(ref row) = submission_info {
                    let email: String = row.get("email");
                    let name: Option<String> = row.get("name");
                    let title: String = row.get("title");
                    let _ = email::send_work_scored(&email, name.as_deref().unwrap_or("Участник"), &title).await;
                }

                axum::Json(json!({"status":"ok","id": r.last_insert_rowid()}))
            }
            Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
        }
}

async fn get_winner(axum::extract::State(state): axum::extract::State<AppState>, axum::extract::Path(id): axum::extract::Path<i64>) -> axum::Json<serde_json::Value> {
    match sqlx::query("SELECT SUM(score) as total_score FROM scores WHERE submission_id = ?").bind(id).fetch_optional(&state.pool).await {
        Ok(Some(r)) => axum::Json(json!({"status":"ok","submission_id": id, "total_score": r.get::<Option<i64>,_>("total_score").unwrap_or(0)})),
        Ok(None) => axum::Json(json!({"status":"ok","submission_id": id, "total_score": 0})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn scores_my_history(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "expert" && role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }
    match sqlx::query(
        "SELECT sc.id, sc.score, sc.comment, sc.created_at, sc.submission_id, sc.criterion_id, \
         c.name as criterion, s.title as work_title \
         FROM scores sc \
         JOIN criteria c ON sc.criterion_id = c.id \
         JOIN submissions s ON sc.submission_id = s.id \
         WHERE sc.expert_id = ? ORDER BY sc.created_at DESC"
    )
        .bind(user_id).fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let scores: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"), "score": r.get::<i32,_>("score"),
                "comment": r.get::<Option<String>,_>("comment"),
                "created_at": r.get::<String,_>("created_at"),
                "submission_id": r.get::<i64,_>("submission_id"),
                "criterion_id": r.get::<i64,_>("criterion_id"),
                "criterion": r.get::<String,_>("criterion"),
                "work_title": r.get::<String,_>("work_title"),
            })).collect();
            axum::Json(json!({"status":"ok","scores": scores}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct UpdateScorePayload { score: Option<i32>, comment: Option<String> }

async fn update_score(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
    axum::Json(payload): axum::Json<UpdateScorePayload>,
) -> axum::Json<serde_json::Value> {
    let (user_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "expert" && role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }
    match sqlx::query("UPDATE scores SET score=COALESCE(?,score), comment=COALESCE(?,comment) WHERE id=? AND expert_id=?")
        .bind(payload.score).bind(&payload.comment).bind(id).bind(user_id).execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn list_favorites(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    match sqlx::query(
        "SELECT f.submission_id, s.title, s.url, s.file_path, s.status \
         FROM favorites f JOIN submissions s ON f.submission_id = s.id \
         WHERE f.user_id = ? ORDER BY f.created_at DESC"
    )
        .bind(user_id).fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let favorites: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("submission_id"),
                "title": r.get::<String,_>("title"),
                "url": r.get::<Option<String>,_>("url"),
                "file_path": r.get::<Option<String>,_>("file_path"),
                "status": r.get::<Option<String>,_>("status"),
            })).collect();
            axum::Json(json!({"status":"ok","favorites": favorites}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn add_favorite(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    match sqlx::query("INSERT OR IGNORE INTO favorites (user_id, submission_id) VALUES (?, ?)")
        .bind(user_id).bind(id).execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn remove_favorite(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    let _ = sqlx::query("DELETE FROM favorites WHERE user_id = ? AND submission_id = ?")
        .bind(user_id).bind(id).execute(&state.pool).await;
    axum::Json(json!({"status":"ok"}))
}

async fn get_admin_comments(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(submission_id): axum::extract::Path<i64>,
) -> axum::Json<serde_json::Value> {
    match sqlx::query(
        "SELECT ac.id, ac.comment, ac.created_at, u.name as admin_name \
         FROM admin_comments ac JOIN users u ON ac.admin_id = u.id \
         WHERE ac.submission_id = ? ORDER BY ac.created_at DESC"
    )
        .bind(submission_id).fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let comments: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"),
                "comment": r.get::<String,_>("comment"),
                "admin_name": r.get::<Option<String>,_>("admin_name"),
                "created_at": r.get::<String,_>("created_at"),
            })).collect();
            axum::Json(json!({"status":"ok","comments": comments}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct AddCommentPayload { comment: String }

async fn add_admin_comment(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(submission_id): axum::extract::Path<i64>,
    axum::Json(payload): axum::Json<AddCommentPayload>,
) -> axum::Json<serde_json::Value> {
    let (admin_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }
    match sqlx::query("INSERT INTO admin_comments (submission_id, admin_id, comment) VALUES (?, ?, ?)")
        .bind(submission_id).bind(admin_id).bind(&payload.comment).execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn get_compare(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> axum::Json<serde_json::Value> {
    let ids_str = params.get("ids").cloned().unwrap_or_default();
    let ids: Vec<i64> = ids_str.split(',').filter_map(|s| s.trim().parse().ok()).collect();
    if ids.is_empty() {
        return axum::Json(json!({"status":"error","error":"ids required"}));
    }

    let mut result = Vec::new();
    for sub_id in &ids {
        let sub = sqlx::query(
            "SELECT s.id, s.title, s.description, s.url, s.file_path, s.status, u.name as author \
             FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.id = ?"
        )
            .bind(sub_id).fetch_optional(&state.pool).await.ok().flatten();

        if let Some(r) = sub {
            let scores = sqlx::query(
                "SELECT sc.score, sc.comment, c.name as criterion \
                 FROM scores sc JOIN criteria c ON sc.criterion_id = c.id WHERE sc.submission_id = ?"
            )
                .bind(sub_id).fetch_all(&state.pool).await.unwrap_or_default();
            let score_list: Vec<serde_json::Value> = scores.iter().map(|s| json!({
                "criterion": s.get::<String,_>("criterion"),
                "score": s.get::<i32,_>("score"),
                "comment": s.get::<Option<String>,_>("comment"),
            })).collect();

            result.push(json!({
                "id": r.get::<i64,_>("id"),
                "title": r.get::<String,_>("title"),
                "description": r.get::<Option<String>,_>("description"),
                "url": r.get::<Option<String>,_>("url"),
                "file_path": r.get::<Option<String>,_>("file_path"),
                "status": r.get::<Option<String>,_>("status"),
                "author": r.get::<Option<String>,_>("author"),
                "scores": score_list,
            }));
        }
    }

    axum::Json(json!({"status":"ok","submissions": result}))
}

async fn list_criteria(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> axum::Json<serde_json::Value> {
    let nomination_filter = params.get("nomination_id").and_then(|v| v.parse::<i64>().ok());
    let query = match nomination_filter {
        Some(nom_id) => sqlx::query("SELECT id, name, description, max_score, weight, nomination_id FROM criteria WHERE nomination_id IS NULL OR nomination_id = ?")
            .bind(nom_id).fetch_all(&state.pool).await,
        None => sqlx::query("SELECT id, name, description, max_score, weight, nomination_id FROM criteria")
            .fetch_all(&state.pool).await,
    };
    match query {
        Ok(rows) => {
            let criteria: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"), "name": r.get::<String,_>("name"),
                "description": r.get::<Option<String>,_>("description"), "max_score": r.get::<i32,_>("max_score"),
                "weight": r.get::<Option<f64>,_>("weight"), "nomination_id": r.get::<Option<i64>,_>("nomination_id"),
            })).collect();
            axum::Json(json!({"status":"ok","criteria": criteria}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn admin_stats(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    let users_cnt = sqlx::query("SELECT COUNT(*) as cnt FROM users").fetch_one(&state.pool).await.map(|r| r.get::<i64,_>("cnt")).unwrap_or(0);
    let submissions_cnt = sqlx::query("SELECT COUNT(*) as cnt FROM submissions").fetch_one(&state.pool).await.map(|r| r.get::<i64,_>("cnt")).unwrap_or(0);
    axum::Json(json!({"status":"ok","counts": {"users": users_cnt, "submissions": submissions_cnt}}))
}

async fn admin_users(axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    match sqlx::query("SELECT * FROM users").fetch_all(&state.pool).await {
        Ok(rows) => {
            let users: Vec<serde_json::Value> = rows.iter().map(|r| user_from_row(&r)).collect();
            axum::Json(json!({"status":"ok","users": users}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct ChangeRolePayload { role: String }

async fn admin_change_role(axum::extract::Path(target_id): axum::extract::Path<i64>, axum::extract::State(state): axum::extract::State<AppState>, headers: axum::http::HeaderMap, axum::Json(payload): axum::Json<ChangeRolePayload>) -> axum::Json<serde_json::Value> {
    let valid_roles = ["participant", "expert", "admin", "hq"];
    if !valid_roles.contains(&payload.role.as_str()) { return axum::Json(json!({"status":"error","error":"invalid role"})); }
    let (my_id, my_role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if my_role != "admin" && my_role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    if target_id == my_id { return axum::Json(json!({"status":"error","error":"cannot change your own role"})); }
    match sqlx::query("UPDATE users SET role = ? WHERE id = ?").bind(&payload.role).bind(target_id).execute(&state.pool).await {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn admin_seed(axum::extract::State(state): axum::extract::State<AppState>) -> axum::Json<serde_json::Value> {
    let hashed = bcrypt::hash("admin123", bcrypt::DEFAULT_COST).unwrap();
    let existing = sqlx::query("SELECT id FROM users WHERE email = ?").bind("admin@mediarso.ru").fetch_optional(&state.pool).await.unwrap_or(None);
    if existing.is_none() {
        sqlx::query("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)")
            .bind("admin@mediarso.ru").bind(&hashed).bind("admin").bind("Главный администратор")
            .execute(&state.pool).await.ok();
        axum::Json(json!({"status":"ok","message":"Admin created: admin@mediarso.ru / admin123"}))
    } else {
        axum::Json(json!({"status":"ok","message":"Admin already exists"}))
    }
}

#[derive(Deserialize)]
struct AssignExpertPayload { expert_id: i64, submission_ids: Vec<i64> }

async fn admin_assign_expert(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::Json(payload): axum::Json<AssignExpertPayload>,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    for sid in &payload.submission_ids {
        let _ = sqlx::query("INSERT OR IGNORE INTO expert_submissions (expert_id, submission_id) VALUES (?, ?)")
            .bind(payload.expert_id).bind(sid).execute(&state.pool).await;
    }
    axum::Json(json!({"status":"ok"}))
}

async fn admin_auto_assign(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    let experts = sqlx::query("SELECT id FROM users WHERE role = 'expert'")
        .fetch_all(&state.pool).await.unwrap_or_default();
    if experts.is_empty() {
        return axum::Json(json!({"status":"error","error":"Нет экспертов"}));
    }

    let submissions = sqlx::query(
        "SELECT s.id, un.nomination_id FROM submissions s \
         JOIN user_nominations un ON s.user_id = un.user_id \
         WHERE s.id NOT IN (SELECT submission_id FROM expert_submissions) \
         ORDER BY s.id"
    )
        .fetch_all(&state.pool).await.unwrap_or_default();

    let mut counts: Vec<(i64, i64)> = experts.iter().map(|r| (r.get::<i64,_>("id"), 0i64)).collect();
    for sub in &submissions {
        let sub_id: i64 = sub.get("id");
        let nom_id: Option<i64> = sub.get("nomination_id");

        let expert_ids: Vec<i64> = sqlx::query(
            "SELECT un.user_id FROM user_nominations un WHERE un.nomination_id = ? AND un.user_id IN (SELECT id FROM users WHERE role = 'expert')"
        )
            .bind(nom_id)
            .fetch_all(&state.pool).await.unwrap_or_default()
            .iter().map(|r| r.get::<i64,_>("user_id")).collect();

        let available: Vec<(i64, i64)> = counts.iter()
            .filter(|(id, _)| expert_ids.is_empty() || expert_ids.contains(id))
            .cloned().collect();

        if let Some(min) = available.iter().min_by_key(|(_, cnt)| cnt) {
            let _ = sqlx::query("INSERT OR IGNORE INTO expert_submissions (expert_id, submission_id) VALUES (?, ?)")
                .bind(min.0).bind(sub_id).execute(&state.pool).await;
            if let Some(entry) = counts.iter_mut().find(|(id, _)| *id == min.0) {
                entry.1 += 1;
            }
        }
    }

    axum::Json(json!({"status":"ok"}))
}

#[derive(Deserialize)]
struct ModeratePayload { status: String, comment: Option<String> }

async fn admin_submissions_list(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    let main = sqlx::query(
        "SELECT s.id, s.title, s.description, s.url, s.file_path, s.status, s.user_id, \
         s.moderation_comment, s.moderated_at, s.created_at, \
         u.name as author_name, u.email as author_email, u.team_name, u.squad_name, u.position, \
         m.name as moderator_name, \
         (SELECT COUNT(*) FROM scores WHERE submission_id = s.id) as score_count, \
         (SELECT COALESCE(AVG(score), 0) FROM scores WHERE submission_id = s.id) as avg_score \
         FROM submissions s \
         JOIN users u ON s.user_id = u.id \
         LEFT JOIN users m ON s.moderated_by = m.id \
         ORDER BY s.created_at DESC"
    )
        .fetch_all(&state.pool).await;

    let noms = sqlx::query(
        "SELECT un.user_id, un.nomination_id, n.name as nom_name \
         FROM user_nominations un JOIN nominations n ON un.nomination_id = n.id"
    )
        .fetch_all(&state.pool).await.unwrap_or_default();

    let nom_map: std::collections::HashMap<i64, Vec<(i64, String)>> = {
        let mut m: std::collections::HashMap<i64, Vec<(i64, String)>> = std::collections::HashMap::new();
        for n in &noms {
            let uid: i64 = n.get("user_id");
            let nid: i64 = n.get("nomination_id");
            let nm: String = n.get("nom_name");
            m.entry(uid).or_default().push((nid, nm));
        }
        m
    };

    match main {
        Ok(rows) => {
            let submissions: Vec<serde_json::Value> = rows.iter().map(|r| {
                let user_id: i64 = r.get("user_id");
                let user_noms = nom_map.get(&user_id).cloned().unwrap_or_default();
                let nom_ids: Vec<i64> = user_noms.iter().map(|(id, _)| *id).collect();
                let avg_score: f64 = r.get::<f64,_>("avg_score");

                json!({
                    "id": r.get::<i64,_>("id"),
                    "title": r.get::<String,_>("title"),
                    "description": r.get::<Option<String>,_>("description"),
                    "url": r.get::<Option<String>,_>("url"),
                    "file_path": r.get::<Option<String>,_>("file_path"),
                    "status": r.get::<Option<String>,_>("status"),
                    "user_id": user_id,
                    "author_name": r.get::<Option<String>,_>("author_name"),
                    "author_email": r.get::<String,_>("author_email"),
                    "team_name": r.get::<Option<String>,_>("team_name"),
                    "squad_name": r.get::<Option<String>,_>("squad_name"),
                    "author_position": r.get::<Option<String>,_>("position"),
                    "moderation_comment": r.get::<Option<String>,_>("moderation_comment"),
                    "moderator_name": r.get::<Option<String>,_>("moderator_name"),
                    "moderated_at": r.get::<Option<String>,_>("moderated_at"),
                    "created_at": r.get::<String,_>("created_at"),
                    "nomination_ids": nom_ids,
                    "score_count": r.get::<i64,_>("score_count"),
                    "avg_score": (avg_score * 100.0).round() / 100.0,
                })
            }).collect();
            axum::Json(json!({"status":"ok","submissions": submissions}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn admin_moderate_submission(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(id): axum::extract::Path<i64>,
    axum::Json(payload): axum::Json<ModeratePayload>,
) -> axum::Json<serde_json::Value> {
    let (admin_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    let valid = ["approved", "rejected"];
    if !valid.contains(&payload.status.as_str()) {
        return axum::Json(json!({"status":"error","error":"Недопустимый статус. Используйте approved или rejected"}));
    }

    let sub = sqlx::query("SELECT title, user_id FROM submissions WHERE id = ?")
        .bind(id).fetch_optional(&state.pool).await;

    match sub {
        Ok(Some(r)) => {
            let title: String = r.get("title");
            let author_id: i64 = r.get("user_id");

            match sqlx::query(
                "UPDATE submissions SET status = ?, moderation_comment = ?, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ?"
            )
                .bind(&payload.status).bind(&payload.comment).bind(admin_id).bind(id)
                .execute(&state.pool).await
            {
                Ok(_) => {
                    let _ = log_audit(&state.pool, admin_id, &payload.status, "submission", Some(id),
                        Some(&format!("Статус работы «{}» изменён на «{}»", title, payload.status))).await;

                    let author = sqlx::query("SELECT email, name FROM users WHERE id = ?")
                        .bind(author_id).fetch_optional(&state.pool).await.ok().flatten();
                    if let Some(ref row) = author {
                        let email: String = row.get("email");
                        let name: Option<String> = row.get("name");
                        let status_label = if payload.status == "approved" { "одобрена" } else { "отклонена" };
                        let _ = email::send_email(&email, "Статус работы обновлён",
                            &format!("<p>Здравствуйте, {}!</p><p>Ваша работа «{}» была {}.</p>{}",
                                name.as_deref().unwrap_or("Участник"), &title, status_label,
                                payload.comment.as_ref().map(|c| format!("<p>Комментарий: {}</p>", c)).unwrap_or_default()
                            )).await;
                    }

                    axum::Json(json!({"status":"ok"}))
                }
                Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
            }
        }
        Ok(None) => axum::Json(json!({"status":"error","error":"Работа не найдена"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn admin_audit_log(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    match sqlx::query(
        "SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, \
         u.name as admin_name, u.email as admin_email \
         FROM audit_log a \
         JOIN users u ON a.admin_id = u.id \
         ORDER BY a.created_at DESC LIMIT 200"
    )
        .fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let entries: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"),
                "action": r.get::<String,_>("action"),
                "entity_type": r.get::<Option<String>,_>("entity_type"),
                "entity_id": r.get::<Option<i64>,_>("entity_id"),
                "details": r.get::<Option<String>,_>("details"),
                "admin_name": r.get::<Option<String>,_>("admin_name"),
                "admin_email": r.get::<String,_>("admin_email"),
                "created_at": r.get::<String,_>("created_at"),
            })).collect();
            axum::Json(json!({"status":"ok","entries": entries}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn admin_nomination_report(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    match sqlx::query("SELECT id, name, description FROM nominations ORDER BY id")
        .fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let mut reports = Vec::new();
            for r in &rows {
                let nom_id: i64 = r.get("id");
                let nom_name: String = r.get("name");

                let participant_count: i64 = sqlx::query(
                    "SELECT COUNT(DISTINCT user_id) as cnt FROM user_nominations WHERE nomination_id = ?"
                ).bind(nom_id).fetch_one(&state.pool).await
                    .map(|r2| r2.get::<i64,_>("cnt")).unwrap_or(0);

                let submission_count: i64 = sqlx::query(
                    "SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s \
                     JOIN user_nominations un ON s.user_id = un.user_id \
                     WHERE un.nomination_id = ?"
                ).bind(nom_id).fetch_one(&state.pool).await
                    .map(|r2| r2.get::<i64,_>("cnt")).unwrap_or(0);

                let scored_count: i64 = sqlx::query(
                    "SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s \
                     JOIN user_nominations un ON s.user_id = un.user_id \
                     WHERE un.nomination_id = ? AND s.id IN (SELECT DISTINCT submission_id FROM scores)"
                ).bind(nom_id).fetch_one(&state.pool).await
                    .map(|r2| r2.get::<i64,_>("cnt")).unwrap_or(0);

                let avg_score: f64 = sqlx::query(
                    "SELECT COALESCE(AVG(sc.score), 0) as avg FROM scores sc \
                     JOIN submissions s ON sc.submission_id = s.id \
                     JOIN user_nominations un ON s.user_id = un.user_id \
                     WHERE un.nomination_id = ?"
                ).bind(nom_id).fetch_one(&state.pool).await
                    .map(|r2| r2.get::<f64,_>("avg")).unwrap_or(0.0);

                let approved_count: i64 = sqlx::query(
                    "SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s \
                     JOIN user_nominations un ON s.user_id = un.user_id \
                     WHERE un.nomination_id = ? AND s.status = 'approved'"
                ).bind(nom_id).fetch_one(&state.pool).await
                    .map(|r2| r2.get::<i64,_>("cnt")).unwrap_or(0);

                reports.push(json!({
                    "id": nom_id,
                    "name": nom_name,
                    "description": r.get::<Option<String>,_>("description"),
                    "participant_count": participant_count,
                    "submission_count": submission_count,
                    "scored_count": scored_count,
                    "avg_score": (avg_score * 100.0).round() / 100.0,
                    "approved_count": approved_count,
                }));
            }
            axum::Json(json!({"status":"ok","reports": reports}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn list_nominations(axum::extract::State(state): axum::extract::State<AppState>) -> axum::Json<serde_json::Value> {
    match sqlx::query("SELECT id, name, description FROM nominations ORDER BY id").fetch_all(&state.pool).await {
        Ok(rows) => {
            let noms: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"),
                "name": r.get::<String,_>("name"),
                "description": r.get::<Option<String>,_>("description"),
            })).collect();
            axum::Json(json!({"status":"ok","nominations": noms}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn get_user_nominations(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(user_id): axum::extract::Path<i64>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    match sqlx::query("SELECT nomination_id FROM user_nominations WHERE user_id = ?").bind(user_id).fetch_all(&state.pool).await {
        Ok(rows) => {
            let ids: Vec<i64> = rows.iter().map(|r| r.get::<i64,_>("nomination_id")).collect();
            axum::Json(json!({"status":"ok","nomination_ids": ids}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct UpdateNominationsPayload { nomination_ids: Vec<i64> }

async fn update_user_nominations(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(user_id): axum::extract::Path<i64>,
    headers: axum::http::HeaderMap,
    axum::Json(payload): axum::Json<UpdateNominationsPayload>,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }

    let user_row = sqlx::query("SELECT email, name FROM users WHERE id = ?")
        .bind(user_id).fetch_optional(&state.pool).await.ok().flatten();

    let _ = sqlx::query("DELETE FROM user_nominations WHERE user_id = ?").bind(user_id).execute(&state.pool).await;
    for nom_id in &payload.nomination_ids {
        let _ = sqlx::query("INSERT OR IGNORE INTO user_nominations (user_id, nomination_id) VALUES (?, ?)")
            .bind(user_id).bind(nom_id).execute(&state.pool).await;
        if let Some(ref row) = user_row {
            let email: String = row.get("email");
            let name: Option<String> = row.get("name");
            let nom_name: Option<String> = sqlx::query("SELECT name FROM nominations WHERE id = ?")
                .bind(nom_id).fetch_optional(&state.pool).await.ok().flatten()
                .map(|r| r.get("name"));
            if let Some(ref nom) = nom_name {
                let _ = email::send_nomination_assigned(&email, name.as_deref().unwrap_or("Участник"), nom).await;
            }
        }
    }
    axum::Json(json!({"status":"ok"}))
}

async fn get_timeline(axum::extract::State(state): axum::extract::State<AppState>) -> axum::Json<serde_json::Value> {
    let settings = sqlx::query("SELECT key, value FROM settings").fetch_all(&state.pool).await.unwrap_or_default();
    let sub_deadline = settings.iter().find(|r| r.get::<String,_>("key") == "submission_deadline").map(|r| r.get::<String,_>("value"));
    let eval_deadline = settings.iter().find(|r| r.get::<String,_>("key") == "evaluation_deadline").map(|r| r.get::<String,_>("value"));

    let mut events = Vec::new();
    events.push(json!({"event":"Старт приёма заявок","date":"2026-09-01T00:00:00","icon":"flag","active": true}));
    if let Some(d) = &sub_deadline {
        events.push(json!({"event":"Окончание приёма работ","date": d, "icon":"upload","active": true}));
    }
    if let Some(d) = &eval_deadline {
        events.push(json!({"event":"Окончание оценки","date": d, "icon":"score","active": true}));
    }
    events.push(json!({"event":"Объявление победителей","date":"2026-11-15T00:00:00","icon":"trophy","active": false}));

    axum::Json(json!({"status":"ok","events": events}))
}

async fn list_settings(axum::extract::State(state): axum::extract::State<AppState>) -> axum::Json<serde_json::Value> {
    match sqlx::query("SELECT key, value, description FROM settings").fetch_all(&state.pool).await {
        Ok(rows) => {
            let settings: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "key": r.get::<String,_>("key"),
                "value": r.get::<String,_>("value"),
                "description": r.get::<Option<String>,_>("description"),
            })).collect();
            axum::Json(json!({"status":"ok","settings": settings}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct UpdateSettingPayload { value: String }

async fn update_setting(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(key): axum::extract::Path<String>,
    headers: axum::http::HeaderMap,
    axum::Json(payload): axum::Json<UpdateSettingPayload>,
) -> axum::Json<serde_json::Value> {
    let (_, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "admin" && role != "hq" { return axum::Json(json!({"status":"error","error":"forbidden"})); }
    match sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(&key).bind(&payload.value).execute(&state.pool).await {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

#[derive(Deserialize)]
struct CreateTeamPayload { partner_email: String }

async fn create_media_team(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
    axum::Json(payload): axum::Json<CreateTeamPayload>,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };

    let partner = sqlx::query("SELECT id FROM users WHERE email = ?")
        .bind(&payload.partner_email)
        .fetch_optional(&state.pool).await;

    let partner_id = match partner {
        Ok(Some(r)) => r.get::<i64,_>("id"),
        _ => return axum::Json(json!({"status":"error","error":"Пользователь не найден"})),
    };

    if partner_id == user_id {
        return axum::Json(json!({"status":"error","error":"Нельзя создать команду с самим собой"}));
    }

    let already = sqlx::query(
        "SELECT id FROM media_teams WHERE (user1_id = ? OR user2_id = ?) OR (user1_id = ? OR user2_id = ?)"
    )
        .bind(user_id).bind(user_id).bind(partner_id).bind(partner_id)
        .fetch_optional(&state.pool).await;

    if let Ok(Some(_)) = already {
        return axum::Json(json!({"status":"error","error":"Один из вас уже состоит в команде"}));
    }

    match sqlx::query("INSERT INTO media_teams (user1_id, user2_id) VALUES (?, ?)")
        .bind(user_id).bind(partner_id)
        .execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn get_my_team(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };

    let team = sqlx::query(
        "SELECT mt.id, mt.user1_id, mt.user2_id, \
         u.id as partner_id, u.name as partner_name, u.position as partner_position, \
         u.phone as partner_phone, u.email as partner_email, \
         u.avatar_url as partner_avatar, u.team_name as partner_team, u.squad_name as partner_squad \
         FROM media_teams mt \
         JOIN users u ON u.id = CASE WHEN mt.user1_id = ? THEN mt.user2_id ELSE mt.user1_id END \
         WHERE ? IN (mt.user1_id, mt.user2_id)"
    )
        .bind(user_id).bind(user_id)
        .fetch_optional(&state.pool).await;

    match team {
        Ok(Some(r)) => axum::Json(json!({"status":"ok","team":{
            "id": r.get::<i64,_>("id"),
            "partner": {
                "id": r.get::<i64,_>("partner_id"),
                "name": r.get::<Option<String>,_>("partner_name"),
                "position": r.get::<Option<String>,_>("partner_position"),
                "phone": r.get::<Option<String>,_>("partner_phone"),
                "email": r.get::<String,_>("partner_email"),
                "avatar": r.get::<Option<String>,_>("partner_avatar"),
                "team": r.get::<Option<String>,_>("partner_team"),
                "squad": r.get::<Option<String>,_>("partner_squad"),
            }
        }})),
        Ok(None) => axum::Json(json!({"status":"ok","team": null})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn leave_media_team(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, _) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };

    match sqlx::query("DELETE FROM media_teams WHERE user1_id = ? OR user2_id = ?")
        .bind(user_id).bind(user_id)
        .execute(&state.pool).await
    {
        Ok(_) => axum::Json(json!({"status":"ok"})),
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}

async fn expert_dashboard_data(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: axum::http::HeaderMap,
) -> axum::Json<serde_json::Value> {
    let (user_id, role) = match get_auth_user(&headers).await { Ok(u) => u, Err(e) => return e };
    if role != "expert" && role != "admin" && role != "hq" {
        return axum::Json(json!({"status":"error","error":"forbidden"}));
    }

    let total_criteria: i64 = sqlx::query("SELECT COUNT(*) as cnt FROM criteria")
        .fetch_one(&state.pool).await
        .map(|r| r.get::<i64,_>("cnt"))
        .unwrap_or(0);

    let subs_count: i64 = if role == "expert" {
        sqlx::query(
            "SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s \
             WHERE s.user_id IN ( \
               SELECT un.user_id FROM user_nominations un \
               WHERE un.nomination_id IN ( \
                 SELECT un2.nomination_id FROM user_nominations un2 WHERE un2.user_id = ? \
               ) \
             )"
        )
            .bind(user_id)
            .fetch_one(&state.pool).await
            .map(|r| r.get::<i64,_>("cnt"))
            .unwrap_or(0)
    } else {
        sqlx::query("SELECT COUNT(*) as cnt FROM submissions")
            .fetch_one(&state.pool).await
            .map(|r| r.get::<i64,_>("cnt"))
            .unwrap_or(0)
    };

    let my_scored: i64 = sqlx::query(
        "SELECT COUNT(DISTINCT submission_id) as cnt FROM scores WHERE expert_id = ?"
    )
        .bind(user_id)
        .fetch_one(&state.pool).await
        .map(|r| r.get::<i64,_>("cnt"))
        .unwrap_or(0);

    let user_count: i64 = sqlx::query("SELECT COUNT(*) as cnt FROM users")
        .fetch_one(&state.pool).await
        .map(|r| r.get::<i64,_>("cnt"))
        .unwrap_or(0);

    let expert_count: i64 = sqlx::query("SELECT COUNT(*) as cnt FROM users WHERE role = 'expert'")
        .fetch_one(&state.pool).await
        .map(|r| r.get::<i64,_>("cnt"))
        .unwrap_or(0);

    axum::Json(json!({
        "status":"ok",
        "total_submissions": subs_count,
        "my_scored": my_scored,
        "pending": subs_count - my_scored,
        "total_criteria": total_criteria,
        "total_users": user_count,
        "total_experts": expert_count,
    }))
}

async fn search_users(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> axum::Json<serde_json::Value> {
    let q = params.get("q").cloned().unwrap_or_default();
    match sqlx::query("SELECT id, email, name FROM users WHERE email LIKE ? OR name LIKE ? LIMIT 10")
        .bind(format!("%{}%", q)).bind(format!("%{}%", q))
        .fetch_all(&state.pool).await
    {
        Ok(rows) => {
            let users: Vec<serde_json::Value> = rows.iter().map(|r| json!({
                "id": r.get::<i64,_>("id"),
                "email": r.get::<String,_>("email"),
                "name": r.get::<Option<String>,_>("name"),
            })).collect();
            axum::Json(json!({"status":"ok","users": users}))
        }
        Err(e) => axum::Json(json!({"status":"error","error": format!("{}", e)})),
    }
}
