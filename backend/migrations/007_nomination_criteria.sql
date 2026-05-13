ALTER TABLE criteria ADD COLUMN nomination_id INTEGER REFERENCES nominations(id);

-- "В объективе РСО" (nomination_id=1)
INSERT OR IGNORE INTO criteria (id, name, description, max_score, weight, nomination_id) VALUES
(100, 'Композиция', 'Качество построения кадра', 10, 1.0, 1),
(101, 'Техническое качество', 'Четкость, экспозиция, цветопередача', 10, 1.0, 1),
(102, 'Эмоциональность', 'Способность передать настроение мероприятия', 10, 1.0, 1);

-- "Сообщество ВК" (nomination_id=2)
INSERT OR IGNORE INTO criteria (id, name, description, max_score, weight, nomination_id) VALUES
(200, 'Визуальное оформление', 'Дизайн и структура сообщества', 10, 1.0, 2),
(201, 'Вовлеченность', 'Лайки, репосты, комментарии', 10, 1.0, 2),
(202, 'Контент', 'Регулярность и качество постов', 10, 1.0, 2);

-- "Медиакоманда" (nomination_id=3)
INSERT OR IGNORE INTO criteria (id, name, description, max_score, weight, nomination_id) VALUES
(300, 'Синхронность', 'Слаженность работы команды', 10, 1.0, 3),
(301, 'Разнообразие контента', 'Фото, видео, текст, дизайн', 10, 1.0, 3),
(302, 'Освещение', 'Полнота охвата мероприятий', 10, 1.0, 3);

-- "Блогер РСО" (nomination_id=4)
INSERT OR IGNORE INTO criteria (id, name, description, max_score, weight, nomination_id) VALUES
(400, 'Уникальность', 'Оригинальность подачи и стиль', 10, 1.0, 4),
(401, 'Глубина', 'Раскрытие темы стройотрядов', 10, 1.0, 4),
(402, 'Аудитория', 'Охват и вовлеченность подписчиков', 10, 1.0, 4);

-- Keep existing global criteria as fallback (nomination_id IS NULL)