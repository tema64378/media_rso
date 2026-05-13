import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

export default function Rules() {
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
          <h1 className="info-hero-title">Правила и положение</h1>
          <p className="info-hero-subtitle">
            Ознакомьтесь с правилами участия во Всероссийском медиаконкурсе «Медиа РСО».
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <ScrollReveal>
            <div className="info-card">
              <h2 className="info-card-title">Общие положения</h2>
              <p>
                Конкурс проводится среди студенческих отрядов, пресс-служб штабов,
                блогеров и медиацентров, связанных с движением РСО.
              </p>
              <p>
                Участие бесплатное. Каждый участник может подать заявку в одну или
                несколько номинаций. Регистрация осуществляется через официальную
                платформу «Медиа РСО».
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="info-card">
              <h2 className="info-card-title">Требования к работам</h2>
              <ul className="info-list">
                <li>Работы должны соответствовать тематике выбранной номинации</li>
                <li>Контент не должен нарушать законодательство РФ</li>
                <li>Фотографии принимаются в формате JPEG/PNG, не более 20 МБ</li>
                <li>Видео принимаются в формате MP4, не более 200 МБ</li>
                <li>Работы должны быть созданы в период проведения конкурса</li>
                <li>Допускается использование только собственного контента</li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="info-card">
              <h2 className="info-card-title">Критерии оценки</h2>
              <ul className="info-list">
                <li>Качество исполнения и технический уровень работы</li>
                <li>Оригинальность и творческий подход</li>
                <li>Соответствие теме и целям конкурса</li>
                <li>Вовлечённость аудитории (для номинаций с открытым голосованием)</li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="info-card">
              <h2 className="info-card-title">Жюри</h2>
              <p>
                Оценка работ проводится экспертным жюри, в состав которого входят
                профессиональные фотографы, видеографы, PR-специалисты и представители
                Центрального штаба РСО. Каждая работа оценивается минимум двумя
                экспертами. Итоговый балл формируется автоматически.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
