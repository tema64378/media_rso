import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { Button, Card } from "../components";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res.status === "ok" && res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role || "");
      window.location.href = "/profile";
    } else {
      setError(res.error || "Ошибка входа");
    }
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <Card variant="elevated">
        <h2 style={{ marginBottom: "1.5rem" }}>Вход</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="example@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="actions">
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? "Загрузка..." : "Войти"}
            </Button>
          </div>

          {error && <div className="error">{error}</div>}

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <p>
              Нет аккаунта?{" "}
              <a href="/register" style={{ color: "#0066FF", fontWeight: "500" }}>
                Зарегистрироваться
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
