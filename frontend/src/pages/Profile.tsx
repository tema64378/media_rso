import React, { useEffect, useState } from "react";
import { me } from "../api";
import { Button, Card } from "../components";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Не авторизован");
      setLoading(false);
      return;
    }
    me(token)
      .then(res => {
        if (res.status === "ok") setUser(res.user);
        else setError(res.error || "Ошибка");
        setLoading(false);
      })
      .catch(e => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Загрузка...</div>;
  if (error) return <div className="error" style={{ maxWidth: "500px", margin: "2rem auto" }}>{error}</div>;
  if (!user) return <div style={{ textAlign: "center", padding: "2rem" }}>Пользователь не найден</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Card variant="elevated">
        <h2 style={{ marginBottom: "1.5rem" }}>Мой профиль</h2>

        <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #E5E7EB" }}>
            <label style={{ fontSize: "0.875rem", color: "#666" }}>Имя</label>
            <p style={{ fontSize: "1.125rem", fontWeight: "500", marginTop: "0.25rem" }}>
              {user.name || "—"}
            </p>
          </div>

          <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #E5E7EB" }}>
            <label style={{ fontSize: "0.875rem", color: "#666" }}>Email</label>
            <p style={{ fontSize: "1.125rem", fontWeight: "500", marginTop: "0.25rem" }}>
              {user.email}
            </p>
          </div>

          <div style={{ paddingBottom: "1rem" }}>
            <label style={{ fontSize: "0.875rem", color: "#666" }}>Роль</label>
            <div style={{ marginTop: "0.25rem" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "#0066FF",
                  color: "white",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                {user.role === "participant" && "Участник"}
                {user.role === "expert" && "Эксперт"}
                {user.role === "admin" && "Администратор"}
                {user.role === "hq" && "Штаб РСО"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <Button variant="primary" size="md">
            Редактировать профиль
          </Button>
          <Button variant="outline" size="md" onClick={handleLogout}>
            Выход
          </Button>
        </div>
      </Card>
    </div>
  );
}
