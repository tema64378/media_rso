CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    deadline_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO stages (key, title, enabled) VALUES
('registration', 'Регистрация открыта', 1),
('submissions', 'Приём работ', 1),
('scoring', 'Оценка работ', 0),
('results', 'Результаты опубликованы', 0)