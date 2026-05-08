-- 002_seed_roles.sql: seed default roles

INSERT INTO roles (name, description) VALUES
('admin', 'Администратор — управляет платформой'),
('participant', 'Участник конкурса'),
('hq', 'Член центрального штаба РСО'),
('expert', 'Эксперт / жюри'),
('other', 'Другая роль')
ON DUPLICATE KEY UPDATE description = VALUES(description);
