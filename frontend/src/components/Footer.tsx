import React, { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [pdConsent, setPdConsent] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-main">
        <div className="footer-brand-col">
          <div className="footer-brand">
            <img src="/logos/rso-logo.svg" alt="РСО" className="footer-logo" />
            <img src="/logos/media-rso-logo.svg" alt="Медиа РСО" className="footer-logo" />
          </div>
          <p className="footer-desc">
            Всероссийский медиаконкурс среди студенческих отрядов. Единая платформа
            для подачи заявок, оценки работ и итогового рейтинга.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4 className="footer-col-title">О конкурсе</h4>
            <a href="/about">О проекте</a>
            <a href="/rules">Правила и положение</a>
            <a href="/nominations">Номинации</a>
            <a href="/calendar">Календарь</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Участникам</h4>
            <a href="/register">Регистрация</a>
            <a href="/login">Вход</a>
            <a href="/submissions">Загрузить работу</a>
            <a href="/my-scores">Мои баллы</a>
            <a href="/profile">Личный кабинет</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Контакты</h4>
            <a href="mailto:media@rso.ru">media@rso.ru</a>
            <a href="https://vk.com/rso_media" target="_blank" rel="noopener noreferrer">ВКонтакте</a>
            <a href="https://t.me/media_rso" target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href="/contacts">Все контакты</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Правовое</h4>
            <label className="pd-consent">
              <input
                type="checkbox"
                checked={pdConsent}
                onChange={e => setPdConsent(e.target.checked)}
              />
              <span>Согласие на обработку ПД</span>
            </label>
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/terms">Пользовательское соглашение</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 Медиа РСО. Все права защищены. Сделано в Российских Студенческих Отрядах.
      </div>
    </footer>
  );
}
