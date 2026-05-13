import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import ScrollReveal from '../components/ScrollReveal';
import { FEDERAL_DISTRICTS, getRegionsByDistrict, DISTRICT_NAMES } from '../data/russian-regions';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [federalDistrict, setFederalDistrict] = useState("");
  const [region, setRegion] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nominations, setNominations] = useState<any[]>([]);
  const [selectedNoms, setSelectedNoms] = useState<number[]>([]);
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  useEffect(() => {
    fetch(`${BASE}/nominations`)
      .then(r => r.json())
      .then(data => { if (data.status === "ok") setNominations(data.nominations || []); })
      .catch(() => {});
  }, []);

  const toggleNom = (id: number) => {
    setSelectedNoms(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await register({ email, password, name, role: "participant", team_name: teamName || undefined, squad_name: region || undefined, federal_district: federalDistrict || undefined, position: position || undefined });
    setLoading(false);
    if (res.status === "ok") {
      if (selectedNoms.length > 0) {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const meRes = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
        const meData = await meRes.json();
        if (meData.status === "ok") {
          const userId = meData.user.id;
          await fetch(`${BASE}/admin/users/${userId}/nominations`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nomination_ids: selectedNoms }),
          });
        }
      }
      navigate("/login");
    } else {
      setError(res.error || "Ошибка регистрации");
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <ScrollReveal>
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
            Регистрация
          </h2>
          <p style={{
            fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
            color: "var(--text-tertiary)", marginBottom: "2.5rem",
          }}>
            Создайте аккаунт для участия
          </p>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Имя (команда/контакт)
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите имя"
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", transition: "border-color 0.2s",
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
                Email
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="example@mail.com"
                required
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", transition: "border-color 0.2s",
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
                Пароль
              </label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{
                  display: "block", fontSize: "0.875rem", fontWeight: 600,
                  color: "var(--text-tertiary)", textTransform: "uppercase",
                  letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
                }}>
                  Отряд
                </label>
                <input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="Название отряда"
                  style={{
                    width: "100%", padding: "1rem 1.25rem",
                    border: "1px solid var(--border)", borderRadius: "24px",
                    background: "var(--bg-input)", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none", transition: "border-color 0.2s",
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
                  Федеральный округ
                </label>
                <select
                  value={federalDistrict}
                  onChange={e => { setFederalDistrict(e.target.value); setRegion(""); }}
                  style={{
                    width: "100%", padding: "1rem 1.25rem",
                    border: "1px solid var(--border)", borderRadius: "24px",
                    background: "var(--bg-input)", color: "var(--text)",
                    fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                    outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="">Выберите округ</option>
                  {DISTRICT_NAMES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Регион
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                disabled={!federalDistrict}
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", cursor: federalDistrict ? "pointer" : "not-allowed",
                  opacity: federalDistrict ? 1 : 0.5,
                }}
              >
                <option value="">{federalDistrict ? "Выберите регион" : "Сначала выберите округ"}</option>
                {federalDistrict && getRegionsByDistrict(federalDistrict).map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.875rem", fontWeight: 600,
                color: "var(--text-tertiary)", textTransform: "uppercase",
                letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.5rem",
              }}>
                Должность
              </label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                style={{
                  width: "100%", padding: "1rem 1.25rem",
                  border: "1px solid var(--border)", borderRadius: "24px",
                  background: "var(--bg-input)", color: "var(--text)",
                  fontFamily: "'Onest', sans-serif", fontSize: "1.125rem",
                  outline: "none", cursor: "pointer",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              >
                <option value="">Не указана</option>
                <option value="фотограф">Фотограф</option>
                <option value="видеограф">Видеограф</option>
              </select>
            </div>

            {/* Nominations */}
            {nominations.length > 0 && (
              <div>
                <label style={{
                  display: "block", fontSize: "0.875rem", fontWeight: 600,
                  color: "var(--text-tertiary)", textTransform: "uppercase",
                  letterSpacing: "0.05em", fontFamily: "'Stolzl', sans-serif", marginBottom: "0.75rem",
                }}>
                  Номинации (выберите направления)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {nominations.map(nom => (
                    <label key={nom.id} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      cursor: "pointer", padding: "0.75rem 1rem",
                      borderRadius: "16px", background: selectedNoms.includes(nom.id) ? "rgba(var(--accent-rgb), 0.1)" : "var(--bg-card-alt)",
                      transition: "background 0.2s",
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedNoms.includes(nom.id)}
                        onChange={() => toggleNom(nom.id)}
                        style={{ accentColor: "var(--accent)", width: "20px", height: "20px" }}
                      />
                      <div>
                        <div style={{ fontFamily: "'Stolzl', sans-serif", fontWeight: 600, fontSize: "1rem", color: "var(--text)" }}>
                          {nom.name}
                        </div>
                        <div style={{ fontFamily: "'Onest', sans-serif", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {nom.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading} style={{
              padding: "1rem 2rem", borderRadius: "100px", border: "none",
              background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
              color: "#fff", fontFamily: "'Stolzl', sans-serif", fontWeight: 700,
              fontSize: "1.125rem", cursor: "pointer", transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Загрузка..." : "Зарегистрироваться"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ fontFamily: "'Onest', sans-serif", color: "var(--text-tertiary)", fontSize: "1rem" }}>
              Уже есть аккаунт?{" "}
              <a href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Войти</a>
            </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}