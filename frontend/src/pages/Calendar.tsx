import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

const STEPS = [
  { period: "1–30 сентября", title: "Приём заявок", icon: "📝", desc: "Открытие регистрации на платформе. Участники заполняют профили, выбирают номинации и загружают конкурсные работы." },
  { period: "1–20 октября", title: "Экспертная оценка", icon: "⭐", desc: "Работы оцениваются экспертным жюри по утверждённым критериям. Каждая работа проверяется минимум двумя экспертами." },
  { period: "21–31 октября", title: "Формирование рейтинга", icon: "🏆", desc: "Автоматический подсчёт итоговых баллов. Формирование рейтинга победителей в каждой номинации." },
  { period: "15–17 ноября", title: "Финал", icon: "🎉", desc: "Финал конкурса на Всероссийском слёте РСО в Челябинске. Награждение победителей, церемония закрытия." },
];

export default function Calendar() {
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
          <h1 className="info-hero-title">Календарь конкурса</h1>
          <p className="info-hero-subtitle">
            Основные даты и этапы Всероссийского медиаконкурса «Медиа РСО» в 2026 году.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="calendar-timeline">
          <div className="calendar-line" />
          {STEPS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 150} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="calendar-item">
                <div className="calendar-dot">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="calendar-card">
                  <div className="calendar-card-icon">{step.icon}</div>
                  <div className="calendar-card-title">{step.title}</div>
                  <div className="calendar-card-period">{step.period}</div>
                  <p className="calendar-card-desc">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
