import { useState, useEffect } from "react";
import { Skeleton } from '../components';
import ScrollReveal from '../components/ScrollReveal';

export default function MyScores() {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  const fetchScores = async () => {
    if (!token) return;
    const res = await fetch(`${BASE}/scores/my-history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === "ok") setScores(data.scores || []);
    setLoading(false);
  };

  useEffect(() => { fetchScores(); }, []);

  const handleSave = async (id: number) => {
    if (!token) return;
    setSaving(true);
    await fetch(`${BASE}/scores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score: editScore, comment: editComment || null }),
    });
    setEditingId(null);
    setSaving(false);
    fetchScores();
  };

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <ScrollReveal>
      <h1 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text)", marginBottom: "0.5rem" }}>
        Мои оценки
      </h1>
      <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-tertiary)", marginBottom: "2rem" }}>
        История ваших оценок
      </p>
      </ScrollReveal>
      {scores.length === 0 ? (
        <ScrollReveal><p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Вы ещё не поставили ни одной оценки</p></ScrollReveal>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {scores.map((s, idx) => (
            <ScrollReveal key={s.id} delay={idx * 75}>
            <div style={{ background: "var(--bg-card)", borderRadius: "30px", padding: "1.5rem 2rem" }}>
              {editingId === s.id ? (
                <div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-secondary)" }}>{s.work_title} — {s.criterion}:</span>
                    <input type="number" value={editScore} onChange={e => setEditScore(parseInt(e.target.value) || 0)} min={0} max={10}
                      style={{ width: "80px", padding: "0.5rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem", textAlign: "center" }}
                    />
                    <input value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Комментарий"
                      style={{ flex: 1, minWidth: "200px", padding: "0.5rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={() => handleSave(s.id)} disabled={saving} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "none", background: "var(--accent)", color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer" }}>
                      {saving ? "..." : "Сохранить"}
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer" }}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "'Onest', sans-serif", fontWeight: 600, fontSize: "1.0625rem", color: "var(--text)" }}>
                      {s.work_title}
                    </div>
                    <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>
                      {s.criterion} — <span style={{ color: "var(--accent)", fontWeight: 700 }}>{s.score} баллов</span>
                      {s.comment && <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)" }}>— {s.comment}</span>}
                    </div>
                  </div>
                  <button onClick={() => { setEditingId(s.id); setEditScore(s.score); setEditComment(s.comment || ""); }} style={{
                    padding: "0.5rem 1.25rem", borderRadius: "100px", border: "1px solid var(--border)", background: "transparent",
                    color: "var(--accent)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", flexShrink: 0,
                  }}>
                    Редактировать
                  </button>
                </div>
              )}
            </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
