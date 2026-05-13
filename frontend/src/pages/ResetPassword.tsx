import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, new_password: password }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setDone(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", minHeight: "70vh", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "60px", padding: "3.5rem 3rem" }}>
        <h2 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--text)", marginBottom: "0.5rem", background: "linear-gradient(90deg, var(--accent), #4a6cf7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Новый пароль
        </h2>
        {done ? (
          <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--accent)" }}>Пароль изменён! Перенаправляем...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Ваш email" required
              style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Новый пароль" required minLength={6}
              style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <button type="submit" disabled={loading} style={{
              padding: "1rem 2.5rem", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1.125rem",
              cursor: "pointer", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
