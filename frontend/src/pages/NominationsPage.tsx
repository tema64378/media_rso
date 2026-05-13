import ScrollReveal from '../components/ScrollReveal';
import '../styles/info-page.css';

const NOMINATIONS = [
  { icon: "📸", name: "В объективе РСО", desc: "Лучшие фотографии с мероприятий и стройотрядной жизни. Принимаются одиночные кадры и фотосерии." },
  { icon: "🎥", name: "Видеоролик РСО", desc: "Лучший видеоролик о деятельности студенческого отряда. Хронометраж — до 3 минут." },
  { icon: "💬", name: "Сообщество ВК", desc: "Лучшее сообщество ВКонтакте студенческого отряда или штаба. Оценивается визуал, вовлечённость и регулярность постов." },
  { icon: "👥", name: "Медиакоманда", desc: "Лучшая пресс-служба студенческого отряда. Оценивается командная работа и системный подход к медиа." },
  { icon: "✍️", name: "Блогер РСО", desc: "Лучший личный блог о жизни в студенческих отрядах. Платформа — ВКонтакте или Telegram." },
  { icon: "🎨", name: "Дизайн РСО", desc: "Лучшие дизайн-макеты: мерч, плакаты, открытки, цифровые баннеры для мероприятий РСО." },
  { icon: "📰", name: "Статья РСО", desc: "Лучшая статья или репортаж о деятельности студенческого отряда для СМИ или пабликов." },
  { icon: "🎵", name: "Медиа-проект", desc: "Комплексный медиа-проект: подкаст, спецпроект, онлайн-рубрика или серия материалов." },
];

export default function NominationsPage() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-content">
          <h1 className="info-hero-title">Номинации</h1>
          <p className="info-hero-subtitle">
            Конкурс проводится по восьми номинациям, охватывающим все направления
            современной медиа-журналистики.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-content">
          <div className="info-grid">
            {NOMINATIONS.map((nom, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-title">
                    <span className="info-card-icon">{nom.icon}</span>
                    {nom.name}
                  </div>
                  <p>{nom.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
