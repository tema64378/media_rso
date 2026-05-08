-- 001_init.sql: initial schema for Media Contest

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'participant',
    name VARCHAR(255),
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    starts_at DATETIME,
    ends_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    competition_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1024),
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS submission_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    filename VARCHAR(1024) NOT NULL,
    content_type VARCHAR(255),
    size_bytes BIGINT,
    storage_path VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    expert_id BIGINT NOT NULL,
    criterion_id INT DEFAULT NULL,
    score DECIMAL(6,2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(100),
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
