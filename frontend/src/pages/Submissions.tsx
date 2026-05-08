import React, { useState } from "react";
import { Button, Card } from "../components";

export default function Submissions() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Не авторизован");
      setLoading(false);
      return;
    }

    const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
    const payload = { title, description, url: url || null };

    try {
      const res = await fetch(`${BASE}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);

      if (data.status === "ok") {
        setSuccess(true);
        setTitle("");
        setDescription("");
        setUrl("");
        setFile(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Card variant="elevated">
        <h2 style={{ marginBottom: "1.5rem" }}>Загрузить работу</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">Название работы *</label>
            <input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите название"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Расскажите о вашей работе..."
              style={{ minHeight: "120px", resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label>Способ загрузки</label>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <div>
                <input
                  type="radio"
                  id="upload-url"
                  name="upload-type"
                  value="url"
                  onChange={() => setFile(null)}
                  defaultChecked
                />
                <label htmlFor="upload-url" style={{ display: "inline", marginLeft: "0.5rem" }}>
                  По ссылке
                </label>
              </div>
              <div>
                <input type="radio" id="upload-file" name="upload-type" value="file" />
                <label htmlFor="upload-file" style={{ display: "inline", marginLeft: "0.5rem" }}>
                  Загрузить файл
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="url">Ссылка на работу</label>
            <input
              id="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              type="url"
              placeholder="https://example.com/work"
            />
          </div>

          <div className="actions">
            <Button type="submit" variant="primary" size="lg" disabled={loading || !title}>
              {loading ? "Загрузка..." : "Загрузить работу"}
            </Button>
          </div>

          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">✓ Работа успешно загружена! Спасибо за участие.</div>
          )}
        </form>
      </Card>
    </div>
  );
}
