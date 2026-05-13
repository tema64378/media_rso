import { useState, useEffect } from "react";
import { Skeleton } from '../components';
import { useSearchParams } from "react-router-dom";
import ScrollReveal from '../components/ScrollReveal';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
  const ids = searchParams.get("ids") || "";

  useEffect(() => {
    if (!ids) { setLoading(false); return; }
    fetch(`${BASE}/compare?ids=${ids}`)
      .then(r => r.json())
      .then(data => {
        setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ids]);

  if (loading) return <Skeleton />;
  if (submissions.length === 0) return <div className="loading">Выберите работы для сравнения</div>;

  const allCriteria = [...new Set(submissions.flatMap(s => (s.scores || []).map((sc: any) => sc.criterion)))] as string[];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <ScrollReveal>
      <h1 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text)", marginBottom: "2rem", textAlign: "center" }}>
        Сравнение работ
      </h1>
      </ScrollReveal>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${submissions.length}, 1fr)`, gap: "1.5rem" }}>
        {submissions.map((sub, idx) => (
          <ScrollReveal key={sub.id} delay={idx * 100}>
          <div style={{ background: "var(--bg-card)", borderRadius: "50px", padding: "2rem" }}>
            <h3 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--text)", marginBottom: "0.5rem" }}>{sub.title}</h3>
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{sub.author}</p>
            {sub.description && <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>{sub.description}</p>}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {sub.url && <a href={sub.url} target="_blank" style={{ padding: "0.5rem 1rem", borderRadius: "100px", background: "var(--accent)", color: "#fff", textDecoration: "none", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Смотреть</a>}
              {sub.file_path && <a href={`${BASE}/uploads/${sub.file_path}`} target="_blank" style={{ padding: "0.5rem 1rem", borderRadius: "100px", background: "var(--accent)", color: "#fff", textDecoration: "none", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.875rem" }}>Скачать</a>}
            </div>
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
              <h4 style={{ fontFamily: "'Stolzl', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)", marginBottom: "1rem", textTransform: "uppercase" }}>Оценки</h4>
              {allCriteria.map(c => {
                const score = (sub.scores || []).find((s: any) => s.criterion === c);
                return (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-secondary)" }}>{c}</span>
                    <span style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: score ? "var(--accent)" : "var(--text-muted)" }}>
                      {score ? score.score : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
