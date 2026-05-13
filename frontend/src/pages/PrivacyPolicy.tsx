import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

export default function PrivacyPolicy() {
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
          <h1 className="info-hero-title">Политика конфиденциальности</h1>
          <p className="info-hero-subtitle">
            Как мы собираем, используем и защищаем ваши персональные данные.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <ScrollReveal>
            <div className="info-card">
              <h2 className="info-card-title">Какие данные мы собираем</h2>
              <ul className="info-list">
                <li>Имя и контактные данные (email), указанные при регистрации</li>
                <li>Название отряда и регионального отделения</li>
                <li>Конкурсные работы и сопутствующие материалы</li>
                <li>Технические данные: IP-адрес, тип браузера, cookies</li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="info-card">
              <h2 className="info-card-title">Как мы используем данные</h2>
              <ul className="info-list">
                <li>Для регистрации и идентификации участников конкурса</li>
                <li>Для проведения конкурса и оценки работ</li>
                <li>Для связи с участниками по вопросам конкурса</li>
                <li>Для улучшения работы платформы</li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="info-card">
              <h2 className="info-card-title">Защита данных</h2>
              <p>
                Мы принимаем все необходимые технические и организационные меры для
                защиты персональных данных от несанкционированного доступа, изменения,
                раскрытия или уничтожения. Передача данных осуществляется по
                защищённому протоколу HTTPS.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="info-card">
              <h2 className="info-card-title">Срок хранения</h2>
              <p>
                Персональные данные хранятся до момента завершения конкурса и
                подведения итогов, но не более 1 года. По истечении этого срока
                данные anonymизируются или удаляются.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="info-card">
              <h2 className="info-card-title">Ваши права</h2>
              <ul className="info-list">
                <li>Право на доступ к своим персональным данным</li>
                <li>Право на исправление неточных данных</li>
                <li>Право на удаление данных (запрос через поддержку)</li>
                <li>Право на отзыв согласия на обработку ПД</li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
