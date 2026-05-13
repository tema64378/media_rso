ALTER TABLE users ADD COLUMN position TEXT;

CREATE TABLE IF NOT EXISTS media_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_media_teams_user1 ON media_teams(user1_id);
CREATE INDEX IF NOT EXISTS idx_media_teams_user2 ON media_teams(user2_id);
