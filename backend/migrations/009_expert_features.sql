CREATE TABLE IF NOT EXISTS expert_submissions (
    expert_id INTEGER NOT NULL,
    submission_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (expert_id, submission_id),
    FOREIGN KEY (expert_id) REFERENCES users(id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    submission_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, submission_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE TABLE IF NOT EXISTS admin_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);
