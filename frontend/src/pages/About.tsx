import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

export default function About() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-content">
          <h1 className="info-hero-title">О проекте</h1>
          <p className="info-hero-subtitle">
            Всероссийский медиаконкурс «Медиа РСО» — цифровая платформа для оценки медиа-навыков
            студенческих отрядов со всей страны.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <ScrollReveal>
            <div className="info-card">
              <h2 className="info-card-title">Что такое Медиа РСО?</h2>
              <p>
                «Медиа РСО» — это ежегодный всероссийский конкурс медиа-контента среди
                студенческих отрядов. Участники соревнуются в восьми номинациях: от лучшей
                фотографии до лучшего сообщества ВКонтакте.
              </p>
              <p>
                Конкурс проводится в три этапа: приём заявок, экспертная оценка и финал на
                Всероссийском слёте РСО в Челябинске. Победители получают ценные призы
                и признание на уровне всей страны.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="info-card">
              <h2 className="info-card-title">Миссия</h2>
              <p>
                Развитие медиа-навыков среди участников студенческих отрядов, создание
                единого информационного пространства и популяризация движения РСО через
                качественный контент.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="info-card">
              <h2 className="info-card-title">История</h2>
              <p>
                Конкурс впервые проведён в 2024 году и сразу привлёк более 100 участников
                из 30 регионов России. В 2026 году платформа полностью обновлена:
                добавлены новые номинации, автоматизирована система оценки и запущен
                личный кабинет участника.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
