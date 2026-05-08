import React, { useState, useEffect } from "react";
import { Card, Button } from "../components";

interface AdminStats {
  users: number;
  submissions: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Не авторизован");
      return;
    }

    const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
    try {
      const res = await fetch(`${BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setStats(data.counts);
      } else {
        setError(data.error || "Ошибка загрузки статистики");
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
    try {
      const res = await fetch(`${BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>Админ-панель</h1>

      {error && <div className="error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <Card variant="elevated">
          <h3 style={{ color: "#0066FF", marginBottom: "0.5rem" }}>Всего пользователей</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "700" }}>{stats?.users || 0}</div>
        </Card>

        <Card variant="elevated">
          <h3 style={{ color: "#00D9FF", marginBottom: "0.5rem" }}>Загруженных работ</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "700" }}>{stats?.submissions || 0}</div>
        </Card>
      </div>

      {/* Users Table */}
      <Card variant="elevated">
        <h2 style={{ marginBottom: "1.5rem" }}>Пользователи</h2>

        {users.length === 0 ? (
          <p style={{ color: "#666" }}>Нет пользователей</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ textAlign: "left", padding: "1rem", fontWeight: "600" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontWeight: "600" }}>Имя</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontWeight: "600" }}>Роль</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontWeight: "600" }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "1rem" }}>{user.email}</td>
                    <td style={{ padding: "1rem" }}>{user.name}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          background:
                            user.role === "admin" ? "#FF6B6B" : user.role === "expert" ? "#0066FF" : "#10B981",
                          color: "white",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <Button variant="outline" size="sm">
                        Редактировать
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
