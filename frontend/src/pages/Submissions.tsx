import React, { useState, useEffect, useRef } from "react";
import ScrollReveal from '../components/ScrollReveal';

export default function Submissions() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"url" | "file">("url");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const lastSaved = useRef<string>("");
  const formDirty = useRef(false);

  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
  const token = localStorage.getItem("token");

  const formSnapshot = () => JSON.stringify({ title, description, url });

  useEffect(() => {
    formDirty.current = formSnapshot() !== lastSaved.current;
  });

  useEffect(() => {
    fetch(`${BASE}/settings`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          const s = data.settings.find((s: any) => s.key === "submission_deadline");
          if (s) setDeadline(s.value);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-save draft every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!token || !formDirty.current) return;
      const snap = formSnapshot();
      if (!title || !lastSaved.current) return;

      if (draftId) {
        const res = await fetch(`${BASE}/submissions/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, url: url || null }),
        });
        const data = await res.json();
        if (data.status === "ok") {
          lastSaved.current = snap;
          formDirty.current = false;
          setDraftStatus("Черновик сохранён");
          setTimeout(() => setDraftStatus(null), 3000);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [draftId, title, description, url, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!token) {
      setError("Не авторизован");
      setLoading(false);
      return;
    }

    try {
      let res: Response;

      if (uploadType === "file" && file) {
        const formData = new FormData();
        formData.append("title", title);
        if (description) formData.append("description", description);
        formData.append("file", file);

        res = await fetch(`${BASE}/submissions/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch(`${BASE}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description, url: url || null }),
        });
      }

      const data = await res.json();
      setLoading(false);

      if (data.status === "ok") {
        if (data.id) {
          setDraftId(data.id);
          lastSaved.current = formSnapshot();
          formDirty.current = false;
        }
        setSuccess(true);
        setTitle("");
        setDescription("");
        setUrl("");
        setFile(null);
        setDraftId(null);
        lastSaved.current = "";
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
    <div style={{ display: "flex", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: "100%", maxWidth: "700px" }}>
        {deadline && (
          <ScrollReveal>
          <div style={{
            background: "var(--bg-card)", borderRadius: "60px", padding: "1.5rem 2rem",
            marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)" }}>
              Дедлайн отправки работ:
            </span>
            <span style={{
              fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
              fontSize: "1.25rem", color: new Date(deadline) < new Date() ? "#EF4444" : "var(--accent)",
            }}>
              {new Date(deadline).toLocaleString("ru-RU")}
            </span>
          </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={100}>
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
            Загрузить работу
          </h2>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            color: "var(--text-tertiary)", marginBottom: "2.5rem",
          }}>
            Представьте свою работу на конкурс
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Название работы *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Введите название"
                required
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none",
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
                Описание
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите о вашей работе..."
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  minHeight: "140px", resize: "vertical", outline: "none",
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
                Способ загрузки
              </label>
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  color: "var(--text-tertiary)", cursor: "pointer", fontSize: "1rem",
                  fontFamily: "'Onest', sans-serif",
                }}>
                  <input type="radio" name="upload-type" value="url"
                    checked={uploadType === "url"}
                    onChange={() => { setUploadType("url"); setFile(null); }}
                    style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }}
                  />
                  По ссылке
                </label>
                <label style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  color: "var(--text-tertiary)", cursor: "pointer", fontSize: "1rem",
                  fontFamily: "'Onest', sans-serif",
                }}>
                  <input type="radio" name="upload-type" value="file"
                    checked={uploadType === "file"}
                    onChange={() => { setUploadType("file"); setUrl(""); }}
                    style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }}
                  />
                  Загрузить файл
                </label>
              </div>

              {uploadType === "url" ? (
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  type="url"
                  placeholder="https://example.com/work"
                  style={{
                    width: "100%", padding: "1rem 1.25rem",
                    border: "1px solid var(--border)", borderRadius: "24px",
                    background: "var(--bg-input)", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              ) : (
                <div style={{
                  width: "100%", padding: "0.5rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)",
                }}>
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    style={{
                      width: "100%", padding: "0.75rem 1rem",
                      color: "var(--text)",
                      fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                      outline: "none", border: "none",
                      background: "transparent",
                    }}
                  />
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || !title} style={{
              padding: "1rem 2.5rem", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
              fontSize: "1.125rem", cursor: "pointer", transition: "all 0.2s",
              opacity: (loading || !title) ? 0.7 : 1,
            }}>
              {loading ? "Загрузка..." : "Загрузить работу"}
            </button>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">✓ Работа успешно загружена! Спасибо за участие.</div>}
            {draftStatus && <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>{draftStatus}</div>}
          </form>
        </div>
        </ScrollReveal>
      </div>
    </div>
  );
}