CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

ALTER TABLE submissions ADD COLUMN moderation_comment TEXT;
ALTER TABLE submissions ADD COLUMN moderated_by INTEGER REFERENCES users(id);
ALTER TABLE submissions ADD COLUMN moderated_at DATETIME;
