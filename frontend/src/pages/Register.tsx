import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import { Button, Card } from "../components";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("participant");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await register({ email, password, name, role });
    setLoading(false);
    if (res.status === "ok") {
      navigate("/login");
    } else {
      setError(res.error || "Ошибка регистрации");
    }
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <Card variant="elevated">
        <h2 style={{ marginBottom: "1.5rem" }}>Регистрация</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Имя (команда/контакт)</label>
            <input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введите имя"
            />
          </div>

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

          <div className="form-group">
            <label htmlFor="role">Роль</label>
            <select value={role} onChange={e => setRole(e.target.value)} id="role">
              <option value="participant">Участник</option>
              <option value="expert">Эксперт</option>
              <option value="hq">Штаб РСО</option>
            </select>
          </div>

          <div className="actions">
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? "Загрузка..." : "Зарегистрироваться"}
            </Button>
          </div>

          {error && <div className="error">{error}</div>}

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <p>
              Уже есть аккаунт?{" "}
              <a href="/login" style={{ color: "#0066FF", fontWeight: "500" }}>
                Войти
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

