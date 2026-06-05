import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import IAjupiterPage from "./pages/IAjupiterPage";
import TasksManagementPage from "./pages/TasksManagementPage";
import ConfigPage from "./pages/ConfigPage";
import UsersPage from "./pages/UsersPage";
import ProductlistPage from "./pages/productlistPage";

type ThemeMode = "night" | "day";

type MenuGroup = {
  key: string;
  label: string;
  icon: JSX.Element;
  children: Array<{ to: string; label: string }>;
};

const groups: MenuGroup[] = [
  {
    key: "IAjupiter",
    label: "IAjupiter",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 4 7v5c0 5.2 3.4 8.8 8 10 4.6-1.2 8-4.8 8-10V7l-8-4Zm0 3.3 4.7 2.3v3.2c0 3.5-2 6.1-4.7 7.2-2.7-1.1-4.7-3.7-4.7-7.2V8.6L12 6.3Zm-2 3.2h4c1.1 0 2 .9 2 2v1c0 .7-.3 1.3-.8 1.7l.8 2.3h-2.3l-.6-1.7h-2.2v1.7H8V11.5c0-1.1.9-2 2-2Zm0 2v1.3h4v-1.3h-4Z" fill="currentColor" />
      </svg>
    ),
    children: [
      { to: "/IAjupiter", label: "Chat Ollama (DeepSeek)" },
      { to: "/users", label: "Usuarios" }
    ]
  },
  {
    key: "taskmanager",
    label: "TaskManager",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 7H6v10h12V9Zm-8 3h2v5h-2v-5Zm4-2h2v7h-2v-7Z" fill="currentColor" />
      </svg>
    ),
    children: [
      { to: "/tasksmanagement", label: "Cronograma Gantt" },
      { to: "/graficas", label: "Gráficas" }
    ]
  },
  {
    key: "products",
    label: "Productos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 6v12l8 4 8-4V6l-8-4Zm0 2.6 4.2 2.1L12 8.8 7.8 6.7 12 4.6Zm-5 4.1 4 2v4.6l-4-2V8.7Zm6 6.6V10.7l4-2v4.6l-4 2Z" fill="currentColor" />
      </svg>
    ),
    children: [
      { to: "/productlist", label: "Lista de productos" },
      { to: "/estadisticas", label: "Estadísticas" }
    ]
  },  
  {
    key: "config",
    label: "Configuracion",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m19.4 13 .1-1-.1-1 2.1-1.7-2-3.5-2.6 1a7 7 0 0 0-1.7-1l-.4-2.7h-4l-.4 2.7c-.6.2-1.2.6-1.7 1l-2.6-1-2 3.5L4.6 11c0 .3-.1.7-.1 1s0 .7.1 1L2.5 14.7l2 3.5 2.6-1c.5.4 1.1.8 1.7 1l.4 2.7h4l.4-2.7c.6-.2 1.2-.6 1.7-1l2.6 1 2-3.5L19.4 13ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" fill="currentColor" />
      </svg>
    ),
    children: [
      { to: "/configuracion", label: "Estado de integraciones" },
      { to: "/setup", label: "Setup de IAjupiter" }
    ]
  }
];

export default function App() {
  const [openMenu, setOpenMenu] = useState<string>("IAjupiter");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem("IAjupiter-theme");
    return stored === "day" ? "day" : "night";
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem("IAjupiter-theme", theme);
  }, [theme]);

  const title = useMemo(() => {
    const active = groups.find((group) => group.key === openMenu);
    return active ? active.label : "Panel";
  }, [openMenu]);

  return (
    <div className={`app-shell theme-${theme}${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div>
            <p className="brand-kicker">IAjupiter</p>
            <h1> Main</h1>
          </div>
          <button
            aria-label={sidebarCollapsed ? "Expandir menu" : "Contraer menu"}
            aria-pressed={sidebarCollapsed}
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            type="button"
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <button
          aria-label="Alternar tema"
          className="theme-switch"
          onClick={() => setTheme((prev) => (prev === "night" ? "day" : "night"))}
          type="button"
        >
          <span className="theme-switch-dot" aria-hidden="true" />
          {theme === "night" ? "Modo nocturno" : "Modo diurno"}
        </button>

        <nav className="menu">
          {groups.map((group) => {
            const expanded = openMenu === group.key;
            return (
              <div className="menu-group" key={group.key}>
                <button
                  className="menu-trigger"
                  type="button"
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      setOpenMenu(group.key);
                      return;
                    }

                    setOpenMenu(expanded ? "" : group.key);
                  }}
                >
                  <span className="menu-trigger-main">
                    <span className="menu-icon" aria-hidden="true">{group.icon}</span>
                    <span className="menu-label">{group.label}</span>
                  </span>
                  <span className="chevron">{expanded ? "-" : "+"}</span>
                </button>
                {expanded && !sidebarCollapsed && (
                  <div className="submenu">
                    {group.children.map((child) => (
                      <NavLink
                        className={({ isActive }) => `submenu-link${isActive ? " active" : ""}`}
                        key={child.to}
                        to={child.to}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="content-area">
        <header className="content-header">
          <p className="headline-kicker">Plataforma operativa</p>
          <h2>{title}</h2>
        </header>

        <section className="page-area">
          <Routes>
            <Route path="/" element={<IAjupiterPage />} />
            <Route path="/IAjupiter" element={<IAjupiterPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/productlist" element={<ProductlistPage />} />
            <Route path="/tasksmanagement" element={<TasksManagementPage />} />
            <Route path="/configuracion" element={<ConfigPage />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}
