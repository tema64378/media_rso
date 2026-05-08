import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header, Button, Card } from "./components";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Submissions from "./pages/Submissions";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import "./styles.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole(null);
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <Header 
        showNav={true} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      <div className="container">
        <Routes>
          <Route 
            path="/" 
            element={
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
                  Медиаконкурс РСО
                </h1>
                <p style={{ fontSize: "1.125rem", color: "#666", marginBottom: "2rem" }}>
                  Платформа для проведения конкурса медиаработ
                </p>
                {!isLoggedIn && (
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                    <Button variant="primary" size="lg">
                      <a href="/register" style={{ color: "inherit", textDecoration: "none" }}>
                        Зарегистрироваться
                      </a>
                    </Button>
                    <Button variant="outline" size="lg">
                      <a href="/login" style={{ color: "inherit", textDecoration: "none" }}>
                        Войти
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/submissions" element={<Submissions />} />
          {(userRole === "admin" || userRole === "hq") && (
            <Route path="/admin" element={<AdminPanel />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


