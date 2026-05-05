import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { isAdmin, isManager } from "../lib/roles";
import { usePrefs } from "../state/prefs";

function roleLabel(role?: string) {
  if (!role) return "User";
  return role;
}

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, lang, setLang } = usePrefs();

  const role = user?.role ?? "";
  const admin = isAdmin(role);
  const manager = isManager(role);

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-top">
          <h2>{roleLabel(user?.role)}</h2>

          {!admin && (
            <>
              <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                {manager ? "Список задач" : "Задачи"}
              </NavLink>
              {manager && (
                <NavLink to="/tasks/new" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  Создать задачу
                </NavLink>
              )}
            </>
          )}

          <NavLink to="/account" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Мой аккаунт
          </NavLink>

          {admin && (
            <>
              <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                Пользователи
              </NavLink>
              <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                Журнал действий
              </NavLink>
            </>
          )}

          <NavLink to="/help" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Инструкция
          </NavLink>
        </div>


        <div className="spacer" />

        <a className="nav-item" href="#about" onClick={(e) => { e.preventDefault(); navigate("/about"); }}>
          О проекте
        </a>

        <a
          className="nav-item"
          style={{ color: "#f87171" }}
          href="#logout"
          onClick={(e) => {
            e.preventDefault();
            logout();
            navigate("/login");
          }}
        >
          Выйти
        </a>
      </div>

      <div className="main">
        <div className="main-content">
          <Outlet />
        </div>
        <div className="footer">
          <div className="footer-inner">
            <div className="muted">MDKP • Платформа управления цифровыми активами</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                className="link"
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/about");
                }}
              >
                О проекте
              </a>
              <a className="link" href="https://github.com/FOMARTEM" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a className="link" href="https://t.me/FOMARTEM" target="_blank" rel="noreferrer">
                Telegram @FOMARTEM
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
