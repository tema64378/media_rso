ALTER TABLE users ADD COLUMN email_verified_at DATETIME;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
