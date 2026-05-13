use lettre::{
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use lettre::message::header::ContentType;
use sqlx::Row;
use std::env;

fn smtp_config() -> (String, u16, Option<String>, Option<String>, String) {
    let host = env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.yandex.ru".to_string());
    let port = env::var("SMTP_PORT").unwrap_or_else(|_| "587".to_string()).parse().unwrap_or(587);
    let username = env::var("SMTP_USERNAME").ok();
    let password = env::var("SMTP_PASSWORD").ok();
    let from = env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@mediarso.ru".to_string());
    (host, port, username, password, from)
}

fn build_message(to: &str, subject: &str, body: &str) -> Result<Message, String> {
    let (_, _, _, _, from) = smtp_config();
    Message::builder()
        .from(from.parse().map_err(|e| format!("Invalid from: {}", e))?)
        .to(to.parse().map_err(|e| format!("Invalid to: {}", e))?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(body.to_string())
        .map_err(|e| format!("Message build error: {}", e))
}

pub async fn send_email(to: &str, subject: &str, body: &str) -> Result<(), String> {
    let (host, port, username, password, _) = smtp_config();
    let email = build_message(to, subject, body)?;

    let mut mailer_builder = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&host)
        .map_err(|e| format!("SMTP relay error: {}", e))?
        .port(port);

    if let (Some(u), Some(p)) = (&username, &password) {
        let creds = Credentials::new(u.clone(), p.clone());
        mailer_builder = mailer_builder.credentials(creds);
    }

    let mailer = mailer_builder.build();

    mailer.send(email).await.map_err(|e| format!("Send error: {}", e))?;
    Ok(())
}

fn wrap_html(body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>\
         <div style=\"font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;\">\
         <div style=\"background: linear-gradient(135deg, #6C63FF, #4a6cf7); border-radius: 16px; padding: 2rem; color: #fff; text-align: center;\">\
         <h1 style=\"margin: 0; font-size: 1.5rem;\">Медиа РСО</h1>\
         </div>\
         <div style=\"padding: 2rem; background: #f8f9fa; border-radius: 0 0 16px 16px;\">{}</div>\
         <div style=\"text-align: center; padding: 1rem; color: #999; font-size: 0.8rem;\">\
         Всероссийский медиаконкурс «Медиа РСО»</div></div></body></html>",
        body
    )
}

pub async fn send_welcome_email(to: &str, name: &str) -> Result<(), String> {
    let body = wrap_html(&format!(
        "<h2>Добро пожаловать на конкурс!</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Вы успешно зарегистрировались на Всероссийском медиаконкурсе «Медиа РСО».</p>\
         <p>В личном кабинете вы можете загрузить свои работы и следить за результатами.</p>\
         <p>Удачи!</p>",
        name = name
    ));
    send_email(to, "Добро пожаловать на «Медиа РСО»!", &body).await
}

pub async fn send_submission_confirmation(to: &str, name: &str, title: &str) -> Result<(), String> {
    let body = wrap_html(&format!(
        "<h2>Работа загружена</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Ваша работа <strong>«{title}»</strong> успешно загружена и отправлена на рассмотрение.</p>\
         <p>Вы сможете следить за статусом оценки в личном кабинете.</p>",
        name = name, title = title
    ));
    send_email(to, "Работа загружена — «Медиа РСО»", &body).await
}

pub async fn send_nomination_assigned(to: &str, name: &str, nomination: &str) -> Result<(), String> {
    let body = wrap_html(&format!(
        "<h2>Новая номинация</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Вам назначена номинация: <strong>«{nomination}»</strong>.</p>\
         <p>Вы можете загрузить работу для этой номинации в личном кабинете.</p>",
        name = name, nomination = nomination
    ));
    send_email(to, "Назначена номинация — «Медиа РСО»", &body).await
}

pub async fn send_work_scored(to: &str, name: &str, title: &str) -> Result<(), String> {
    let body = wrap_html(&format!(
        "<h2>Работа оценена</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Ваша работа <strong>«{title}»</strong> была оценена экспертами.</p>\
         <p>Результаты вы можете посмотреть в личном кабинете.</p>",
        name = name, title = title
    ));
    send_email(to, "Работа оценена — «Медиа РСО»", &body).await
}

pub async fn send_verification_email(to: &str, name: &str, token: &str) -> Result<(), String> {
    let link = format!("{}/verify-email/{}", env::var("APP_URL").unwrap_or_else(|_| "http://127.0.0.1:3000".to_string()), token);
    let body = wrap_html(&format!(
        "<h2>Подтвердите email</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Для завершения регистрации нажмите на кнопку ниже:</p>\
         <div style=\"text-align: center; margin: 2rem 0;\">\
         <a href=\"{link}\" style=\"display: inline-block; padding: 1rem 2.5rem; border-radius: 100px; \
         background: linear-gradient(135deg, #6C63FF, #4a6cf7); color: #fff; text-decoration: none; \
         font-weight: 700; font-size: 1.125rem;\">Подтвердить email</a></div>\
         <p>Если вы не регистрировались — проигнорируйте это письмо.</p>",
        name = name, link = link
    ));
    send_email(to, "Подтверждение email — «Медиа РСО»", &body).await
}

pub async fn send_password_reset_email(to: &str, name: &str, token: &str) -> Result<(), String> {
    let link = format!("{}/reset-password/{}", env::var("APP_URL").unwrap_or_else(|_| "http://127.0.0.1:3000".to_string()), token);
    let body = wrap_html(&format!(
        "<h2>Восстановление пароля</h2>\
         <p>Здравствуйте, {name}!</p>\
         <p>Для сброса пароля нажмите на кнопку:</p>\
         <div style=\"text-align: center; margin: 2rem 0;\">\
         <a href=\"{link}\" style=\"display: inline-block; padding: 1rem 2.5rem; border-radius: 100px; \
         background: linear-gradient(135deg, #6C63FF, #4a6cf7); color: #fff; text-decoration: none; \
         font-weight: 700; font-size: 1.125rem;\">Сбросить пароль</a></div>\
         <p>Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте письмо.</p>",
        name = name, link = link
    ));
    send_email(to, "Восстановление пароля — «Медиа РСО»", &body).await
}

pub async fn send_notification_email(to: &str, subject: &str, body_text: &str) -> Result<(), String> {
    let body = wrap_html(body_text);
    send_email(to, subject, &body).await
}

pub async fn notify_admins_submission(pool: &crate::db::DbPool, title: &str, author_name: &str) {
    let admins = sqlx::query("SELECT email FROM users WHERE role IN ('admin', 'hq')")
        .fetch_all(pool).await.unwrap_or_default();
    for row in admins {
        let email: String = row.get("email");
        let body = wrap_html(&format!(
            "<h2>Новая работа на конкурсе</h2>\
             <p>Участник <strong>{author}</strong> загрузил работу: <strong>«{title}»</strong>.</p>\
             <p>Перейдите в панель администратора для управления работами.</p>",
            author = author_name, title = title
        ));
        let _ = send_email(&email, "Новая работа — «Медиа РСО»", &body).await;
    }
}
