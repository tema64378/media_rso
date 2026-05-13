export default function NotFound() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem",
    }}>
      <div style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(6rem, 15vw, 12rem)", lineHeight: 1,
        background: "linear-gradient(90deg, var(--accent), #4a6cf7)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", marginBottom: "1rem",
      }}>
        404
      </div>
      <h2 style={{
        fontFamily: "'Actay Wide', sans-serif", fontWeight: 700,
        fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "var(--text)",
        marginBottom: "1rem",
      }}>
        Страница не найдена
      </h2>
      <p style={{
        fontFamily: "'Onest', sans-serif", fontSize: "1.25rem",
        color: "var(--text-tertiary)", marginBottom: "2.5rem", maxWidth: "500px",
      }}>
        Запрашиваемая страница не существует или была перемещена
      </p>
      <a href="/" style={{
        padding: "1rem 2.5rem", borderRadius: "100px",
        background: "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.6))",
        color: "#fff", textDecoration: "none",
        fontFamily: "'Stolzl', sans-serif", fontWeight: 700, fontSize: "1.125rem",
        transition: "transform 0.2s",
      }}>
        ← На главную
      </a>
    </div>
  );
}