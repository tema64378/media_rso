import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setSent(true);
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
          Восстановление пароля
        </h2>
        {sent ? (
          <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-tertiary)", lineHeight: "1.7" }}>
            Если email зарегистрирован, мы отправили на него ссылку для сброса пароля.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Ваш email" required
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
              {loading ? "Отправка..." : "Отправить"}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
        )}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <a href="/login" style={{ color: "var(--accent)", fontFamily: "'Onest', sans-serif", fontSize: "1rem" }}>Вернуться ко входу</a>
        </div>
      </div>
    </div>
  );
}
