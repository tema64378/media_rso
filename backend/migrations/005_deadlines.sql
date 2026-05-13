CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
);

INSERT OR IGNORE INTO settings (key, value, description) VALUES
('submission_deadline', '2026-10-15T23:59:59', 'Дедлайн отправки работ участниками'),
('evaluation_deadline', '2026-11-01T23:59:59', 'Дедлайн оценки работ экспертами');
