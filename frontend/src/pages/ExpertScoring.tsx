import { useState, useEffect } from 'react';
import { Skeleton } from '../components';
import { useParams } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';

export default function ExpertScoring() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);
  const token = localStorage.getItem('token');
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  useEffect(() => {
    (async () => {
      const subRes = await fetch(`${BASE}/submissions/${id}`).then(r => r.json());
      const sub = subRes.submission;
      setSubmission(sub);

      let criteriaUrl = `${BASE}/criteria`;
      if (sub?.nomination_ids?.length > 0) {
        criteriaUrl += `?nomination_id=${sub.nomination_ids[0]}`;
      }
      const [critRes, settingsRes] = await Promise.all([
        fetch(criteriaUrl).then(r => r.json()),
        fetch(`${BASE}/settings`).then(r => r.json()),
      ]);
      setCriteria(critRes.criteria || []);
      if (settingsRes.status === "ok") {
        const s = settingsRes.settings.find((s: any) => s.key === "evaluation_deadline");
        if (s) setDeadline(s.value);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleScoreChange = (criterionId: number, score: number, comment?: string) => {
    setScores(prev => ({ ...prev, [criterionId]: { criterion_id: criterionId, score, comment } }));
  };

  const handleSubmit = async () => {
    setSending(true);
    for (const [_, scoreData] of Object.entries(scores)) {
      await fetch(`${BASE}/submissions/${id}/scores`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
    }
    setSending(false);
    setSent(true);
  };

  if (loading) return <Skeleton />;
  if (!submission) return <div className="error" style={{ maxWidth: "600px", margin: "2rem auto" }}>Работа не найдена</div>;

  const initials = submission.author
    ? submission.author.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : submission.author_email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem",
      maxWidth: "1400px", margin: "0 auto",
    }}>
      {/* Left: Submission + Author Info */}
      <ScrollReveal direction="left">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Submission Preview */}
        <div style={{
          background: "linear-gradient(135deg, var(--accent), #4a6cf7)",
          borderRadius: "60px", padding: "3rem", color: "#fff",
        }}>
          <h1 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)", marginBottom: "1rem",
          }}>
            {submission.title}
          </h1>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            opacity: 0.85, marginBottom: "1.25rem",
          }}>
            Автор: {submission.author || 'Аноним'}
          </p>
          {submission.description && (
            <p style={{
              fontFamily: "'Onest', sans-serif", fontSize: "1.0625rem",
              lineHeight: "1.7", opacity: 0.9, marginBottom: "2rem",
            }}>
              {submission.description}
            </p>
          )}
          {submission.status && (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", opacity: 0.8, marginBottom: "1.5rem" }}>
              Статус: {submission.status === "draft" ? "Черновик" : submission.status === "submitted" ? "На проверке" : submission.status === "under_review" ? "Оценивается" : submission.status === "reviewed" ? "Проверено" : submission.status}
            </p>
          )}
          {submission.url && (
            <a href={submission.url} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-block", padding: "1rem 2rem", borderRadius: "100px",
              background: "#fff", color: "var(--accent)", textDecoration: "none",
              fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1rem",
              transition: "transform 0.2s",
            }}>
              Смотреть работу
            </a>
          )}
          {submission.file_path && (
            <a href={`${BASE}/uploads/${submission.file_path}`} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-block", padding: "1rem 2rem", borderRadius: "100px",
              background: "#fff", color: "var(--accent)", textDecoration: "none",
              fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1rem",
              transition: "transform 0.2s", marginTop: submission.url ? "0.75rem" : undefined,
            }}>
              Скачать файл
            </a>
          )}
        </div>

        {/* Author Info (shown when URL is present) */}
        {submission.url && (
          <div style={{
            background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem",
          }}>
            <h3 style={{
              fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
              fontSize: "1.375rem", color: "var(--text)", marginBottom: "1.5rem",
              background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Данные участника
            </h3>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: submission.author_avatar
                  ? `url(${submission.author_avatar}) center/cover`
                  : "linear-gradient(135deg, var(--accent), #4a6cf7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "2rem", color: "#fff", flexShrink: 0,
              }}>
                {!submission.author_avatar && initials}
              </div>
              <div>
                <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--text)" }}>
                  {submission.author || "Без имени"}
                  {submission.author_position && <span style={{ color: "var(--accent)", fontSize: "1rem", marginLeft: "0.75rem" }}>({submission.author_position})</span>}
                </div>
                <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
                  {submission.author_email}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {submission.author_phone && (
                <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Телефон</div>
                  <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.author_phone}</div>
                </div>
              )}
              {submission.author_team && (
                <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Отряд</div>
                  <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.author_team}</div>
                </div>
              )}
              {submission.author_squad && (
                <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Штаб</div>
                  <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.author_squad}</div>
                </div>
              )}
            </div>

            {submission.partner && (
              <>
                <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "1.5rem 0" }} />
                <h4 style={{
                  fontFamily: "'Actay Wide', sans-serif", fontWeight: 600,
                  fontSize: "1.125rem", color: "var(--text)", marginBottom: "1rem",
                }}>
                  Напарник (Медиакоманда)
                </h4>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    background: submission.partner.avatar
                      ? `url(${submission.partner.avatar}) center/cover`
                      : "linear-gradient(135deg, var(--accent), #4a6cf7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                    fontSize: "1.5rem", color: "#fff", flexShrink: 0,
                  }}>
                    {!submission.partner.avatar && submission.partner.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "var(--text)" }}>
                      {submission.partner.name || "Без имени"}
                      {submission.partner.position && <span style={{ color: "var(--accent)", fontSize: "0.9375rem", marginLeft: "0.5rem" }}>({submission.partner.position})</span>}
                    </div>
                    <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>
                      {submission.partner.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {submission.partner.phone && (
                    <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Телефон</div>
                      <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.partner.phone}</div>
                    </div>
                  )}
                  {submission.partner.team && (
                    <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Отряд</div>
                      <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.partner.team}</div>
                    </div>
                  )}
                  {submission.partner.squad && (
                    <div style={{ padding: "1rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Штаб</div>
                      <div style={{ fontSize: "1.125rem", color: "var(--text)", fontFamily: "'Onest', sans-serif" }}>{submission.partner.squad}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      </ScrollReveal>

      {/* Right: Scoring Form */}
      <ScrollReveal direction="right" delay={150}>
      <div style={{
        background: "var(--bg-card)", borderRadius: "60px", padding: "3rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: "var(--text)",
            background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Оценить работу
          </h2>
          {deadline && (
            <span style={{
              fontFamily: "'Stolzl', sans-serif", fontSize: "0.875rem",
              color: new Date(deadline) < new Date() ? "#EF4444" : "var(--text-muted)",
              padding: "0.5rem 1rem", borderRadius: "100px",
              background: "var(--bg-card-alt)", whiteSpace: "nowrap",
            }}>
              Дедлайн: {new Date(deadline).toLocaleString("ru-RU")}
            </span>
          )}
        </div>

        {criteria.map(criterion => (
          <div key={criterion.id} style={{
            marginBottom: "1.5rem", paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            <label style={{
              display: "block", fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
              fontSize: "1.125rem", color: "var(--text-secondary)", marginBottom: "1rem",
            }}>
              {criterion.name}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="range"
                min="0"
                max={criterion.max_score}
                defaultValue="0"
                onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                style={{
                  flex: 1, accentColor: "var(--accent)", cursor: "pointer",
                  height: "8px", borderRadius: "4px",
                }}
              />
              <span style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 600,
                fontSize: "1.25rem", color: "var(--accent)", minWidth: "60px", textAlign: "right",
              }}>
                {scores[criterion.id]?.score || 0} / {criterion.max_score}
              </span>
            </div>
            <textarea
              placeholder="Комментарий (необязательно)"
              onChange={(e) => handleScoreChange(criterion.id, scores[criterion.id]?.score || 0, e.target.value)}
              style={{
                width: "100%", marginTop: "1rem", padding: "1rem 1.25rem",
                border: "1px solid var(--border)", borderRadius: "24px",
                background: "var(--bg-input-disabled)", color: "var(--text)",
                fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                resize: "vertical", minHeight: "80px", outline: "none",
              }}
            />
          </div>
        ))}

        {sent ? (
          <div style={{
            padding: "1.25rem", background: "rgba(16, 185, 129, 0.1)",
            borderLeft: "3px solid #10B981", borderRadius: "0.75rem",
            fontFamily: "'Onest', sans-serif", color: "#10B981", fontSize: "1rem",
          }}>
            ✓ Оценки успешно отправлены!
          </div>
        ) : (
          <button onClick={handleSubmit} disabled={sending} style={{
            padding: "1rem 2.5rem", borderRadius: "100px", border: "none",
            background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
            color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
            fontSize: "1.125rem", cursor: "pointer", transition: "all 0.2s",
            opacity: sending ? 0.7 : 1,
          }}>
            {sending ? "Отправка..." : "Отправить оценки"}
          </button>
        )}
      </div>
      </ScrollReveal>
    </div>
  );
}