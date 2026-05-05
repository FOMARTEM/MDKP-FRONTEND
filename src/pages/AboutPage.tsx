export default function AboutPage() {
  return (
    <>
      <h1>О платформе</h1>
      <div className="card">
        <div className="topbar">
          <div>
            <div className="pill">MDKP</div>
            <p className="muted" style={{ marginTop: 10 }}>
              Платформа для управления задачами, версиями и правками цифровых материалов.
            </p>
          </div>
          <div className="muted" style={{ textAlign: "right" }}>
            Версия интерфейса: SPA (React)
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Возможности</h3>
        <ul className="help-list">
          <li>Задачи: создание, просмотр, смена статуса.</li>
          <li>Материалы: загрузка и скачивание файлов.</li>
          <li>Версии и правки: фиксация итераций и замечаний.</li>
          <li>Администрирование: пользователи, роли, журнал действий.</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ссылки</h3>
        <div className="row-2">
          <div>
            <div className="label-like">GitHub</div>
            <a className="link" href="https://github.com/FOMARTEM" target="_blank" rel="noreferrer">
              github.com/FOMARTEM
            </a>
          </div>
          <div>
            <div className="label-like">Telegram</div>
            <a className="link" href="https://t.me/FOMARTEM" target="_blank" rel="noreferrer">
              @FOMARTEM
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
