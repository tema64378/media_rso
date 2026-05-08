import React from "react";
import "./Header.css";
import { Link } from "react-router-dom";

interface HeaderProps {
  showNav?: boolean;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function Header({ showNav = true, isLoggedIn = false, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">NEXUS</span>
        </Link>

        {showNav && (
          <nav className="nav">
            <Link to="/" className="nav-link">
              Главная
            </Link>
            <Link to="/submissions" className="nav-link">
              Работы
            </Link>
            {isLoggedIn && (
              <>
                <Link to="/profile" className="nav-link">
                  Профиль
                </Link>
                <button onClick={onLogout} className="nav-link logout-btn">
                  Выход
                </button>
              </>
            )}
            {!isLoggedIn && (
              <>
                <Link to="/login" className="nav-link">
                  Вход
                </Link>
                <Link to="/register" className="nav-link nav-link-highlight">
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
