import React, { useEffect, useState } from "react";
import { Skeleton } from '../components';
import { me, updateProfile, getPdConsent, getMyTeam, createMediaTeam, leaveMediaTeam } from "../api";
import ScrollReveal from '../components/ScrollReveal';

const roleLabels: Record<string, string> = {
  participant: "Участник", expert: "Эксперт", admin: "Администратор", hq: "Штаб РСО",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section style={{
      background: "var(--bg-card)", borderRadius: "60px", padding: "3rem",
      marginBottom: "2rem",
    }}>
      <h2 style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--text)",
        marginBottom: "2.5rem",
        background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem", borderRadius: "24px",
      background: "var(--bg-card-alt)",
      transition: "transform 0.2s",
    }}>
      <div style={{
        fontSize: "0.8125rem", color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "1.25rem", fontWeight: 500, color: "var(--text)",
        fontFamily: "'Onest', sans-serif",
      }}>
        {value || <span style={{ color: "var(--text-subtle)" }}>—</span>}
      </div>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [consentText, setConsentText] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [nominations, setNominations] = useState<any[]>([]);
  const [myNominations, setMyNominations] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  const fetchUser = async () => {
    if (!token) { setError("Не авторизован"); setLoading(false); return; }
    try {
      const res = await me(token);
      if (res.status === "ok") { setUser(res.user); setForm(res.user); }
      else setError(res.error || "Ошибка");
    } catch (e) { setError(String(e)); }
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!token) return;
    getMyTeam(token).then(data => {
      if (data.status === "ok") setTeam(data.team);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/nominations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.status === "ok") setNominations(data.nominations || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== "participant") return;
    fetch(`${BASE}/admin/users/${user.id}/nominations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          const ids: number[] = data.nomination_ids || [];
          fetch(`${BASE}/nominations`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
              if (d.status === "ok") {
                const all = d.nominations || [];
                setMyNominations(all.filter((n: any) => ids.includes(n.id)));
              }
            });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleChange = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const res = await updateProfile(token, form);
      if (res.status === "ok") {
        setUser(res.user);
        setEditing(false);
        setSuccess("Профиль обновлён");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.error || "Ошибка сохранения");
      }
    } catch (e) { setError(String(e)); }
    setSaving(false);
  };

  const handlePdConsent = async () => {
    if (!token) return;
    try {
      const res = await getPdConsent(token);
      if (res.status === "ok") { setConsentText(res.consent_text); setShowConsent(true); }
      else setError(res.error || "Ошибка");
    } catch (e) { setError(String(e)); }
  };

  const handlePasswordChange = async () => {
    if (!token) return;
    setPasswordSaving(true); setPasswordError(null); setPasswordSuccess(null);
    try {
      const res = await fetch(`${BASE}/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setPasswordSuccess("Пароль изменён");
        setOldPassword(""); setNewPassword(""); setShowPasswordForm(false);
      } else {
        setPasswordError(data.error || "Ошибка");
      }
    } catch (e) { setPasswordError(String(e)); }
    setPasswordSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);
    try {
      const res = await fetch(`${BASE}/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.status === "ok") {
        setUser((u: any) => ({ ...u, avatar_url: data.avatar_url }));
        setSuccess("Аватар обновлён");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch (e) { setError(String(e)); }
    setAvatarUploading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  if (loading) return <Skeleton />;
  if (error && !user) return <div className="error" style={{ maxWidth: "600px", margin: "2rem auto" }}>{error}</div>;
  if (!user) return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Пользователь не найден</div>;

  const personalFields = [
    { key: "name", label: "ФИО" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Телефон" },
    { key: "birth_date", label: "Дата рождения" },
    { key: "birth_place", label: "Место рождения" },
  ];

  const passportFields = [
    { key: "passport_series", label: "Серия" },
    { key: "passport_number", label: "Номер" },
    { key: "passport_issued_by", label: "Кем выдан" },
    { key: "passport_issue_date", label: "Дата выдачи" },
    { key: "passport_code", label: "Код подразделения" },
    { key: "registration_address", label: "Адрес регистрации" },
  ];

  const extraFields = [
    { key: "inn", label: "ИНН" },
    { key: "snils", label: "СНИЛС" },
    { key: "team_name", label: "Отряд" },
    { key: "squad_name", label: "Штаб" },
  ];

  const positionOptions = [
    { value: "", label: "Не указана" },
    { value: "фотограф", label: "Фотограф" },
    { value: "видеограф", label: "Видеограф" },
  ];

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{ maxWidth: "1920px", margin: "0 auto", padding: "0 2rem" }}>
      {success && <div className="success" style={{ marginBottom: "1rem" }}>{success}</div>}
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Profile Header */}
      <ScrollReveal>
      <section style={{
        background: "var(--bg-card)", borderRadius: "60px", padding: "3rem",
        marginBottom: "2rem", display: "flex", gap: "3rem",
        alignItems: "center", flexWrap: "wrap",
      }}>
        <label style={{
          width: "140px", height: "140px", borderRadius: "50%",
          background: user.avatar_url
            ? `url(${BASE}/uploads/${user.avatar_url}) center/cover`
            : "linear-gradient(135deg, var(--accent), #4a6cf7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
          fontSize: "3rem", color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 20px rgba(var(--accent-rgb), 0.2)",
          cursor: "pointer", position: "relative", overflow: "hidden",
        }}>
          {!user.avatar_url && initials}
          {avatarUploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontFamily: "'Onest', sans-serif" }}>...</div>}
          <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
        </label>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(2rem, 4vw, 3.5rem)", color: "var(--text)",
            marginBottom: "0.5rem",
          }}>
            {user.name || "Без имени"}
          </h1>
          <div style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            color: "var(--text-tertiary)", marginBottom: "1rem",
          }}>
            {user.email}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-block", padding: "0.5rem 1.5rem",
              background: "var(--accent)", color: "white",
              borderRadius: "100px", fontSize: "0.9375rem", fontWeight: 600,
              fontFamily: "'Stolzl', sans-serif",
            }}>
              {roleLabels[user.role] || user.role}
            </span>
            {user.team_name && (
              <span style={{
                display: "inline-block", padding: "0.5rem 1.5rem",
                background: "var(--bg-card-alt)", color: "var(--text-tertiary)",
                borderRadius: "100px", fontSize: "0.9375rem", fontWeight: 600,
                fontFamily: "'Stolzl', sans-serif",
              }}>
                {user.team_name}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "0.875rem 2rem", borderRadius: "100px", border: "none",
                background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", transition: "all 0.2s",
              }}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button onClick={() => { setEditing(false); setForm(user); setError(null); }} style={{
                padding: "0.875rem 2rem", borderRadius: "100px",
                border: "1px solid var(--border-light)", background: "transparent",
                color: "var(--text)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
                fontSize: "1rem", cursor: "pointer",
              }}>
                Отмена
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(true); setError(null); }} style={{
                padding: "0.875rem 2rem", borderRadius: "100px", border: "none",
                background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", transition: "all 0.2s",
              }}>
                Редактировать
              </button>
              <button onClick={handleLogout} style={{
                padding: "0.875rem 2rem", borderRadius: "100px",
                border: "1px solid var(--border-light)", background: "transparent",
                color: "var(--text)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
                fontSize: "1rem", cursor: "pointer",
              }}>
                Выход
              </button>
            </>
          )}
        </div>
      </section>
      </ScrollReveal>

      {/* Personal Data */}
      <ScrollReveal>
      <Section title="Личные данные">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {personalFields.map(f => (
            editing && f.key !== "email" ? (
              <div key={f.key} style={{
                padding: "1.25rem 1.5rem", borderRadius: "24px",
                background: "var(--bg-card-alt)",
              }}>
                <div style={{
                  fontSize: "0.8125rem", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
                }}>
                  {f.label}
                </div>
                <input value={form[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 0",
                    border: "none", borderBottom: "1px solid var(--border)",
                    background: "transparent", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none",
                  }}
                  placeholder={f.label}
                />
              </div>
            ) : (
              <Field key={f.key} label={f.label} value={user[f.key]} />
            )
          ))}
        </div>
      </Section>
      </ScrollReveal>

      {/* Passport Data */}
      <ScrollReveal delay={80}>
      <Section title="Паспортные данные">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {passportFields.map(f => (
            editing ? (
              <div key={f.key} style={{
                padding: "1.25rem 1.5rem", borderRadius: "24px",
                background: "var(--bg-card-alt)",
              }}>
                <div style={{
                  fontSize: "0.8125rem", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
                }}>
                  {f.label}
                </div>
                <input value={form[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 0",
                    border: "none", borderBottom: "1px solid var(--border)",
                    background: "transparent", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none",
                  }}
                  placeholder={f.label}
                />
              </div>
            ) : (
              <Field key={f.key} label={f.label} value={user[f.key]} />
            )
          ))}
        </div>
      </Section>
      </ScrollReveal>

      {/* Extra Fields */}
      <ScrollReveal delay={160}>
      <Section title="Дополнительная информация">
        {/* Position field */}
        <div style={{ marginBottom: "1.5rem" }}>
          {editing ? (
            <div style={{
              padding: "1.25rem 1.5rem", borderRadius: "24px",
              background: "var(--bg-card-alt)",
            }}>
              <div style={{
                fontSize: "0.8125rem", color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: "'Stolzl', sans-serif", marginBottom: "0.75rem",
              }}>
                Должность
              </div>
              <select value={form.position || ""} onChange={e => handleChange("position", e.target.value)}
                style={{
                  width: "100%", padding: "0.75rem 0",
                  border: "none", borderBottom: "1px solid var(--border)",
                  background: "transparent", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", cursor: "pointer",
                }}
              >
                {positionOptions.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: "var(--bg-card)" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Field label="Должность" value={user.position ? (user.position === "фотограф" ? "Фотограф" : user.position === "видеограф" ? "Видеограф" : user.position) : null} />
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {extraFields.map(f => (
            editing ? (
              <div key={f.key} style={{
                padding: "1.25rem 1.5rem", borderRadius: "24px",
                background: "var(--bg-card-alt)",
              }}>
                <div style={{
                  fontSize: "0.8125rem", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
                }}>
                  {f.label}
                </div>
                <input value={form[f.key] || ""} onChange={e => handleChange(f.key, e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 0",
                    border: "none", borderBottom: "1px solid var(--border)",
                    background: "transparent", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none",
                  }}
                  placeholder={f.label}
                />
              </div>
            ) : (
              <Field key={f.key} label={f.label} value={user[f.key]} />
            )
          ))}
        </div>
      </Section>
      </ScrollReveal>

      {/* My Nominations */}
      {user.role === "participant" && myNominations.length > 0 && (
        <ScrollReveal delay={240}>
        <Section title="Мои номинации">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {myNominations.map(n => (
              <span key={n.id} style={{
                padding: "0.75rem 1.5rem", borderRadius: "100px",
                background: "rgba(var(--accent-rgb), 0.15)", color: "var(--accent)",
                fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "1rem",
              }}>
                {n.name}
              </span>
            ))}
          </div>
        </Section>
        </ScrollReveal>
      )}

      {/* Media Team */}
      <ScrollReveal delay={320}>
      <Section title="Медиакоманда">
        {team ? (
          <div>
            <div style={{
              padding: "1.5rem", borderRadius: "24px",
              background: "rgba(var(--accent-rgb), 0.1)", marginBottom: "1.5rem",
            }}>
              <div style={{
                fontFamily: "'Onest', sans-serif", fontSize: "1rem",
                color: "var(--text-tertiary)", marginBottom: "0.5rem",
              }}>
                Вы в составе команды:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: team.partner.avatar
                    ? `url(${team.partner.avatar}) center/cover`
                    : "linear-gradient(135deg, var(--accent), #4a6cf7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
                  fontSize: "1.25rem", color: "#fff", flexShrink: 0,
                }}>
                  {!team.partner.avatar && team.partner.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "'Actay Wide', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--text)" }}>
                    {team.partner.name || "Без имени"}
                  </div>
                  <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.9375rem", color: "var(--text-tertiary)" }}>
                    {team.partner.email}
                    {team.partner.position && <span style={{ marginLeft: "0.5rem", color: "var(--accent)" }}>— {team.partner.position}</span>}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={async () => {
              if (!token) return;
              setTeamLoading(true); setTeamError(null);
              try {
                const res = await leaveMediaTeam(token);
                if (res.status === "ok") { setTeam(null); setTeamSuccess("Вы покинули команду"); setTimeout(() => setTeamSuccess(null), 3000); }
                else setTeamError(res.error);
              } catch (e) { setTeamError(String(e)); }
              setTeamLoading(false);
            }} disabled={teamLoading} style={{
              padding: "0.875rem 2rem", borderRadius: "100px", border: "1px solid var(--border-light)",
              background: "transparent", color: "#EF4444",
              fontFamily: "'Stolzl', sans-serif", fontWeight: 600,
              fontSize: "1rem", cursor: "pointer",
            }}>
              {teamLoading ? "..." : "Покинуть команду"}
            </button>
            {teamError && <div className="error" style={{ marginTop: "1rem" }}>{teamError}</div>}
            {teamSuccess && <div className="success" style={{ marginTop: "1rem" }}>{teamSuccess}</div>}
          </div>
        ) : (
          <div>
            <p style={{
              fontFamily: "'Onest', sans-serif", fontSize: "1rem",
              color: "var(--text-tertiary)", marginBottom: "1.5rem",
              lineHeight: "1.7",
            }}>
              Для участия в номинации «Медиакоманда» необходимо объединиться в команду из двух человек — фотографа и видеографа. Введите email вашего напарника:
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <input value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)}
                placeholder="email@example.com"
                style={{
                  flex: 1, minWidth: "250px", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              <button onClick={async () => {
                if (!token || !partnerEmail) return;
                setTeamLoading(true); setTeamError(null); setTeamSuccess(null);
                try {
                  const res = await createMediaTeam(token, partnerEmail);
                  if (res.status === "ok") {
                    const teamData = await getMyTeam(token);
                    if (teamData.status === "ok") setTeam(teamData.team);
                    setPartnerEmail("");
                    setTeamSuccess("Команда создана!");
                    setTimeout(() => setTeamSuccess(null), 3000);
                  } else setTeamError(res.error);
                } catch (e) { setTeamError(String(e)); }
                setTeamLoading(false);
              }} disabled={teamLoading || !partnerEmail} style={{
                padding: "1rem 2.5rem", borderRadius: "100px", border: "none",
                background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", transition: "all 0.2s",
                opacity: (teamLoading || !partnerEmail) ? 0.7 : 1,
              }}>
                {teamLoading ? "..." : "Создать команду"}
              </button>
            </div>
            {teamError && <div className="error" style={{ marginTop: "1rem" }}>{teamError}</div>}
            {teamSuccess && <div className="success" style={{ marginTop: "1rem" }}>{teamSuccess}</div>}
          </div>
        )}
      </Section>
      </ScrollReveal>

      {/* PD Consent */}
      <section style={{
        background: "var(--bg-card)", borderRadius: "60px", padding: "3rem",
        marginBottom: "2rem",
      }}>
        <h2 style={{
          fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--text)",
          marginBottom: "1rem",
          background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Согласие на обработку ПД
        </h2>
        <p style={{
          fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
          color: "var(--text-tertiary)", marginBottom: "1.5rem",
          lineHeight: "1.7", maxWidth: "700px",
        }}>
          Для участия в конкурсе необходимо согласие на обработку персональных данных.
          Заполните все поля профиля, затем сгенерируйте и распечатайте текст согласия.
        </p>
        <button onClick={showConsent ? () => setShowConsent(false) : handlePdConsent} style={{
          padding: "1rem 2.5rem", borderRadius: "100px", border: "none",
          background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
          color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
          fontSize: "1.0625rem", cursor: "pointer", transition: "all 0.2s",
        }}>
          {showConsent ? "Скрыть" : "Сгенерировать текст согласия"}
        </button>
        {consentText && showConsent && (
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{
              background: "var(--bg-card-alt)", padding: "2rem", borderRadius: "24px",
              fontFamily: "'Onest', monospace", fontSize: "0.9375rem", lineHeight: "1.8",
              color: "var(--text-tertiary)", whiteSpace: "pre-wrap",
              maxHeight: "500px", overflowY: "auto",
              border: "1px solid var(--border-subtle)",
            }}>
              {consentText}
            </div>
          </div>
        )}
      </section>

      {/* Password Change */}
      <Section title="Безопасность">
        {showPasswordForm ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", maxWidth: "400px" }}>
              <input value={oldPassword} onChange={e => setOldPassword(e.target.value)} type="password" placeholder="Текущий пароль"
                style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="Новый пароль" minLength={6}
                style={{ width: "100%", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "24px", background: "var(--bg-input)", color: "var(--text)", fontFamily: "'Onest', sans-serif", fontSize: "1rem", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handlePasswordChange} disabled={passwordSaving || !oldPassword || !newPassword} style={{
                padding: "0.875rem 2rem", borderRadius: "100px", border: "none",
                background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
                color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                opacity: (passwordSaving || !oldPassword || !newPassword) ? 0.7 : 1,
              }}>
                {passwordSaving ? "..." : "Сохранить"}
              </button>
              <button onClick={() => { setShowPasswordForm(false); setOldPassword(""); setNewPassword(""); setPasswordError(null); }} style={{
                padding: "0.875rem 2rem", borderRadius: "100px", border: "1px solid var(--border-light)",
                background: "transparent", color: "var(--text)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "1rem", cursor: "pointer",
              }}>
                Отмена
              </button>
            </div>
            {passwordError && <div className="error" style={{ marginTop: "1rem" }}>{passwordError}</div>}
            {passwordSuccess && <div className="success" style={{ marginTop: "1rem" }}>{passwordSuccess}</div>}
          </div>
        ) : (
          <button onClick={() => setShowPasswordForm(true)} style={{
            padding: "0.875rem 2rem", borderRadius: "100px", border: "1px solid var(--border-light)",
            background: "transparent", color: "var(--text)", fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "1rem", cursor: "pointer",
          }}>
            Сменить пароль
          </button>
        )}
      </Section>

      {/* Admin Quick Actions */}
      {(user.role === "admin" || user.role === "hq") && (
        <section style={{
          background: "var(--bg-card)", borderRadius: "60px", padding: "3rem",
          marginBottom: "2rem",
        }}>
          <h2 style={{
            fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--text)",
            marginBottom: "1rem",
            background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Панель управления
          </h2>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            color: "var(--text-tertiary)", marginBottom: "2rem",
          }}>
            Быстрые действия для администратора
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="/admin" style={{
              padding: "1rem 2.5rem", borderRadius: "100px",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", textDecoration: "none",
              fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1.0625rem",
            }}>
              Управление пользователями
            </a>
          </div>
        </section>
      )}
    </div>
  );
}