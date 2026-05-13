import React, { useState } from "react";
import "./Header.css";
import { Link } from "react-router-dom";

interface HeaderProps {
  showNav?: boolean;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  theme?: string;
  onThemeToggle?: () => void;
  userRole?: string | null;
}

export default function Header({ showNav = true, isLoggedIn = false, onLogout, theme, onThemeToggle, userRole }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="header-logos">
            <img src="/logos/rso-logo.svg" alt="РСО" className="header-logo" />
            <img src="/logos/media-rso-logo.svg" alt="Медиа РСО" className="header-logo media-logo" />
          </Link>
          <button className="theme-btn" onClick={onThemeToggle} title={theme === "dark" ? "Светлая тема" : "Тёмная тема"} type="button">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} type="button">
          <span /><span /><span />
        </button>

        {showNav && (
          <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              Главная
            </Link>
            <Link to="/results" className="nav-link" onClick={() => setMenuOpen(false)}>
              Результаты
            </Link>
            {isLoggedIn && (
              <>
                {userRole === "participant" && (
                  <Link to="/submissions" className="nav-link" onClick={() => setMenuOpen(false)}>
                    Загрузить
                  </Link>
                )}
                <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                  Профиль
                </Link>
                {(userRole === "admin" || userRole === "hq") && (
                  <Link to="/admin" className="nav-btn nav-btn-highlight" onClick={() => setMenuOpen(false)}>
                    Админ-панель
                  </Link>
                )}
                <button onClick={() => { onLogout?.(); setMenuOpen(false); }} className="nav-link nav-logout" type="button">
                  Выход
                </button>
              </>
            )}
            {!isLoggedIn && (
              <>
                <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                  Вход
                </Link>
                <Link to="/register" className="nav-btn nav-btn-highlight" onClick={() => setMenuOpen(false)}>
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}