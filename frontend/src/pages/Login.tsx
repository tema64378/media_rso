import React, { useState } from "react";
import { login } from "../api";
import ScrollReveal from '../components/ScrollReveal';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.status === "ok" && res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.role || "");
        window.location.href = "/profile";
      } else {
        setError(res.error || "Ошибка входа");
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Сервер не отвечает (таймаут). Проверьте, запущен ли бэкенд.");
      } else {
        setError("Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на http://127.0.0.1:8080");
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <ScrollReveal>
        <div style={{
          background: "var(--bg-card)", borderRadius: "60px", padding: "3.5rem 3rem",
        }}>
          <h2 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text)", marginBottom: "0.5rem",
            background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Вход
          </h2>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            color: "var(--text-tertiary)", marginBottom: "2.5rem",
          }}>
            Войдите в свой аккаунт
          </p>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Email
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="example@mail.com"
                required
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Пароль
              </label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
              <a href="/forgot-password" style={{ color: "var(--accent)", fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", textDecoration: "none" }}>Забыли пароль?</a>
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading} style={{
              padding: "1rem 2rem", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
              fontSize: "1.125rem", cursor: "pointer", transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Загрузка..." : "Войти"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-tertiary)", fontSize: "1rem" }}>
              Нет аккаунта?{" "}
              <a href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Зарегистрироваться</a>
            </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}