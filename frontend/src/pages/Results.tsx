import { useState, useEffect } from 'react';
import { Skeleton } from '../components';
import ScrollReveal from '../components/ScrollReveal';

const rankColors = [
  { bg: "linear-gradient(135deg, #FFD700, #FFC000)", color: "#000" },
  { bg: "linear-gradient(135deg, #C0C0C0, #A8A8A8)", color: "#000" },
  { bg: "linear-gradient(135deg, #CD7F32, #B8860B)", color: "#fff" },
];

export default function Results() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
    fetch(`${BASE}/submissions`)
      .then(r => r.json())
      .then(async data => {
        const submissions = data.submissions || [];
        const withScores = await Promise.all(
          submissions.map(async (sub: any) => {
            const scoreRes = await fetch(`${BASE}/submissions/${sub.id}/winner`);
            const scoreData = await scoreRes.json();
            return { id: sub.id, title: sub.title, author: sub.author, total_score: scoreData.total_score || 0 };
          })
        );
        const ranked = withScores
          .sort((a: any, b: any) => b.total_score - a.total_score)
          .map((sub: any, idx: number) => ({ ...sub, rank: idx + 1 }));
        setRankings(ranked);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <ScrollReveal>
      <h1 style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--text)",
        marginBottom: "0.5rem", textAlign: "center",
      }}>
        Результаты конкурса
      </h1>
      <p style={{
        fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
        color: "var(--text-tertiary)", marginBottom: "3rem", textAlign: "center",
      }}>
        Итоговый рейтинг участников
      </p>
      </ScrollReveal>

      {rankings.length === 0 ? (
        <ScrollReveal><p style={{
          fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
          color: "var(--text-muted)", textAlign: "center", padding: "5rem 2rem",
          border: "1px dashed var(--border)", borderRadius: "60px",
          background: "var(--bg-card)",
        }}>
          Пока нет результатов
        </p></ScrollReveal>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {rankings.map((sub, idx) => {
            const rankStyle = rankColors[sub.rank - 1] || { bg: "var(--bg-card)", color: "var(--text)" };
            return (
              <ScrollReveal key={sub.id} delay={idx * 100}>
              <div style={{
                background: "var(--bg-card)", borderRadius: "50px",
                padding: "1.75rem 2.25rem",
                display: "flex", alignItems: "center", gap: "1.5rem",
                transition: "transform 0.2s",
              }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: rankStyle.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                  fontSize: "1.75rem", color: rankStyle.color, flexShrink: 0,
                  boxShadow: sub.rank <= 3 ? "0 4px 15px rgba(0,0,0,0.2)" : "none",
                }}>
                  #{sub.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                    fontSize: "1.375rem", color: "var(--text)", marginBottom: "0.25rem",
                  }}>
                    {sub.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                    color: "var(--text-muted)",
                  }}>
                    {sub.author || 'Аноним'}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                    fontSize: "2.25rem", color: "var(--accent)", lineHeight: 1,
                  }}>
                    {sub.total_score}
                  </div>
                  <div style={{
                    fontFamily: "'Stolzl', sans-serif", fontSize: "0.875rem",
                    color: "var(--text-muted)", marginTop: "0.25rem",
                  }}>
                    баллов
                  </div>
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