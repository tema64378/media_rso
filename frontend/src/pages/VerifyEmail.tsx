import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/verify-email/${token}`)
      .then(r => r.json())
      .then(data => {
        setStatus(data.status === "ok" ? "ok" : "error");
        if (data.status === "ok") setTimeout(() => navigate("/login"), 3000);
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ display: "flex", justifyContent: "center", minHeight: "70vh", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "60px", padding: "3.5rem 3rem", textAlign: "center" }}>
        {status === "loading" && <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.25rem", color: "var(--text-tertiary)" }}>Подтверждение email...</p>}
        {status === "ok" && (
          <>
            <h2 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#10B981", marginBottom: "1rem" }}>Email подтверждён!</h2>
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-tertiary)" }}>Сейчас перенаправим на страницу входа...</p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#EF4444", marginBottom: "1rem" }}>Ошибка</h2>
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>Не удалось подтвердить email. Возможно, ссылка устарела.</p>
            <button onClick={() => navigate("/login")} style={{ padding: "1rem 2rem", borderRadius: "100px", border: "none", background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))", color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700, cursor: "pointer" }}>
              На страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
}
