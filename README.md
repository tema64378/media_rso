# Медиаконкурс РСО

Веб-платформа для проведения медиаконкурса РСО (Российские студенческие отряды):
регистрация и аутентификация участников, приём конкурсных работ, оценка и
администрирование.

## Стек

**Backend — Rust**
- [Axum](https://github.com/tokio-rs/axum) 0.7 — REST API, загрузка файлов (multipart)
- `sqlx` + миграции, Tokio (async)
- JWT-аутентификация (`jsonwebtoken`) + хеширование паролей (`bcrypt`)
- Email-уведомления через SMTP (`lettre`)
- CORS и раздача статики (`tower-http`)

**Frontend — React + TypeScript**
- Vite, React Router
- Дизайн-токены, разбивка на `pages/` и `components/`
- Деплой на Vercel (`vercel.json`)

**Инфраструктура**
- `docker-compose` с MySQL для локальной БД

## Запуск

1. Поднять БД:
```bash
docker compose up -d
```

2. Backend (нужны Rust и cargo):
```bash
cd backend
cargo run
```

3. Frontend (нужен Node.js):
```bash
cd frontend
npm install
npm run dev
```

## Структура
- `backend/src/` — `main.rs`, `auth.rs` (JWT/bcrypt), `db.rs`, `email.rs`, `models.rs`
- `backend/migrations/` — миграции базы данных
- `frontend/src/` — `pages/`, `components/`, `api.ts`, дизайн-токены (`tokens.ts`)
