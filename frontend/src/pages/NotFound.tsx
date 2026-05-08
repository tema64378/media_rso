import React from "react";
import { Card } from "../components";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.125rem", color: "#666", marginBottom: "2rem" }}>
        Страница не найдена
      </p>
      <a href="/" style={{ color: "#0066FF", fontWeight: "500" }}>
        ← Вернуться на главную
      </a>
    </div>
  );
}
