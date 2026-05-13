import React, { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [pdConsent, setPdConsent] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <img src="/logos/rso-logo.svg" alt="РСО" className="footer-logo" />
          <img src="/logos/media-rso-logo.svg" alt="Медиа РСО" className="footer-logo" />
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4 className="footer-col-title">Навигация</h4>
            <a href="/">Главная</a>
            <a href="/results">Результаты</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Участие</h4>
            <a href="/register">Регистрация</a>
            <a href="/login">Вход</a>
            <a href="/submissions">Загрузить работу</a>
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
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 Медиа РСО. Все права защищены.
      </div>
    </footer>
  );
}