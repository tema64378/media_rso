CREATE TABLE IF NOT EXISTS nomination_experts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomination_id INTEGER NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
    expert_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(nomination_id, expert_id)
)