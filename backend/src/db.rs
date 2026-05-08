use sqlx::{mysql::MySqlPoolOptions, MySql, Pool};
use std::env;
use std::fs;
use std::path::Path;

pub type DbPool = Pool<MySql>;

pub async fn init_db() -> DbPool {
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "mysql://root:password@127.0.0.1:3306/mediacontest".to_string());
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to DB");

    // Apply SQL migrations from ./migrations if present
    let migrations_dir = Path::new("./migrations");
    if migrations_dir.exists() && migrations_dir.is_dir() {
        let mut entries: Vec<_> = fs::read_dir(migrations_dir)
            .expect("Failed to read migrations dir")
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.path().extension().map(|ext| ext == "sql").unwrap_or(false)
            })
            .collect();

        entries.sort_by_key(|e| e.path());

        for entry in entries {
            let path = entry.path();
            let sql = fs::read_to_string(&path).expect("Failed to read migration file");
            tracing::info!("Applying migration: {:?}", path.file_name().unwrap());
            match sqlx::query(&sql).execute(&pool).await {
                Ok(_) => tracing::info!("Migration applied: {:?}", path.file_name().unwrap()),
                Err(e) => tracing::error!("Migration error {:?}: {:?}", path.file_name().unwrap(), e),
            }
        }
    } else {
        tracing::warn!("No migrations directory found at ./migrations — skipping");
    }

    pool
}
