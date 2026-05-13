import { useState, useEffect, useRef } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import '../styles/landing.css';

interface LandingProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  theme?: string;
  onThemeToggle?: () => void;
}

function Timer({ target }: { target: Date }) {
  const [diff, setDiff] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const d = String(Math.max(0, Math.floor(diff / 86400000))).padStart(2, '0');
  const h = String(Math.max(0, Math.floor((diff % 86400000) / 3600000))).padStart(2, '0');
  const m = String(Math.max(0, Math.floor((diff % 3600000) / 60000))).padStart(2, '0');

  return (
    <div className="timer">
      <div className="timer-label">До финала осталось</div>
      <div className="timer-digits">{d}:{h}:{m}</div>
      <div className="timer-labels">
        <span>ДНЕЙ</span><span>ЧАСОВ</span><span>МИНУТ</span>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'faq-item-open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)} type="button">
        {question}
        <span className="faq-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
}

export default function Landing({ isLoggedIn, onLogout, theme, onThemeToggle }: LandingProps) {
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | null>(null);
  const [pdConsent, setPdConsent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const target = new Date('2026-11-15T00:00:00');

  // Cursor glow
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      hero.style.setProperty('--mouse-x', `${x}`);
      hero.style.setProperty('--mouse-y', `${y}`);
    };
    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Timeline draw on scroll
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimelineVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">

      {/* Cookie Bar */}
      {!cookieConsent && (
        <div className="cookie-bar">
          <p className="cookie-text">
            Этот сайт использует cookies для улучшения работы. Продолжая использовать сайт,
            вы соглашаетесь с этим.
          </p>
          <div className="cookie-actions">
            <button className="cookie-btn cookie-btn-accept" onClick={() => setCookieConsent('accepted')}>
              Принять
            </button>
            <button className="cookie-btn cookie-btn-decline" onClick={() => setCookieConsent('declined')}>
              Отклонить
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="landing-header">
        <div className="header-logos">
          <img src="/logos/rso-logo.svg" alt="РСО" className="header-logo" />
          <img src="/logos/media-rso-logo.svg" alt="Медиа РСО" className="header-logo media-logo" />
        </div>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} type="button">
          <span /><span /><span />
        </button>
        <button className="theme-btn landing-theme-btn" onClick={onThemeToggle} title={theme === "dark" ? "Светлая тема" : "Тёмная тема"} type="button">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <nav className={`landing-nav ${menuOpen ? 'nav-open' : ''}`}>
          <a href="/" className="nav-link">Главная</a>
          {isLoggedIn ? (
            <>
              <a href="/submissions" className="nav-link">Загрузить</a>
              <a href="/profile" className="nav-link">Профиль</a>
              <button onClick={onLogout} className="nav-btn" type="button">Выход</button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-link">Вход</a>
              <a href="/register" className="nav-btn nav-btn-highlight">Регистрация</a>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid-bg" />
        <div className="hero-dots" />
        <div className="hero-cursor-glow" />
        <div className="hero-geo hero-geo-1" />
        <div className="hero-geo hero-geo-2" />
        <div className="hero-geo hero-geo-3" />
        <div className="hero-geo hero-geo-4" />
        <div className="hero-geo hero-geo-5" />
        <div className="hero-scanline" />
        <div className="hero-content">
          <div className="hero-meta">
            <span className="hero-date">15–17 Ноября 2026</span>
            <span className="hero-location">Финал на Всероссийском слёте РСО в Челябинске</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">МЕДИАКОНКУРС</span>
            <span className="hero-title-line">
              <span className="hero-title-accent" data-text="МЕДИА РСО">МЕДИА РСО</span>
            </span>
          </h1>
          <p className="hero-subtitle">
            Единая цифровая платформа для проведения Всероссийского медиаконкурса
            среди студенческих отрядов — от подачи заявки до итогового рейтинга.
          </p>
          <a href="/register" className="hero-btn">
            Подать заявку на конкурс
            <svg viewBox="0 0 17 17" fill="none" className="btn-arrow">
              <path d="M1 8.5h15M8.5 1l7 7.5-7 7.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </a>
        </div>
      </section>

      {/* Partners Bar */}
      <div className="partners-bar">
        {['ТРУД КРУТ', 'РСО', 'МЕДИА РСО', 'ЦШ РСО', 'РОСМОЛ'].map((l, i) => (
          <span key={i} className="partner-label">{l}</span>
        ))}
      </div>

      {/* Target Audience */}
      <section className="section target-section">
        <ScrollReveal><h2 className="section-title">ДЛЯ КОГО ЭТОТ КОНКУРС?</h2></ScrollReveal>
        <div className="target-grid">
          {[
            { title: 'Студенческие отряды', desc: 'Команды, которые хотят показать свои медиа-навыки на всероссийском уровне' },
            { title: 'Пресс-службы', desc: 'Штабы и пресс-службы, ведущие информационную работу в отрядах' },
            { title: 'Блогеры', desc: 'Авторы личных блогов о стройотрядах и студенческой жизни' },
            { title: 'Медиацентры', desc: 'Медиацентры вузов и региональных отделений РСО' },
          ].map((item, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="target-card">
                <div className="target-number">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="target-card-title">{item.title}</h3>
                <p className="target-card-desc">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="section stats-section">
        <div className="stats-grid">
          {[
            { num: '80+', label: 'Студенческих отрядов' },
            { num: '200+', label: 'Участников' },
            { num: '8', label: 'Номинаций' },
            { num: '3', label: 'Этапа конкурса' },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100} direction="scale">
              <div className="stat-card">
                <div className="stat-number">{stat.num}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="section about-section">
        <ScrollReveal><h2 className="section-title">О КОНКУРСЕ</h2></ScrollReveal>
        <ScrollReveal delay={100} direction="left">
          <div className="about-content">
            <p className="about-text">
              Всероссийский медиаконкурс «Медиа РСО» — это уникальная площадка для
              студенческих отрядов, позволяющая проявить себя в различных медиа-направлениях.
            </p>
            <p className="about-text">
              Конкурс проводится в три этапа: регистрация и приём работ, оценка экспертным
              жюри и финал на Всероссийском слёте РСО в Челябинске.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Nominations */}
      <section className="section nominations-section">
        <div className="section-header">
          <ScrollReveal><h2 className="section-title">КЛЮЧЕВЫЕ НОМИНАЦИИ</h2></ScrollReveal>
          <ScrollReveal delay={100}><Timer target={target} /></ScrollReveal>
        </div>
        <div className="nominations-grid">
          {[
            { name: 'В объективе РСО', desc: 'Лучшие фотографии с мероприятий' },
            { name: 'Сообщество ВК', desc: 'Лучший паблик отряда или штаба' },
            { name: 'Медиакоманда', desc: 'Лучшая пресс-служба отряда' },
            { name: 'Блогер РСО', desc: 'Лучший личный блог про стройотряды' },
          ].map((nom, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="nom-card">
                <h3 className="nom-name">{nom.name}</h3>
                <p className="nom-desc">{nom.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="section timeline-section">
        <ScrollReveal><h2 className="section-title">ЭТАПЫ ПРОВЕДЕНИЯ</h2></ScrollReveal>
        <div className="timeline">
          {[
            { day: 'Этап 1', time: 'Сентябрь', desc: 'Открытие регистрации и приёма работ. Консультационная поддержка участников и модерация заявок.' },
            { day: 'Этап 2', time: 'Октябрь', desc: 'Оценка работ экспертами. Автоматический расчёт баллов и формирование рейтинга победителей.' },
            { day: 'Этап 3', time: 'Ноябрь', desc: 'Финал на Всероссийском слёте РСО в Челябинске. Награждение победителей.' },
          ].map((step, i) => (
            <ScrollReveal key={i} delay={i * 150} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-dot" />
                  {i < 2 && <div className="timeline-line" />}
                </div>
                <div className="timeline-card">
                  <div className="timeline-day">{step.day}</div>
                  <div className="timeline-time">{step.time}</div>
                  <p className="timeline-desc">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="section team-section">
        <ScrollReveal><h2 className="section-title">КОМАНДА ПРОЕКТА</h2></ScrollReveal>
        <div className="team-grid">
          {[
            { name: 'Анна С.', role: 'Руководитель проекта' },
            { name: 'Дмитрий К.', role: 'Технический директор' },
            { name: 'Елена М.', role: 'PR-менеджер' },
            { name: 'Павел И.', role: 'Дизайнер' },
          ].map((member, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="team-card">
                <div
                  className="team-avatar anim-float"
                  style={{ animationDelay: `${i * 0.5}s`, background: `linear-gradient(135deg, #0804FF, hsl(${i * 80 + 200}, 70%, 45%))` }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="team-name">{member.name}</div>
                <div className="team-role">{member.role}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <ScrollReveal><h2 className="section-title">ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ</h2></ScrollReveal>
        <div className="faq-list">
          {[
            { q: 'Кто может участвовать в конкурсе?', a: 'Студенческие отряды, пресс-службы штабов, блогеры и медиацентры, связанные с РСО.' },
            { q: 'Как подать заявку?', a: 'Зарегистрируйтесь на платформе, заполните профиль и отправьте работу в соответствующей номинации.' },
            { q: 'Как оцениваются работы?', a: 'Экспертное жюри оценивает работы по утверждённым критериям. Баллы подсчитываются автоматически.' },
            { q: 'Когда будут результаты?', a: 'Результаты будут объявлены на финале в ноябре 2026 года на Всероссийском слёте РСО.' },
          ].map((faq, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <FaqItem question={faq.q} answer={faq.a} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <img src="/logos/rso-logo.svg" alt="РСО" className="footer-logo" />
            <img src="/logos/media-rso-logo.svg" alt="Медиа РСО" className="footer-logo" />
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4 className="footer-col-title">Навигация</h4>
              <a href="/">Главная</a>
              <a href="/gallery">Галерея</a>
              <a href="/register">Регистрация</a>
              <a href="/login">Вход</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Правовое</h4>
              <label className="pd-consent">
                <input
                  type="checkbox"
                  checked={pdConsent}
                  onChange={e => setPdConsent(e.target.checked)}
                />
                <span>Согласие на обработку ПД</span>
              </label>
              <span className="cookie-notice">
                Cookies: {cookieConsent === 'accepted' ? '✓ Принято' : cookieConsent === 'declined' ? '✕ Отклонено' : 'не настроено'}
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Медиа РСО. Все права защищены.
        </div>
      </footer>

    </div>
  );
}
