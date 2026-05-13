import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

export default function TermsOfService() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-content">
          <h1 className="info-hero-title">Пользовательское соглашение</h1>
          <p className="info-hero-subtitle">
            Условия использования платформы «Медиа РСО».
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <ScrollReveal>
            <div className="info-card">
              <h2 className="info-card-title">1. Общие условия</h2>
              <p>
                Используя платформу «Медиа РСО», вы соглашаетесь с настоящими
                условиями. Если вы не согласны с каким-либо пунктом, пожалуйста,
                воздержитесь от использования платформы.
              </p>
              <p>
                Администрация платформы оставляет за собой право вносить изменения
                в условия соглашения с уведомлением пользователей через публикацию
                на сайте.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="info-card">
              <h2 className="info-card-title">2. Обязанности пользователя</h2>
              <ul className="info-list">
                <li>Предоставлять достоверную информацию при регистрации</li>
                <li>Не передавать учётные данные третьим лицам</li>
                <li>Не размещать контент, нарушающий законодательство РФ</li>
                <li>Соблюдать правила и сроки проведения конкурса</li>
                <li>Не использовать платформу для рассылки спама</li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="info-card">
              <h2 className="info-card-title">3. Интеллектуальная собственность</h2>
              <p>
                Все права на конкурсные работы принадлежат их авторам. Загружая
                работу, участник предоставляет организаторам конкурса право на
                её публичный показ в рамках проведения конкурса и подведения
                итогов без выплаты вознаграждения.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="info-card">
              <h2 className="info-card-title">4. Ограничение ответственности</h2>
              <p>
                Платформа предоставляется «как есть». Администрация не несёт
                ответственности за временные сбои в работе, потерю данных или
                ущерб, возникший в результате использования платформы.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
