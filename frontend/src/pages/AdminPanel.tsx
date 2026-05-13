import React, { useState, useEffect } from "react";
import { Skeleton } from '../components';
import ScrollReveal from '../components/ScrollReveal';

const roleLabels: Record<string, string> = {
  admin: "Администратор", expert: "Эксперт", participant: "Участник", hq: "Штаб",
};

const roleColors: Record<string, string> = {
  admin: "#EF4444", expert: "var(--accent)", participant: "#10B981", hq: "#F59E0B",
};

const statusLabels: Record<string, string> = {
  draft: "Черновик", submitted: "На модерации", under_review: "На оценке",
  reviewed: "Оценено", approved: "Одобрено", rejected: "Отклонено",
};

const statusColors: Record<string, string> = {
  draft: "#9CA3AF", submitted: "#F59E0B", under_review: "#3B82F6",
  reviewed: "#8B5CF6", approved: "#10B981", rejected: "#EF4444",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "60px", padding: "2.5rem 2rem",
      textAlign: "center", transition: "transform 0.3s",
    }}>
      <div style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(3rem, 5vw, 4.5rem)", color: "var(--accent)",
        marginBottom: "0.75rem",
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'Stolzl', sans-serif", fontSize: "1.0625rem",
        color: "var(--text-muted)",
      }}>
        {label}
      </div>
    </div>
  );
}

type Tab = "stats" | "users" | "submissions" | "deadlines" | "nominations" | "experts" | "notifications" | "stages" | "export" | "audit" | "reports";

const tabs: { key: Tab; label: string }[] = [
  { key: "stats", label: "Статистика" },
  { key: "users", label: "Пользователи" },
  { key: "submissions", label: "Работы" },
  { key: "deadlines", label: "Дедлайны" },
  { key: "nominations", label: "Номинации" },
  { key: "experts", label: "Эксперты" },
  { key: "notifications", label: "Рассылка" },
  { key: "stages", label: "Этапы" },
  { key: "export", label: "Экспорт" },
  { key: "audit", label: "Журнал" },
  { key: "reports", label: "Отчёты" },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<{ users: number; submissions: number } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [nominations, setNominations] = useState<any[]>([]);
  const [userNoms, setUserNoms] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingNom, setSavingNom] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [roleMap, setRoleMap] = useState<Record<number, string>>({});
  const [expandedNom, setExpandedNom] = useState<number | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [nomForm, setNomForm] = useState({ name: "", description: "" });
  const [editingNom, setEditingNom] = useState<any>(null);
  const [criterionForm, setCriterionForm] = useState<Record<number, { name: string; max_score: number; weight: number }>>({});
  const [nomExperts, setNomExperts] = useState<Record<number, any[]>>({});
  const [expertUsers, setExpertUsers] = useState<any[]>([]);
  const [notifForm, setNotifForm] = useState({ subject: "", body: "", target_role: "participant" });
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState<string | null>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState("");
  const [newDeadlineAt, setNewDeadlineAt] = useState("");
  const [newDeadlineRole, setNewDeadlineRole] = useState("both");
  const [creatingDeadline, setCreatingDeadline] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [moderating, setModerating] = useState<number | null>(null);
  const [modComment, setModComment] = useState("");
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchNominations();
    fetchDeadlines();
    fetchSubmissions();
    fetchAuditLog();
    fetchReports();
  }, []);

  const apiFetch = async (url: string, opts?: RequestInit) => {
    try {
      const res = await fetch(url, {
        ...opts,
        headers: { ...opts?.headers, Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (e: any) { setError(e.message || String(e)); return null; }
  };

  const fetchStats = async () => {
    const data = await apiFetch(`${BASE}/admin/stats`);
    if (data?.status === "ok") setStats(data.counts);
  };

  const fetchUsers = async () => {
    const data = await apiFetch(`${BASE}/admin/users`);
    if (data?.status === "ok") setUsers(data.users || []);
  };

  const fetchNominations = async () => {
    const data = await apiFetch(`${BASE}/nominations`);
    if (data?.status === "ok") setNominations(data.nominations || []);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const data = await apiFetch(`${BASE}/settings`);
    if (data?.status === "ok") {
      const map: Record<string, any> = {};
      data.settings.forEach((s: any) => { map[s.key] = s; });
      setSettings(map);
    }
  };

  const fetchSubmissions = async () => {
    const data = await apiFetch(`${BASE}/admin/submissions`);
    if (data?.status === "ok") setSubmissions(data.submissions || []);
  };

  const fetchAuditLog = async () => {
    const data = await apiFetch(`${BASE}/admin/audit-log`);
    if (data?.status === "ok") setAuditLog(data.entries || []);
  };

  const fetchReports = async () => {
    const data = await apiFetch(`${BASE}/admin/reports/nominations`);
    if (data?.status === "ok") setReports(data.reports || []);
  };

  const fetchDeadlines = async () => {
    const data = await apiFetch(`${BASE}/admin/deadlines`);
    if (data?.status === "ok") setDeadlines(data.deadlines || []);
  };

  const fetchNomExperts = async (nomId: number) => {
    const data = await apiFetch(`${BASE}/admin/nominations/${nomId}/experts`);
    if (data?.status === "ok") setNomExperts(prev => ({ ...prev, [nomId]: data.experts || [] }));
  };

  const fetchStages = async () => {
    const data = await apiFetch(`${BASE}/admin/stages`);
    if (data?.status === "ok") setStages(data.stages || []);
  };

  // Also load expert users for assignment
  useEffect(() => {
    apiFetch(`${BASE}/admin/users`).then(data => {
      if (data?.status === "ok") setExpertUsers((data.users || []).filter((u: any) => u.role === "expert"));
    });
  }, []);

  const createNomination = async () => {
    if (!nomForm.name) return;
    const data = await apiFetch(`${BASE}/admin/nominations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nomForm),
    });
    if (data?.status === "ok") { setNomForm({ name: "", description: "" }); fetchNominations(); }
    else alert(data?.error || "Ошибка");
  };

  const updateNomination = async () => {
    if (!editingNom || !nomForm.name) return;
    const data = await apiFetch(`${BASE}/admin/nominations/${editingNom.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nomForm),
    });
    if (data?.status === "ok") { setEditingNom(null); setNomForm({ name: "", description: "" }); fetchNominations(); }
    else alert(data?.error || "Ошибка");
  };

  const deleteNomination = async (id: number) => {
    if (!confirm("Удалить номинацию?")) return;
    const data = await apiFetch(`${BASE}/admin/nominations/${id}`, { method: "DELETE" });
    if (data?.status === "ok") fetchNominations();
    else alert(data?.error || "Ошибка");
  };

  const addCriterion = async (nomId: number) => {
    const cf = criterionForm[nomId];
    if (!cf || !cf.name) return;
    const data = await apiFetch(`${BASE}/admin/nominations/${nomId}/criteria`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cf.name, max_score: cf.max_score, weight: cf.weight }),
    });
    if (data?.status === "ok") { setCriterionForm(prev => ({ ...prev, [nomId]: { name: "", max_score: 10, weight: 1 } })); fetchNominations(); }
    else alert(data?.error || "Ошибка");
  };

  const deleteCriterion = async (id: number) => {
    const data = await apiFetch(`${BASE}/admin/criteria/${id}`, { method: "DELETE" });
    if (data?.status === "ok") fetchNominations();
    else alert(data?.error || "Ошибка");
  };

  const addNominationExpert = async (nomId: number, expertId: number) => {
    const data = await apiFetch(`${BASE}/admin/nominations/${nomId}/experts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expert_id: expertId }),
    });
    if (data?.status === "ok") fetchNomExperts(nomId);
    else alert(data?.error || "Ошибка");
  };

  const removeNominationExpert = async (nomId: number, expertId: number) => {
    const data = await apiFetch(`${BASE}/admin/nominations/${nomId}/experts/${expertId}`, { method: "DELETE" });
    if (data?.status === "ok") fetchNomExperts(nomId);
    else alert(data?.error || "Ошибка");
  };

  const sendNotification = async () => {
    if (!notifForm.subject || !notifForm.body) { alert("Заполните все поля"); return; }
    setSendingNotif(true);
    setNotifResult(null);
    const data = await apiFetch(`${BASE}/admin/notifications`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notifForm),
    });
    setSendingNotif(false);
    if (data?.status === "ok") {
      setNotifResult(`Отправлено: ${data.sent}, ошибок: ${data.failed}`);
      setNotifForm({ subject: "", body: "", target_role: "participant" });
    } else { alert(data?.error || "Ошибка"); }
  };

  const toggleStage = async (key: string, enabled: boolean) => {
    const data = await apiFetch(`${BASE}/admin/stages?key=${key}&enabled=${enabled}`, { method: "POST" });
    if (data?.status === "ok") fetchStages();
  };

  const createDeadline = async () => {
    if (!newDeadlineTitle || !newDeadlineAt) { alert("Заполните все поля"); return; }
    setCreatingDeadline(true);
    const data = await apiFetch(`${BASE}/admin/deadlines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDeadlineTitle, deadline_at: newDeadlineAt, target_role: newDeadlineRole }),
    });
    setCreatingDeadline(false);
    if (data?.status === "ok") {
      setNewDeadlineTitle(""); setNewDeadlineAt(""); setNewDeadlineRole("both");
      fetchDeadlines();
    } else { alert(data?.error || "Ошибка"); }
  };

  const deleteDeadline = async (id: number) => {
    const data = await apiFetch(`${BASE}/admin/deadlines/${id}`, { method: "DELETE" });
    if (data?.status === "ok") fetchDeadlines();
    else alert(data?.error || "Ошибка");
  };

  const fetchUserNoms = async (userId: number) => {
    const data = await apiFetch(`${BASE}/admin/users/${userId}/nominations`);
    if (data?.status === "ok") setUserNoms(prev => ({ ...prev, [userId]: data.nomination_ids || [] }));
  };

  const toggleNomination = (userId: number, nomId: number) => {
    setUserNoms(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(nomId)
        ? current.filter(id => id !== nomId)
        : [...current, nomId];
      return { ...prev, [userId]: updated };
    });
  };

  const saveNominations = async (userId: number) => {
    setSavingNom(userId);
    const data = await apiFetch(`${BASE}/admin/users/${userId}/nominations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomination_ids: userNoms[userId] || [] }),
    });
    if (data?.status !== "ok") alert(data?.error || "Ошибка");
    setSavingNom(null);
  };

  const changeRole = async (userId: number) => {
    const newRole = roleMap[userId];
    if (!newRole) return;
    const data = await apiFetch(`${BASE}/admin/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (data?.status === "ok") {
      setUsers(prev => prev.map((u: any) => u.id === userId ? { ...u, role: newRole } : u));
      setEditingRole(null);
    } else alert(data?.error || "Ошибка");
  };

  const moderateSubmission = async (subId: number, status: string) => {
    setModerating(subId);
    const data = await apiFetch(`${BASE}/admin/submissions/${subId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment: modComment || null }),
    });
    if (data?.status === "ok") {
      setModComment("");
      setModerating(null);
      fetchSubmissions();
      fetchAuditLog();
      fetchReports();
    } else { alert(data?.error || "Ошибка"); setModerating(null); }
  };

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: "1920px", margin: "0 auto", padding: "0 2rem" }}>
      {error && <div className="error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <ScrollReveal>
        <h1 style={{
          fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
          fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--text)",
          marginBottom: "0.5rem",
        }}>
          Админ-панель
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <p style={{
          fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
          color: "var(--text-tertiary)", marginBottom: "2rem",
        }}>
          Управление пользователями, номинациями и мониторинг системы
        </p>
      </ScrollReveal>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap",
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "0.75rem 1.5rem", borderRadius: "100px", border: "none",
            background: tab === t.key ? "var(--accent)" : "var(--bg-card)",
            color: tab === t.key ? "#fff" : "var(--text-secondary)",
            fontWeight: 600, cursor: "pointer", fontFamily: "'Stolzl', sans-serif",
            fontSize: "0.9375rem", transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Stats */}
      {tab === "stats" && (
        <ScrollReveal>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem", marginBottom: "3rem",
          }}>
            <StatCard label="Пользователей" value={stats?.users || 0} />
            <StatCard label="Загруженных работ" value={stats?.submissions || 0} />
          </div>
        </ScrollReveal>
      )}

      {/* Tab: Users */}
      {tab === "users" && (
        <ScrollReveal>
          <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
            }}>
              <h2 style={{
                fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "var(--text)",
                background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Пользователи
              </h2>
              <span style={{ fontFamily: "'Stolzl', sans-serif", fontSize: "1rem", color: "var(--text-muted)" }}>
                Всего: {users.length}
              </span>
            </div>
            {users.length === 0 ? (
              <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
                Нет пользователей
              </p>
            ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Имя</th>
                    <th style={thStyle}>Роль</th>
                    <th style={thStyle}>Номинации</th>
                    <th style={thStyle}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => {
                    const isEditing = editingRole === user.id;
                    const isNomExpanded = expandedNom === user.id;
                    const userNomIds = userNoms[user.id] || [];
                    return (
                      <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={tdStyle}>{user.id}</td>
                        <td style={tdStyle}>{user.email}</td>
                        <td style={tdStyle}>{user.name || "—"}</td>
                        <td style={tdStyle}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <select value={roleMap[user.id] || user.role} onChange={e => setRoleMap({ ...roleMap, [user.id]: e.target.value })} style={{
                                padding: "0.5rem 0.75rem", background: "var(--bg-input)", color: "var(--text)",
                                border: "1px solid var(--border)", borderRadius: "0.5rem",
                                fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem",
                              }}>
                                {["participant", "expert", "hq", "admin"].map(r => (
                                  <option key={r} value={r}>{roleLabels[r] || r}</option>
                                ))}
                              </select>
                              <button onClick={() => changeRole(user.id)} style={btnSm}>OK</button>
                              <button onClick={() => setEditingRole(null)} style={btnOutline}>✕</button>
                            </div>
                          ) : (
                            <span style={{
                              display: "inline-block", padding: "0.375rem 1.25rem",
                              background: roleColors[user.role] || "var(--border)", color: "white",
                              borderRadius: "100px", fontSize: "0.875rem", fontWeight: 600,
                              fontFamily: "'Stolzl', sans-serif",
                            }}>
                              {roleLabels[user.role] || user.role}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {isNomExpanded ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {nominations.map(nom => (
                                <label key={nom.id} style={{
                                  display: "flex", alignItems: "center", gap: "0.5rem",
                                  cursor: "pointer", fontFamily: "'Onest', sans-serif",
                                  fontSize: "0.9375rem", color: "var(--text-tertiary)",
                                }}>
                                  <input type="checkbox" checked={userNomIds.includes(nom.id)}
                                    onChange={() => toggleNomination(user.id, nom.id)}
                                    style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
                                  {nom.name}
                                </label>
                              ))}
                              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <button onClick={() => saveNominations(user.id)} disabled={savingNom === user.id} style={btnSm}>
                                  {savingNom === user.id ? "..." : "Сохранить"}
                                </button>
                                <button onClick={() => setExpandedNom(null)} style={btnOutline}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                              {userNomIds.length > 0 ? nominationChips(userNomIds, nominations) : <span style={{ color: "var(--text-subtle)", fontSize: "0.9375rem" }}>—</span>}
                              <button onClick={() => { fetchUserNoms(user.id); setExpandedNom(user.id); }} style={btnOutlineSm}>
                                {userNomIds.length > 0 ? "Изменить" : "Назначить"}
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {!isEditing && (
                            <button onClick={() => { setEditingRole(user.id); setRoleMap({ ...roleMap, [user.id]: user.role }); }} style={btnOutline}>
                              Сменить роль
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Submissions Moderation */}
      {tab === "submissions" && (
        <ScrollReveal delay={80}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
          }}>
            <h2 style={sectionTitle}>Модерация работ</h2>
            <button onClick={fetchSubmissions} style={btnOutlineSm}>Обновить</button>
          </div>
          {submissions.length === 0 ? (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
              Нет работ
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Название</th>
                    <th style={thStyle}>Автор</th>
                    <th style={thStyle}>Статус</th>
                    <th style={thStyle}>Оценок</th>
                    <th style={thStyle}>Ср. балл</th>
                    <th style={thStyle}>Модерация</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s: any) => {
                    const isModerating = moderating === s.id;
                    const subStatus = s.status || "submitted";
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={tdStyle}>{s.id}</td>
                        <td style={{ ...tdStyle, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <div style={{ fontWeight: 600, color: "var(--text)" }}>{s.title}</div>
                          {s.moderation_comment && (
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                              Комментарий: {s.moderation_comment}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ color: "var(--text)" }}>{s.author_name || "—"}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{s.author_email}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-block", padding: "0.25rem 0.75rem",
                            background: statusColors[subStatus] || "#9CA3AF", color: "white",
                            borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600,
                            fontFamily: "'Stolzl', sans-serif", whiteSpace: "nowrap",
                          }}>
                            {statusLabels[subStatus] || subStatus}
                          </span>
                        </td>
                        <td style={tdStyle}>{s.score_count}</td>
                        <td style={tdStyle}>{s.avg_score > 0 ? s.avg_score : "—"}</td>
                        <td style={tdStyle}>
                          {isModerating ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "250px" }}>
                              <input placeholder="Комментарий (опционально)" value={modComment}
                                onChange={e => setModComment(e.target.value)}
                                style={{
                                  padding: "0.5rem 0.75rem", border: "1px solid var(--border)",
                                  borderRadius: "0.5rem", background: "var(--bg-input)", color: "var(--text)",
                                  fontFamily: "'Onest', sans-serif", fontSize: "0.875rem",
                                }} />
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => moderateSubmission(s.id, "approved")} style={{
                                  padding: "0.375rem 1rem", borderRadius: "100px", border: "none",
                                  background: "#10B981", color: "#fff", fontWeight: 600, cursor: "pointer",
                                  fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem",
                                }}>✓ Одобрить</button>
                                <button onClick={() => moderateSubmission(s.id, "rejected")} style={{
                                  padding: "0.375rem 1rem", borderRadius: "100px", border: "none",
                                  background: "#EF4444", color: "#fff", fontWeight: 600, cursor: "pointer",
                                  fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem",
                                }}>✕ Отклонить</button>
                                <button onClick={() => { setModerating(null); setModComment(""); }} style={btnOutline}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => { setModerating(s.id); setModComment(s.moderation_comment || ""); }} style={{
                                padding: "0.375rem 1rem", borderRadius: "100px",
                                border: "1px solid var(--border-light)", background: "transparent",
                                color: "var(--text-tertiary)", cursor: "pointer",
                                fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem", fontWeight: 600,
                              }}>
                                {subStatus === "approved" || subStatus === "rejected" ? "Изменить" : "Модерировать"}
                              </button>
                              {s.moderator_name && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
                                  {s.moderator_name}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Deadlines */}
      {tab === "deadlines" && (
        <ScrollReveal delay={160}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={sectionTitle}>Дедлайны</h2>
            <button onClick={fetchDeadlines} style={btnOutlineSm}>Обновить</button>
          </div>

          {/* Create form */}
          <div style={{ padding: "2rem", borderRadius: "40px", background: "var(--bg-card-alt)", marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--text)", marginBottom: "1.5rem" }}>
              Создать дедлайн
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input placeholder="Название (например, «Приём работ»)" value={newDeadlineTitle}
                onChange={e => setNewDeadlineTitle(e.target.value)}
                style={{
                  width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)",
                  borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                }} />
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <input type="datetime-local" value={newDeadlineAt}
                  onChange={e => setNewDeadlineAt(e.target.value + ":00")}
                  style={{
                    flex: 1, padding: "1rem 1.25rem", border: "1px solid var(--border)",
                    borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                  }} />
                <select value={newDeadlineRole}
                  onChange={e => setNewDeadlineRole(e.target.value)}
                  style={{
                    flex: 1, padding: "1rem 1.25rem", border: "1px solid var(--border)",
                    borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1rem", cursor: "pointer",
                  }}>
                  <option value="both">Для всех</option>
                  <option value="participant">Для участников</option>
                  <option value="expert">Для экспертов</option>
                </select>
              </div>
              <button onClick={createDeadline} disabled={creatingDeadline} style={{
                padding: "1rem 2rem", borderRadius: "100px", border: "none",
                background: "var(--accent)", color: "#fff", fontWeight: 700,
                fontFamily: "'Stolzl', sans-serif", fontSize: "1rem", cursor: "pointer",
                alignSelf: "flex-start",
              }}>
                {creatingDeadline ? "Создание..." : "Создать дедлайн"}
              </button>
            </div>
          </div>

          {/* List */}
          {deadlines.length === 0 ? (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
              Нет дедлайнов
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {deadlines.map((d: any) => (
                <div key={d.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "1.5rem 2rem", borderRadius: "32px", background: "var(--bg-card-alt)",
                  flexWrap: "wrap", gap: "1rem",
                }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "var(--text)", marginBottom: "0.25rem" }}>
                      {d.title}
                    </div>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>
                        {new Date(d.deadline_at).toLocaleString("ru-RU")}
                      </span>
                      <span style={{
                        display: "inline-block", padding: "0.25rem 0.75rem",
                        background: d.target_role === "expert" ? "rgba(59,130,246,0.15)" :
                          d.target_role === "participant" ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.15)",
                        color: d.target_role === "expert" ? "#3B82F6" :
                          d.target_role === "participant" ? "#10B981" : "#8B5CF6",
                        borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600,
                        fontFamily: "'Stolzl', sans-serif",
                      }}>
                        {d.target_role === "expert" ? "Эксперты" : d.target_role === "participant" ? "Участники" : "Все"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteDeadline(d.id)} style={{
                    padding: "0.5rem 1.25rem", borderRadius: "100px",
                    border: "1px solid #EF4444", background: "transparent",
                    color: "#EF4444", cursor: "pointer",
                    fontFamily: "'Stolzl', sans-serif", fontSize: "0.875rem", fontWeight: 600,
                  }}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Nominations */}
      {tab === "nominations" && (
        <ScrollReveal delay={240}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={sectionTitle}>Номинации</h2>
            <button onClick={() => { setEditingNom(null); setNomForm({ name: "", description: "" }); }} style={editingNom === null && nomForm.name ? { ...btnSm, opacity: 0.5 } : btnSm}>
              + Новая
            </button>
          </div>

          {/* Create/Edit Form */}
          <div style={{ padding: "2rem", borderRadius: "40px", background: "var(--bg-card-alt)", marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "var(--text)", marginBottom: "1rem" }}>
              {editingNom ? `Редактировать: ${editingNom.name}` : "Создать номинацию"}
            </h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <input placeholder="Название" value={nomForm.name}
                onChange={e => setNomForm(prev => ({ ...prev, name: e.target.value }))}
                style={{ flex: 2, padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif" }} />
              <input placeholder="Описание" value={nomForm.description}
                onChange={e => setNomForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ flex: 3, padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif" }} />
            </div>
            <button onClick={editingNom ? updateNomination : createNomination} style={btnSm}>
              {editingNom ? "Сохранить" : "Создать"}
            </button>
            {editingNom && <button onClick={() => { setEditingNom(null); setNomForm({ name: "", description: "" }); }} style={{ ...btnOutline, marginLeft: "0.5rem" }}>Отмена</button>}
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {nominations.map(nom => {
              const isEditingNom = editingNom?.id === nom.id;
              const experts = nomExperts[nom.id] || [];
              const cf = criterionForm[nom.id] || { name: "", max_score: 10, weight: 1 };
              return (
                <div key={nom.id} style={{ padding: "2rem", borderRadius: "32px", background: "var(--bg-card-alt)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--accent)" }}>
                        {nom.name}
                      </div>
                      <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {nom.description || "—"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => { setEditingNom(nom); setNomForm({ name: nom.name, description: nom.description || "" }); }} style={btnOutlineSm}>✎</button>
                      <button onClick={() => deleteNomination(nom.id)} style={{ ...btnOutlineSm, color: "#EF4444", borderColor: "#EF4444" }}>✕</button>
                    </div>
                  </div>

                  {/* Criteria */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>
                      Критерии оценки
                    </div>
                    {nom.criteria && nom.criteria.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {nom.criteria.map((c: any) => (
                          <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.75rem", borderRadius: "100px", background: "rgba(var(--accent-rgb), 0.1)", color: "var(--text)", fontSize: "0.875rem" }}>
                            {c.name} ({c.max_score} б.)
                            <button onClick={() => deleteCriterion(c.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0, fontSize: "1rem", lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>Нет критериев</span>
                    )}
                  </div>

                  {/* Add criterion */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <input placeholder="Название критерия" value={cf.name}
                      onChange={e => setCriterionForm(prev => ({ ...prev, [nom.id]: { ...prev[nom.id], name: e.target.value, max_score: prev[nom.id]?.max_score || 10, weight: prev[nom.id]?.weight || 1 } }))}
                      style={{ flex: 1, minWidth: "150px", padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-input)", color: "var(--text)", fontSize: "0.875rem" }} />
                    <input type="number" placeholder="Макс. балл" value={cf.max_score}
                      onChange={e => setCriterionForm(prev => ({ ...prev, [nom.id]: { ...prev[nom.id], name: prev[nom.id]?.name || "", max_score: parseInt(e.target.value) || 0, weight: prev[nom.id]?.weight || 1 } }))}
                      style={{ width: "80px", padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-input)", color: "var(--text)", fontSize: "0.875rem" }} />
                    <button onClick={() => addCriterion(nom.id)} style={btnOutlineSm}>+ Критерий</button>
                  </div>

                  {/* Experts */}
                  <div>
                    <div style={{ fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>
                      Эксперты номинации
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      {experts.map((e: any) => (
                        <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.75rem", borderRadius: "100px", background: "rgba(59,130,246,0.1)", color: "#3B82F6", fontSize: "0.875rem" }}>
                          {e.name || e.email}
                          <button onClick={() => removeNominationExpert(nom.id, e.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select onChange={e => { if (e.target.value) { addNominationExpert(nom.id, parseInt(e.target.value)); e.target.value = ""; } }}
                        style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-input)", color: "var(--text)", fontSize: "0.875rem" }}>
                        <option value="">Назначить эксперта...</option>
                        {expertUsers.filter(eu => !experts.some((e: any) => e.id === eu.id)).map((eu: any) => (
                          <option key={eu.id} value={eu.id}>{eu.name || eu.email}</option>
                        ))}
                      </select>
                      <button onClick={() => fetchNomExperts(nom.id)} style={btnOutlineSm}>Обновить</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Experts list */}
      {tab === "experts" && (
        <ScrollReveal delay={240}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem" }}>
          <h2 style={sectionTitle}>Эксперты</h2>
          {expertUsers.length === 0 ? (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
              Нет экспертов
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {expertUsers.map((eu: any) => (
                <div key={eu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderRadius: "24px", background: "var(--bg-card-alt)" }}>
                  <div>
                    <div style={{ fontFamily: "'Stolzl', sans-serif", fontWeight: 600, color: "var(--text)" }}>{eu.name || "—"}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{eu.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Notifications */}
      {tab === "notifications" && (
        <ScrollReveal delay={240}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem" }}>
          <h2 style={sectionTitle}>Рассылка уведомлений</h2>
          <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)", marginBottom: "2rem" }}>
            Отправьте email-уведомление выбранной группе пользователей.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
            <input placeholder="Тема письма" value={notifForm.subject}
              onChange={e => setNotifForm(prev => ({ ...prev, subject: e.target.value }))}
              style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem" }} />
            <textarea placeholder="Текст письма" value={notifForm.body}
              onChange={e => setNotifForm(prev => ({ ...prev, body: e.target.value }))}
              rows={6}
              style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem", resize: "vertical" }} />
            <select value={notifForm.target_role}
              onChange={e => setNotifForm(prev => ({ ...prev, target_role: e.target.value }))}
              style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem", cursor: "pointer" }}>
              <option value="participant">Участникам</option>
              <option value="expert">Экспертам</option>
              <option value="admin">Администраторам</option>
              <option value="">Всем пользователям</option>
            </select>
            <button onClick={sendNotification} disabled={sendingNotif} style={{
              padding: "1rem 2rem", borderRadius: "100px", border: "none",
              background: "var(--accent)", color: "#fff", fontWeight: 700,
              fontFamily: "'Stolzl', sans-serif", fontSize: "1rem", cursor: "pointer",
              alignSelf: "flex-start",
            }}>
              {sendingNotif ? "Отправка..." : "Отправить"}
            </button>
            {notifResult && <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--accent)" }}>{notifResult}</p>}
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Stages */}
      {tab === "stages" && (
        <ScrollReveal delay={240}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={sectionTitle}>Этапы конкурса</h2>
            <button onClick={fetchStages} style={btnOutlineSm}>Обновить</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {stages.map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1.5rem 2rem", borderRadius: "32px", background: "var(--bg-card-alt)",
                flexWrap: "wrap", gap: "1rem",
              }}>
                <div>
                  <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "var(--text)" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontFamily: "'Onest', sans-serif" }}>
                    {s.deadline_at ? `Дедлайн: ${new Date(s.deadline_at).toLocaleString("ru-RU")}` : "Нет дедлайна"}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <span style={{ fontFamily: "'Stolzl', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>
                    {s.enabled ? "Вкл" : "Выкл"}
                  </span>
                  <input type="checkbox" checked={s.enabled}
                    onChange={e => toggleStage(s.key, e.target.checked)}
                    style={{ accentColor: "var(--accent)", width: "20px", height: "20px", cursor: "pointer" }} />
                </label>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Export */}
      {tab === "export" && (
        <ScrollReveal delay={240}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem" }}>
          <h2 style={sectionTitle}>Экспорт данных</h2>
          <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1rem", color: "var(--text-tertiary)", marginBottom: "2rem" }}>
            Скачайте данные в формате CSV.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "Пользователи", url: `${BASE}/admin/export/users` },
              { label: "Работы", url: `${BASE}/admin/export/submissions` },
              { label: "Оценки", url: `${BASE}/admin/export/scores` },
            ].map(item => (
              <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer"
                onClick={e => { e.preventDefault(); window.open(item.url + "?token=" + token, "_blank"); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.75rem",
                  padding: "1.25rem 2rem", borderRadius: "100px",
                  background: "var(--bg-card-alt)", color: "var(--text)",
                  fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
                  fontSize: "1rem", textDecoration: "none",
                  border: "1px solid var(--border)", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                📥 {item.label}
              </a>
            ))}
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Audit Log */}
      {tab === "audit" && (
        <ScrollReveal delay={320}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
          }}>
            <h2 style={sectionTitle}>Журнал действий</h2>
            <button onClick={fetchAuditLog} style={btnOutlineSm}>Обновить</button>
          </div>
          {auditLog.length === 0 ? (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
              Нет записей
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={thStyle}>Время</th>
                    <th style={thStyle}>Администратор</th>
                    <th style={thStyle}>Действие</th>
                    <th style={thStyle}>Объект</th>
                    <th style={thStyle}>Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry: any) => (
                    <tr key={entry.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(entry.created_at).toLocaleString("ru-RU")}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: "var(--text)", fontWeight: 500 }}>{entry.admin_name || entry.admin_email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block", padding: "0.25rem 0.75rem",
                          background: entry.action === "approved" ? "rgba(16, 185, 129, 0.15)" :
                            entry.action === "rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: entry.action === "approved" ? "#10B981" :
                            entry.action === "rejected" ? "#EF4444" : "#3B82F6",
                          borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600,
                          fontFamily: "'Stolzl', sans-serif", whiteSpace: "nowrap",
                        }}>
                          {entry.action === "approved" ? "Одобрение" :
                            entry.action === "rejected" ? "Отклонение" : entry.action}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.9375rem", color: "var(--text)" }}>
                          {entry.entity_type}{entry.entity_id ? ` #${entry.entity_id}` : ""}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "300px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {entry.details || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </ScrollReveal>
      )}

      {/* Tab: Reports */}
      {tab === "reports" && (
        <ScrollReveal delay={400}>
        <section style={{ background: "var(--bg-card)", borderRadius: "60px", padding: "3rem", marginBottom: "2rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
          }}>
            <h2 style={sectionTitle}>Отчёты по номинациям</h2>
            <button onClick={fetchReports} style={btnOutlineSm}>Обновить</button>
          </div>
          {reports.length === 0 ? (
            <p style={{ fontFamily: "'Onest', sans-serif", fontSize: "1.125rem", color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
              Нет данных
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {reports.map((r: any) => (
                <div key={r.id} style={{ padding: "2rem", borderRadius: "32px", background: "var(--bg-card-alt)" }}>
                  <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--accent)", marginBottom: "1.5rem" }}>
                    {r.name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <ReportCard label="Участников" value={r.participant_count} />
                    <ReportCard label="Работ" value={r.submission_count} />
                    <ReportCard label="Оценено" value={r.scored_count} />
                    <ReportCard label="Одобрено" value={r.approved_count} />
                  </div>
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "16px", background: "var(--bg-card)", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      Средний балл
                    </div>
                    <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "2rem", color: r.avg_score > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                      {r.avg_score > 0 ? r.avg_score : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>
      )}
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "16px", background: "var(--bg-card)", textAlign: "center" }}>
      <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--accent)" }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
        {label}
      </div>
    </div>
  );
}

function nominationChips(ids: number[], nominations: any[]) {
  return ids.map(id => {
    const nom = nominations.find(n => n.id === id);
    if (!nom) return null;
    return (
      <span key={id} style={{
        display: "inline-block", padding: "0.25rem 0.75rem",
        background: "rgba(var(--accent-rgb), 0.15)", color: "var(--accent)",
        borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600,
        fontFamily: "'Stolzl', sans-serif", whiteSpace: "nowrap",
      }}>
        {nom.name}
      </span>
    );
  });
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "1rem 1.25rem", fontWeight: 600,
  color: "var(--text-secondary)", fontFamily: "'Stolzl', sans-serif", fontSize: "0.9375rem",
};

const tdStyle: React.CSSProperties = {
  padding: "1rem 1.25rem", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
  fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "var(--text)",
  background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const btnSm: React.CSSProperties = {
  padding: "0.5rem 1.25rem", borderRadius: "100px", border: "none",
  background: "var(--accent)", color: "#fff", fontWeight: 600,
  cursor: "pointer", fontFamily: "'Stolzl', sans-serif", fontSize: "0.875rem",
};

const btnOutline: React.CSSProperties = {
  padding: "0.5rem 1rem", borderRadius: "100px",
  border: "1px solid var(--border)", background: "transparent",
  color: "var(--text)", cursor: "pointer", fontSize: "0.875rem",
};

const btnOutlineSm: React.CSSProperties = {
  padding: "0.375rem 1rem", borderRadius: "100px",
  border: "1px solid var(--border-light)", background: "transparent",
  color: "var(--text-tertiary)", cursor: "pointer",
  fontFamily: "'Stolzl', sans-serif", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap",
};