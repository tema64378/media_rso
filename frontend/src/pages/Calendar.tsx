import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

const STEPS = [
  { period: "1–30 сентября", title: "Приём заявок", desc: "Открытие регистрации на платформе. Участники заполняют профили, выбирают номинации и загружают конкурсные работы. Работа технической поддержки и модерация заявок." },
  { period: "1–20 октября", title: "Экспертная оценка", desc: "Работы оцениваются экспертным жюри по утверждённым критериям. Каждая работа проверяется минимум двумя экспертами. Баллы подсчитываются автоматически." },
  { period: "21–31 октября", title: "Формирование рейтинга", desc: "Автоматический подсчёт итоговых баллов. Формирование рейтинга победителей в каждой номинации. Публикация предварительных результатов." },
  { period: "15–17 ноября", title: "Финал", desc: "Финал конкурса на Всероссийском слёте РСО в Челябинске. Награждение победителей, церемония закрытия." },
];

export default function Calendar() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-content">
          <h1 className="info-hero-title">Календарь конкурса</h1>
          <p className="info-hero-subtitle">
            Основные даты и этапы Всероссийского медиаконкурса «Медиа РСО» в 2026 году.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          {STEPS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 120} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="info-card">
                <div className="info-card-title">
                  <span className="info-card-icon">
                    {['📝', '⭐', '🏆', '🎉'][i]}
                  </span>
                  {step.title}
                </div>
                <p style={{ fontFamily: "'Stolzl', sans-serif", fontWeight: 600, color: "var(--accent)", marginBottom: "0.75rem" }}>
                  {step.period}
                </p>
                <p>{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
