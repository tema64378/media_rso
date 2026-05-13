import { useState, useEffect } from "react";
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components';

export default function Timeline() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  useEffect(() => {
    fetch(`${BASE}/timeline`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const iconMap: Record<string, string> = {
    flag: "🏁", upload: "📤", score: "📊", trophy: "🏆",
  };

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <ScrollReveal>
      <h1 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--text)", marginBottom: "0.5rem", textAlign: "center" }}>
        Календарь конкурса
      </h1>
      <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.25rem", color: "var(--text-tertiary)", marginBottom: "3rem", textAlign: "center" }}>
        Основные этапы «Медиа РСО 2026»
      </p>
      </ScrollReveal>
      <div style={{ position: "relative" }}>
        {events.map((ev, idx) => (
          <ScrollReveal key={idx} delay={idx * 100}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem", alignItems: "flex-start" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: ev.active ? "linear-gradient(135deg, var(--accent), #4a6cf7)" : "var(--bg-card-alt)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", flexShrink: 0, opacity: ev.active ? 1 : 0.5,
            }}>
              {iconMap[ev.icon] || "📌"}
            </div>
            <div style={{ flex: 1, background: "var(--bg-card)", borderRadius: "24px", padding: "1.5rem 2rem" }}>
              <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--text)", marginBottom: "0.25rem" }}>
                {ev.event}
              </div>
              <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)" }}>
                {ev.date ? new Date(ev.date).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Не установлен"}
              </div>
            </div>
          </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
