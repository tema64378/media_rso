use sqlx::sqlite::{SqlitePool, SqliteConnectOptions};
use std::fs;
use std::str::FromStr;

pub type DbPool = SqlitePool;

pub async fn init_db() -> DbPool {
    let db_path = "/tmp/mediacontest.db";
    
    let options = SqliteConnectOptions::from_str(&format!("sqlite://{}", db_path))
        .expect("Failed to parse connection string")
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options)
        .await
        .expect("Failed to connect to database");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (
            name TEXT PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
        .execute(&pool)
        .await
        .ok();

    let migrations_path = "./migrations";
    if fs::metadata(migrations_path).is_ok() {
        let mut files = fs::read_dir(migrations_path)
            .expect("Failed to read migrations")
            .filter_map(Result::ok)
            .map(|f| f.path())
            .collect::<Vec<_>>();
        files.sort();

        for file in files {
            if file.extension().map_or(false, |ext| ext == "sql") {
                let name = file.file_name().unwrap().to_str().unwrap().to_string();

                let already_applied = sqlx::query("SELECT 1 FROM _migrations WHERE name = ?")
                    .bind(&name)
                    .fetch_optional(&pool)
                    .await
                    .ok()
                    .flatten()
                    .is_some();

                if already_applied {
                    tracing::info!("Skipping already applied migration: {}", name);
                    continue;
                }

                let sql = fs::read_to_string(&file).expect("Failed to read migration");
                let statements: Vec<&str> = sql.split(';')
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .collect();
                
                for stmt in statements {
                    sqlx::query(stmt)
                        .execute(&pool)
                        .await
                        .expect(&format!("Failed to execute: {}", stmt));
                }

                sqlx::query("INSERT INTO _migrations (name) VALUES (?)")
                    .bind(&name)
                    .execute(&pool)
                    .await
                    .ok();

                tracing::info!("Applied migration: {}", name);
            }
        }
    }

    seed_default_users(&pool).await;
    tracing::info!("Database initialized at {}", db_path);
    pool
}

async fn seed_default_users(pool: &DbPool) {
    let users = vec![
        ("admin@example.com", "adminpass", "admin", Some("Администратор (тест)")),
        ("admin@mediarso.ru", "admin123", "admin", Some("Главный администратор")),
        ("expert@example.com", "expertpass", "expert", Some("Эксперт (тест)")),
        ("hq@example.com", "hqpass", "hq", Some("Штаб РСО (тест)")),
        ("participant@example.com", "participant", "participant", Some("Участник (тест)")),
    ];

    for (email, pwd, role, name) in users {
        let hashed = bcrypt::hash(pwd, bcrypt::DEFAULT_COST).unwrap();
        
        let existing = sqlx::query("SELECT id FROM users WHERE email = ?")
            .bind(email)
            .fetch_optional(pool)
            .await
            .unwrap_or(None);

        if existing.is_none() {
            sqlx::query("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)")
                .bind(email)
                .bind(&hashed)
                .bind(role)
                .bind(name)
                .execute(pool)
                .await
                .ok();
        }
    }
}