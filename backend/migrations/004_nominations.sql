CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_nominations (
    user_id INTEGER NOT NULL,
    nomination_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, nomination_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (nomination_id) REFERENCES nominations(id)
);

INSERT OR IGNORE INTO nominations (id, name, description) VALUES
(1, 'В объективе РСО', 'Лучшие фотографии с мероприятий'),
(2, 'Сообщество ВК', 'Лучший паблик отряда или штаба'),
(3, 'Медиакоманда', 'Лучшая пресс-служба отряда'),
(4, 'Блогер РСО', 'Лучший личный блог про стройотряды');
