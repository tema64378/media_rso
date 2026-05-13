import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

const CONTACTS = [
  { icon: "📧", label: "Электронная почта", value: "media@rso.ru", href: "mailto:media@rso.ru" },
  { icon: "📱", label: "ВКонтакте", value: "vk.com/rso_media", href: "https://vk.com/rso_media" },
  { icon: "✈️", label: "Telegram-канал", value: "t.me/media_rso", href: "https://t.me/media_rso" },
  { icon: "🌐", label: "Сайт РСО", value: "rso.ru", href: "https://rso.ru" },
];

const SUPPORT = [
  { icon: "❓", label: "Техподдержка платформы", value: "support@media.rso.ru", href: "mailto:support@media.rso.ru" },
  { icon: "📋", label: "Организационные вопросы", value: "org@media.rso.ru", href: "mailto:org@media.rso.ru" },
];

export default function Contacts() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-orb info-hero-orb-1" />
        <div className="info-hero-orb info-hero-orb-2" />
        <div className="info-hero-orb info-hero-orb-3" />
        <div className="info-hero-grid" />
        <div className="info-hero-geo info-hero-geo-1" />
        <div className="info-hero-geo info-hero-geo-2" />
        <div className="info-hero-geo info-hero-geo-3" />
        <div className="info-hero-content">
          <h1 className="info-hero-title">Контакты</h1>
          <p className="info-hero-subtitle">
            Свяжитесь с нами по любым вопросам, связанным с конкурсом.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <ScrollReveal>
            <h2 className="info-section-title">Мы в соцсетях</h2>
          </ScrollReveal>
          <div className="info-grid" style={{ marginBottom: "3rem" }}>
            {CONTACTS.map((c, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="info-contact-item" style={{ textDecoration: "none" }}>
                  <div className="info-contact-icon">{c.icon}</div>
                  <div className="info-contact-text">
                    <div className="info-contact-label">{c.label}</div>
                    <span className="info-contact-link">{c.value}</span>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={100}>
            <h2 className="info-section-title">Поддержка</h2>
          </ScrollReveal>
          <div className="info-grid">
            {SUPPORT.map((c, i) => (
              <ScrollReveal key={i} delay={150 + i * 80}>
                <a href={c.href} className="info-contact-item" style={{ textDecoration: "none" }}>
                  <div className="info-contact-icon">{c.icon}</div>
                  <div className="info-contact-text">
                    <div className="info-contact-label">{c.label}</div>
                    <span className="info-contact-link">{c.value}</span>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
