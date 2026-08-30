import React from 'react';
import {
  LayoutDashboard,
  Scale,
  Bot,
  MessageSquare,
  KanbanSquare,
  FolderKanban,
  Radio,
  Code2,
  Sparkles,
  Briefcase,
  FileCheck2,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  Database,
  Terminal
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';
import { APP_INFO } from '../../constants';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeType?: 'danger' | 'warning' | 'info' | 'default';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    theme,
    toggleTheme,
    decisions,
    tasks,
    incidents,
    appMode,
    serverStatus
  } = useApp();

  const isProduction = appMode === 'production';
  const isStaging = appMode === 'staging';
  const isDemo = appMode === 'demo';

  const pendingDecisionsCount = (decisions || []).filter(d => d.status === 'pending').length;
  const criticalDecisionsCount = (decisions || []).filter(d => d.status === 'pending' && (d.risk === 'critical' || d.risk === 'high')).length;
  const activeTasksCount = (tasks || []).filter(t => t.status === 'in_progress' || t.status === 'review').length;
  const openIncidentsCount = (incidents || []).filter(i => i.status === 'open' || i.status === 'investigating' || i.status === 'mitigating').length;

  const navSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
        {
          id: 'decisiones',
          label: 'Decisiones',
          icon: Scale,
          badge: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
          badgeType: criticalDecisionsCount > 0 ? 'danger' : 'warning'
        },
        { id: 'equipo-ia', label: 'Equipo IA', icon: Bot },
        { id: 'conversaciones', label: 'Conversaciones', icon: MessageSquare }
      ]
    },
    {
      title: 'Operaciones',
      items: [
        {
          id: 'tareas',
          label: 'Tareas',
          icon: KanbanSquare,
          badge: activeTasksCount > 0 ? activeTasksCount : undefined,
          badgeType: 'info'
        },
        { id: 'proyectos', label: 'Proyectos', icon: FolderKanban },
        {
          id: 'operaciones-wisp',
          label: 'Operaciones WISP',
          icon: Radio,
          badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
          badgeType: 'warning'
        },
        { id: 'nugacore', label: 'NugaCore', icon: Code2 },
        { id: 'marketing', label: 'Marketing', icon: Sparkles },
        { id: 'administracion', label: 'Administración', icon: Briefcase },
        { id: 'entregables', label: 'Entregables', icon: FileCheck2 }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'auditoria', label: 'Auditoría', icon: ScrollText },
        { id: 'configuracion', label: 'Configuración', icon: Settings }
      ]
    }
  ];

  const handleNavClick = (id: ScreenId) => {
    setCurrentScreen(id);
    setIsMobileSidebarOpen(false);
  };

  const navContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/30 shrink-0">
            N
          </div>
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-[#E0E7FF] leading-tight">{APP_INFO.name}</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider">
                {APP_INFO.product} v{APP_INFO.version}
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        {isMobile ? (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="sidebar-toggle-button"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List by Bento Sections */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-4 px-3 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {(!isSidebarCollapsed || isMobile) && (
              <div className="text-[10px] uppercase tracking-wider text-[#64748B] mb-1 px-3 font-semibold">
                {section.title}
              </div>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 rounded-r'
                      : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-white/5 rounded border-l-2 border-transparent'
                  }`}
                  title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-blue-400' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                    }`}
                  />

                  {(!isSidebarCollapsed || isMobile) && (
                    <span className="truncate flex-1 text-left text-xs">{item.label}</span>
                  )}

                  {/* Badges */}
                  {item.badge !== undefined && (
                    <span
                      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.badgeType === 'danger'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : item.badgeType === 'warning'
                          ? 'bg-orange-500 text-black font-bold'
                          : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      } ${isSidebarCollapsed && !isMobile ? 'absolute top-1 right-1 px-1 py-0 text-[9px]' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System Status Panel (Replaced duplicate Ramiro block) */}
      <div className="p-3 border-t border-[#1E293B] bg-[#0A141D] shrink-0 text-xs">
        {(!isSidebarCollapsed || isMobile) ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#E0E7FF] text-xs">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>NUGA Team Console</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isProduction
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : isStaging
                    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                    : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                }`}
              >
                {isProduction ? 'PROD' : isStaging ? 'STAGING' : 'DEMO'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    serverStatus?.hermes === 'available'
                      ? 'bg-emerald-400'
                      : serverStatus?.hermes === 'degraded'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="truncate">
                  Hermes: {isDemo ? 'DEMO / no conectado' : serverStatus?.hermes === 'available' ? 'Disponible' : serverStatus?.hermes === 'degraded' ? 'Degradado' : 'No disponible'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]/70 text-[11px] text-[#64748B]">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-[#64748B]" />
                <span>
                  Almacenamiento:{' '}
                  <strong className="text-[#94A3B8] font-normal">
                    {isDemo ? 'Local' : isStaging ? 'Staging API' : 'Prod API'}
                  </strong>
                </span>
              </div>

              {/* Theme indicator and toggle */}
              <button
                onClick={toggleTheme}
                className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                title={theme === 'dark' ? 'Tema Oscuro (Click para cambiar a Claro)' : 'Tema Claro (Click para cambiar a Oscuro)'}
                aria-label={theme === 'dark' ? 'Tema Oscuro (Click para cambiar a Claro)' : 'Tema Claro (Click para cambiar a Oscuro)'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-[10px] font-mono capitalize">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="relative group cursor-pointer"
              title={`NUGA Team Console v${APP_INFO.version}\nModo: ${isProduction ? 'PRODUCCIÓN' : isStaging ? 'STAGING' : 'DEMO'}\nHermes: ${isDemo ? 'DEMO / no conectado' : serverStatus?.hermes || 'No conectado'}\nAlmacenamiento: ${isDemo ? 'Local' : 'API Remota'}`}
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span
                className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border border-[#0A141D] ${
                  isProduction ? 'bg-rose-500' : isStaging ? 'bg-yellow-500' : 'bg-orange-500'
                }`}
              />
            </div>
            <button
              onClick={toggleTheme}
              className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              aria-label={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="main-sidebar"
        className={`hidden md:flex relative flex-col bg-[#0A141D] border-r border-[#1E293B] transition-all duration-300 z-30 select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {navContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="md:hidden fixed inset-0 z-50 flex bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <aside
            id="mobile-sidebar-drawer"
            className="w-72 max-w-[85vw] h-full bg-[#0A141D] border-r border-[#1E293B] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
