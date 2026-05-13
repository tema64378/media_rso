import { useState, useEffect } from 'react';
import { Skeleton } from '../components';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';

const roleLabels: Record<string, string> = {
  participant: 'Участник', expert: 'Эксперт', admin: 'Администратор', hq: 'Штаб РСО',
};

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem 2rem",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <div style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(3rem, 5vw, 4.5rem)", lineHeight: 1,
        background: accent || "linear-gradient(90deg, var(--accent), #4a6cf7)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>{value}</div>
      <div style={{
        fontFamily: "'Stolzl', sans-serif", fontSize: "0.9375rem",
        color: "var(--text-tertiary)", marginTop: "0.75rem", textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>{label}</div>
    </div>
  );
}

function QuickLink({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: "0.75rem",
      padding: "1rem 2rem", borderRadius: "100px", textDecoration: "none",
      background: primary
        ? "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))"
        : "var(--bg-card-alt)",
      color: primary ? "#fff" : "var(--text)",
      fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "1rem",
      transition: "all 0.2s",
    }}>
      {label}
    </a>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [nominations, setNominations] = useState<any[]>([]);
  const [myNomIds, setMyNomIds] = useState<number[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [evalDeadline, setEvalDeadline] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [expertData, setExpertData] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    Promise.all([
      fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${BASE}/nominations`).then(r => r.json()),
      fetch(`${BASE}/submissions`).then(r => r.json()),
      fetch(`${BASE}/media-teams/mine`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${BASE}/settings`).then(r => r.json()),
    ]).then(([meRes, nomRes, subRes, teamRes, settingsRes]) => {
      if (meRes.status === "ok") setUser(meRes.user);
      if (nomRes.status === "ok") setNominations(nomRes.nominations || []);
      if (subRes.status === "ok") setSubmissions(subRes.submissions || []);
      if (teamRes.status === "ok") setTeam(teamRes.team);
      if (settingsRes.status === "ok") {
        const s = settingsRes.settings || [];
        const sd = s.find((x: any) => x.key === "submission_deadline");
        const ed = s.find((x: any) => x.key === "evaluation_deadline");
        if (sd) setDeadline(sd.value);
        if (ed) setEvalDeadline(ed.value);
      }

      if (meRes.status === "ok" && meRes.user?.role === "participant") {
        fetch(`${BASE}/admin/users/${meRes.user.id}/nominations`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(d => {
          if (d.status === "ok") setMyNomIds(d.nomination_ids || []);
        }).catch(() => {});
      }

      if (meRes.status === "ok" && (meRes.user?.role === "admin" || meRes.user?.role === "hq")) {
        fetch(`${BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => {
            if (d.status === "ok") setStats(d.counts);
          }).catch(() => {});
        fetch(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => {
            if (d.status === "ok") setRecentUsers((d.users || []).slice(-5).reverse());
          }).catch(() => {});
      }

      if (meRes.status === "ok" && (meRes.user?.role === "expert" || meRes.user?.role === "admin" || meRes.user?.role === "hq")) {
        fetch(`${BASE}/dashboard/expert`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => {
            if (d.status === "ok") setExpertData(d);
          }).catch(() => {});
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!user) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Не авторизован</div>;

  const mySubmissions = submissions.filter((s: any) => s.user_id === user.id);
  const myNominations = nominations.filter(n => myNomIds.includes(n.id));
  const isParticipant = role === "participant";
  const isExpert = role === "expert";
  const isAdmin = role === "admin" || role === "hq";

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Greeting */}
      <ScrollReveal>
      <div style={{
        background: "linear-gradient(135deg, var(--accent), #4a6cf7)",
        borderRadius: "60px", padding: "3rem", marginBottom: "2rem",
        color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{
              fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: "0.5rem",
            }}>
              {user.name ? `${user.name.split(' ')[0]}, привет!` : 'Добро пожаловать!'}
            </h1>
            <p style={{
              fontFamily: "'Onest', sans-serif", fontSize: "1.25rem", opacity: 0.9,
            }}>
              {roleLabels[user.role] || user.role} • {user.team_name || user.email}
            </p>
          </div>
          <span style={{
            display: "inline-block", padding: "0.5rem 1.5rem",
            background: "rgba(255,255,255,0.2)", borderRadius: "100px",
            fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.9375rem",
            backdropFilter: "blur(8px)",
          }}>
            {roleLabels[user.role] || user.role}
          </span>
        </div>
      </div>
      </ScrollReveal>

      {/* === PARTICIPANT DASHBOARD === */}
      {isParticipant && (
        <>
          {/* Deadline banner */}
          {deadline && (
            <ScrollReveal>
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "1.25rem 2rem",
              marginBottom: "2rem", display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
            }}>
              <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)" }}>
                Дедлайн отправки работ:
              </span>
              <span style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem",
                color: new Date(deadline) < new Date() ? "#EF4444" : "var(--accent)",
              }}>
                {new Date(deadline).toLocaleString("ru-RU")}
              </span>
            </div>
            </ScrollReveal>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
            {/* My Nominations */}
            <ScrollReveal direction="left">
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem",
            }}>
              <h2 style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", color: "var(--text)",
                marginBottom: "1.5rem",
                background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Мои номинации</h2>
              {myNominations.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {myNominations.map(n => (
                    <span key={n.id} style={{
                      padding: "0.75rem 1.5rem", borderRadius: "100px",
                      background: "rgba(var(--accent-rgb), 0.15)", color: "var(--accent)",
                      fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.9375rem",
                    }}>{n.name}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-muted)", fontSize: "1rem" }}>
                  Номинации не назначены. Обратитесь к администратору.
                </p>
              )}
            </div>
            </ScrollReveal>

            {/* My Works */}
            <ScrollReveal direction="right" delay={100}>
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem",
            }}>
              <h2 style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", color: "var(--text)",
                marginBottom: "1.5rem",
                background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Мои работы</h2>
              {mySubmissions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {mySubmissions.map(s => {
                    const statusLabels: Record<string, { label: string; color: string }> = {
                      draft: { label: "Черновик", color: "#F59E0B" },
                      submitted: { label: "На проверке", color: "#3B82F6" },
                      under_review: { label: "Оценивается", color: "#8B5CF6" },
                      reviewed: { label: "Проверено", color: "#10B981" },
                    };
                    const st = s.status ? statusLabels[s.status] : null;
                    return (
                      <div key={s.id} style={{
                        padding: "1rem 1.25rem", borderRadius: "24px",
                        background: "var(--bg-card-alt)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontFamily: "'Onest', sans-serif", fontWeight: 600, fontSize: "1.0625rem", color: "var(--text)" }}>
                            {s.title}
                          </div>
                          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                            {s.url && (
                              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: "0.875rem", color: "var(--accent)", fontFamily: "'Onest', sans-serif",
                              }}>Ссылка</a>
                            )}
                            {s.file_path && (
                              <a href={`${BASE}/uploads/${s.file_path}`} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: "0.875rem", color: "var(--accent)", fontFamily: "'Onest', sans-serif",
                              }}>Файл</a>
                            )}
                          </div>
                        </div>
                        {st && (
                          <span style={{
                            fontFamily: "'Stolzl', sans-serif", fontSize: "0.75rem",
                            color: st.color, padding: "0.25rem 0.75rem", borderRadius: "100px",
                            background: `${st.color}15`, whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {st.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-muted)", fontSize: "1rem" }}>
                  Вы ещё не загрузили ни одной работы.
                </p>
              )}
            </div>
            </ScrollReveal>
          </div>

          {/* Media Team */}
          {team && (
            <ScrollReveal>
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "2rem 2.5rem",
              marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
            }}>
              <div style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "1.125rem", color: "var(--text)",
              }}>
                Команда:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: team.partner.avatar
                    ? `url(${team.partner.avatar}) center/cover`
                    : "linear-gradient(135deg, var(--accent), #4a6cf7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                  fontSize: "1.125rem", color: "#fff", flexShrink: 0,
                }}>
                  {!team.partner.avatar && team.partner.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "'Onest', sans-serif", fontWeight: 600, color: "var(--text)" }}>
                    {team.partner.name || "Без имени"}
                  </div>
                  {team.partner.position && (
                    <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.875rem", color: "var(--accent)" }}>
                      {team.partner.position}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
          )}

          {/* Quick Actions */}
          <ScrollReveal>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <QuickLink href="/submissions" label="Загрузить работу" primary />
            <QuickLink href="/results" label="Результаты" />
            <QuickLink href="/profile" label="Профиль" />
          </div>
          </ScrollReveal>
        </>
      )}

      {/* === EXPERT DASHBOARD === */}
      {isExpert && (
        <>
          {expertData && (
            <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
              <StatCard value={expertData.pending} label="Ожидают оценки" accent="linear-gradient(135deg, #F59E0B, #EF4444)" />
              <StatCard value={expertData.my_scored} label="Оценено" accent="linear-gradient(90deg, var(--accent), #4a6cf7)" />
              <StatCard value={expertData.total_submissions} label="Всего работ" />
            </div>
            </ScrollReveal>
          )}

          {evalDeadline && (
            <ScrollReveal delay={100}>
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "1.25rem 2rem",
              marginBottom: "2rem", display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
            }}>
              <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)" }}>
                Дедлайн оценки:
              </span>
              <span style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem",
                color: new Date(evalDeadline) < new Date() ? "#EF4444" : "var(--accent)",
              }}>
                {new Date(evalDeadline).toLocaleString("ru-RU")}
              </span>
            </div>
            </ScrollReveal>
          )}

          <ScrollReveal delay={200}>
          <div style={{
            background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem", marginBottom: "2rem",
          }}>
            <h2 style={{
              fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: "var(--text)", marginBottom: "1.5rem",
              background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Быстрый переход к оценке</h2>
            <p style={{
              fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
              color: "var(--text-tertiary)", marginBottom: "2rem",
            }}>
              Перейдите в раздел работ, чтобы оценить конкурсные материалы участников по всем критериям.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <QuickLink href="/gallery" label="Перейти к работам" primary />
              <QuickLink href="/results" label="Результаты" />
            </div>
          </div>
          </ScrollReveal>
        </>
      )}

      {/* === ADMIN / HQ DASHBOARD === */}
      {isAdmin && (
        <>
          <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
            <StatCard value={stats?.users || 0} label="Пользователей" />
            <StatCard value={stats?.submissions || 0} label="Работ" />
            <StatCard value={expertData?.total_experts || 0} label="Экспертов" />
            <StatCard value={nominations.length} label="Номинаций" />
          </div>
          </ScrollReveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
            {/* Recent users */}
            <ScrollReveal direction="left">
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem",
            }}>
              <h2 style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", color: "var(--text)", marginBottom: "1.5rem",
                background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Последние регистрации</h2>
              {recentUsers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {recentUsers.map((u: any) => (
                    <div key={u.id} style={{
                      padding: "0.75rem 1rem", borderRadius: "24px",
                      background: "var(--bg-card-alt)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontFamily: "'Onest', sans-serif", fontWeight: 600, color: "var(--text)" }}>
                          {u.name || "Без имени"}
                        </div>
                        <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {u.email}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'Stolzl', sans-serif", fontSize: "0.75rem",
                        padding: "0.25rem 0.75rem", borderRadius: "100px",
                        background: "var(--bg-card)", color: "var(--text-tertiary)",
                      }}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-muted)" }}>
                  Нет пользователей
                </p>
              )}
            </div>
            </ScrollReveal>

            {/* Deadlines */}
            <ScrollReveal direction="right" delay={100}>
            <div style={{
              background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem",
            }}>
              <h2 style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", color: "var(--text)", marginBottom: "1.5rem",
                background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Дедлайны</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem 1.25rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Отправка работ</div>
                  <div style={{ fontSize: "1.125rem", fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, color: deadline ? (new Date(deadline) < new Date() ? "#EF4444" : "var(--accent)") : "var(--text-muted)" }}>
                    {deadline ? new Date(deadline).toLocaleString("ru-RU") : "Не установлен"}
                  </div>
                </div>
                <div style={{ padding: "1rem 1.25rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.25rem" }}>Оценка работ</div>
                  <div style={{ fontSize: "1.125rem", fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, color: evalDeadline ? (new Date(evalDeadline) < new Date() ? "#EF4444" : "var(--accent)") : "var(--text-muted)" }}>
                    {evalDeadline ? new Date(evalDeadline).toLocaleString("ru-RU") : "Не установлен"}
                  </div>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <QuickLink href="/admin" label="Управление дедлайнами" />
                </div>
              </div>
            </div>
            </ScrollReveal>
          </div>

          {/* Quick Links */}
          <ScrollReveal>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <QuickLink href="/admin" label="Админ-панель" primary />
            <QuickLink href="/gallery" label="Работы на оценку" />
            <QuickLink href="/results" label="Результаты" />
          </div>
          </ScrollReveal>
        </>
      )}
    </div>
  );
}
