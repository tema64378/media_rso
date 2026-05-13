import { useState, useEffect } from 'react';
import { Skeleton } from '../components';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';

export default function Gallery() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [scoresMap, setScoresMap] = useState<Record<number, any[]>>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selectedCompare, setSelectedCompare] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  const canEvaluate = userRole === 'expert' || userRole === 'admin' || userRole === 'hq';

  const toggleFavorite = async (id: number) => {
    if (!token) return;
    const isFav = favorites.has(id);
    const res = await fetch(`${BASE}/favorites/${id}`, {
      method: isFav ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === "ok") {
      const next = new Set(favorites);
      if (isFav) next.delete(id); else next.add(id);
      setFavorites(next);
    }
  };

  const toggleCompare = (id: number) => {
    const next = new Set(selectedCompare);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedCompare(next);
  };

  useEffect(() => {
    const url = userRole === 'expert' && token
      ? `${BASE}/submissions/my-nominations`
      : `${BASE}/submissions`;
    const headers: Record<string, string> = userRole === 'expert' && token
      ? { Authorization: `Bearer ${token}` }
      : {};

    (async () => {
      try {
        const [subRes, favRes] = await Promise.all([
          fetch(url, { headers }).then(r => r.json()),
          token ? fetch(`${BASE}/favorites`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve({ favorites: [] }),
        ]);
        const subs = subRes.submissions || [];
        setSubmissions(subs);
        if (favRes.status === "ok") setFavorites(new Set((favRes.favorites || []).map((f: any) => f.id)));

        if (canEvaluate && token) {
          const scores: Record<number, any[]> = {};
          await Promise.all(subs.map(async (sub: any) => {
            try {
              const res = await fetch(`${BASE}/submissions/${sub.id}/scores`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const d = await res.json();
              if (d.status === "ok") scores[sub.id] = d.scores || [];
            } catch {}
          }));
          setScoresMap(scores);
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, []);

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Черновик", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    submitted: { label: "На проверке", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    under_review: { label: "Оценивается", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
    reviewed: { label: "Проверено", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  };

  function getScoreStatus(subId: number) {
    const s = scoresMap[subId];
    if (!s || s.length === 0) return { label: "Не оценено", color: "var(--text-muted)", bg: "var(--bg-card-alt)" };
    return { label: `Оценено (${s.length} кр.)`, color: "#10B981", bg: "rgba(16,185,129,0.1)" };
  }

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <ScrollReveal>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
        <div>
          <h1 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--text)",
          }}>
            {canEvaluate ? "Оценить работы" : "Работы участников"}
          </h1>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
            color: "var(--text-tertiary)", marginTop: "0.5rem",
          }}>
            {canEvaluate
              ? "Оцените конкурсные работы участников по каждому критерию"
              : "Все конкурсные работы участников"
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {canEvaluate && submissions.length > 0 && (
            <div style={{
              fontFamily: "'Stolzl', sans-serif", fontSize: "0.9375rem",
              color: "var(--text-tertiary)", padding: "0.75rem 1.5rem",
              borderRadius: "100px", background: "var(--bg-card-alt)",
              whiteSpace: "nowrap",
            }}>
              Всего работ: {submissions.length}
            </div>
          )}
          {canEvaluate && selectedCompare.size >= 2 && (
            <button onClick={() => navigate(`/compare?ids=${[...selectedCompare].join(",")}`)} style={{
              padding: "0.75rem 1.5rem", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "0.9375rem",
              cursor: "pointer",
            }}>
              Сравнить ({selectedCompare.size})
            </button>
          )}
        </div>
      </div>
      </ScrollReveal>

      {submissions.length === 0 ? (
        <ScrollReveal>
        <p style={{
          fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
          color: "var(--text-muted)", textAlign: "center", padding: "5rem 2rem",
          border: "1px dashed var(--border)", borderRadius: "60px",
          background: "var(--bg-card)", marginTop: "2rem",
        }}>
          Пока нет работ
        </p>
        </ScrollReveal>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "1.5rem", marginTop: "2rem",
        }}>
          {submissions.map((sub, _idx) => {
            const scoreStatus = getScoreStatus(sub.id);
            const workStatus = sub.status ? statusLabels[sub.status] : null;
            return (
              <ScrollReveal key={sub.id} delay={_idx * 80}>
              <div style={{
                background: "var(--bg-card)", borderRadius: "50px", padding: "2rem",
                display: "flex", flexDirection: "column",
                transition: "transform 0.3s, box-shadow 0.3s",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                  background: "linear-gradient(90deg, var(--accent), transparent)",
                  opacity: 0, transition: "opacity 0.3s",
                }} className="gallery-card-bar" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    {canEvaluate && (
                      <input type="checkbox" checked={selectedCompare.has(sub.id)} onChange={() => toggleCompare(sub.id)}
                        style={{ accentColor: "var(--accent)", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0 }}
                      />
                    )}
                    <h3 style={{
                      fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                      fontSize: "1.25rem", color: "var(--text)",
                    }}>
                      {sub.title}
                    </h3>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {token && (
                      <button onClick={() => toggleFavorite(sub.id)} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", padding: "0",
                        lineHeight: 1, opacity: favorites.has(sub.id) ? 1 : 0.3,
                        transition: "opacity 0.2s",
                      }}>
                        {favorites.has(sub.id) ? "❤️" : "🤍"}
                      </button>
                    )}
                    {workStatus && (
                      <span style={{
                        fontFamily: "'Stolzl', sans-serif", fontSize: "0.75rem",
                        color: workStatus.color, background: workStatus.bg,
                        padding: "0.35rem 0.75rem", borderRadius: "100px",
                        whiteSpace: "nowrap",
                      }}>
                        {workStatus.label}
                      </span>
                    )}
                    {canEvaluate && (
                      <span style={{
                        fontFamily: "'Stolzl', sans-serif", fontSize: "0.75rem",
                        color: scoreStatus.color, background: scoreStatus.bg,
                        padding: "0.35rem 0.75rem", borderRadius: "100px",
                        whiteSpace: "nowrap",
                      }}>
                        {scoreStatus.label}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                  color: "var(--text-muted)", marginBottom: "0.25rem",
                }}>
                  {canEvaluate && scoresMap[sub.id]?.length === 0
                    ? 'Анонимный участник'
                    : (sub.author || 'Аноним')}
                  {!(canEvaluate && scoresMap[sub.id]?.length === 0) && sub.author_position && (
                    <span style={{ color: "var(--accent)", marginLeft: "0.5rem" }}>({sub.author_position})</span>
                  )}
                </div>
                {sub.partner && (
                  <div style={{
                    fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem",
                    color: "var(--text-tertiary)", marginBottom: "0.75rem",
                  }}>
                    В паре: {sub.partner.name || "Без имени"}{sub.partner.position && <span style={{ color: "var(--accent)", marginLeft: "0.375rem" }}>({sub.partner.position})</span>}
                  </div>
                )}
                {sub.description && (
                  <p style={{
                    fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem",
                    color: "var(--text-tertiary)", marginBottom: "1.25rem",
                    lineHeight: "1.6", overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {sub.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto", flexWrap: "wrap" }}>
                  {sub.url && (
                    <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{
                      padding: "0.75rem 1.5rem", borderRadius: "100px", border: "none",
                      background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                      color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
                      fontSize: "0.9375rem", textDecoration: "none", transition: "all 0.2s",
                      flex: canEvaluate ? "none" : 1, textAlign: "center",
                    }}>
                      Смотреть
                    </a>
                  )}
                  {sub.file_path && (
                    <a href={`${BASE}/uploads/${sub.file_path}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: "0.75rem 1.5rem", borderRadius: "100px", border: "none",
                      background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                      color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
                      fontSize: "0.9375rem", textDecoration: "none", transition: "all 0.2s",
                      textAlign: "center",
                    }}>
                      Скачать
                    </a>
                  )}
                  {canEvaluate && (
                    <button onClick={() => navigate(`/scoring/${sub.id}`)} style={{
                      flex: 1, padding: "0.75rem 1.5rem", borderRadius: "100px",
                      border: "2px solid var(--accent)", background: "transparent",
                      color: "var(--accent)", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
                      fontSize: "0.9375rem", cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
                    >
                      Оценить
                    </button>
                  )}
                </div>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
