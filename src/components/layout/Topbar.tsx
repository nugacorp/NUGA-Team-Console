import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Sliders,
  ChevronDown,
  Menu,
  LogOut,
  Lock,
  Server
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';
import { HermesStatus } from '../../types';
import { APP_INFO } from '../../constants';
import { EnvironmentSelector } from './EnvironmentSelector';
import { useAuth } from '../../auth/AuthGate';
import { countOpenTasks } from '../../utils/taskMetrics';

export const Topbar: React.FC = () => {
  const { logout } = useAuth();
  const {
    currentScreen,
    setCurrentScreen,
    user,
    theme,
    toggleTheme,
    tasks,
    decisions,
    notifications,
    appMode,
    serverStatus,
    setIsNotificationCenterOpen,
    setIsMobileSidebarOpen,
    setIsSearchModalOpen,
    resetAllDemoData,
    addToast
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const [isHermesPopoverOpen, setIsHermesPopoverOpen] = useState(false);
  const [demoHermesStatus, setDemoHermesStatus] = useState<HermesStatus>('No conectado');
  const hermesRef = useRef<HTMLDivElement>(null);

  const openTasksCount = countOpenTasks(tasks);
  const pendingDecisionsCount = (decisions || []).filter(d => d.status === 'pending').length;
  const criticalDecisionsCount = (decisions || []).filter(d => d.status === 'pending' && (d.risk === 'critical' || d.risk === 'high')).length;
  const unreadNotifs = (notifications || []).filter(n => !n.read);
  const hasCriticalUnread = unreadNotifs.some(n => n.priority === 'urgente' || n.priority === 'alta');

  const isDemo = appMode === 'demo';
  const isStaging = appMode === 'staging';
  const isProduction = appMode === 'production';
  const modeLabel = isProduction ? 'PROD' : isStaging ? 'STAGING' : 'DEMO';

  const effectiveHermesStatus = isDemo ? demoHermesStatus : (serverStatus?.hermes === 'available' ? 'Disponible' : serverStatus?.hermes === 'degraded' ? 'Atención requerida' : 'No conectado');

  const screenTitles: Record<ScreenId, { title: string; subtitle: string }> = {
    resumen: { title: 'Resumen Ejecutivo', subtitle: 'Centro de mando y balance general de los 5 perfiles del equipo' },
    decisiones: { title: 'Centro de Decisiones', subtitle: 'Bandeja humana de control, aprobación y análisis de riesgo' },
    'equipo-ia': { title: 'Equipo IA', subtitle: '5 perfiles: Director, NugaCore, Operaciones, Marketing y Administración' },
    conversaciones: { title: 'Conversaciones con Agentes', subtitle: 'Canal directo de orquestación, análisis y tareas con los 5 especialistas' },
    tareas: { title: 'Tablero de Tareas Kanban', subtitle: 'Flujo de trabajo, runs técnicos, dependencias y entregables' },
    proyectos: { title: 'Gestión de Proyectos', subtitle: 'Roadmaps, hitos estratégicos y matrices de riesgo' },
    'operaciones-wisp': { title: 'Operaciones WISP', subtitle: 'Torres, routers MikroTik RouterOS v7, enlaces RF e incidentes' },
    nugacore: { title: 'Ingeniería NugaCore', subtitle: 'Salud de arquitectura, CI/CD, pruebas y propuestas de código' },
    marketing: { title: 'Marketing & Biblioteca Multimedia', subtitle: 'Campañas, videos, storyboards y generador de prompts' },
    administracion: { title: 'Operaciones Administrativas', subtitle: 'Minutas, acuerdos, cotizaciones y seguimiento de control' },
    entregables: { title: 'Entregables & Documentos', subtitle: 'Visor ejecutivo y evidencia técnica de informes' },
    auditoria: { title: 'Bitácora de Auditoría', subtitle: isDemo ? 'Bitácora DEMO local.' : 'Trazabilidad persistida por NUGA Console API con control de acceso.' },
    configuracion: { title: 'Configuración de la Consola', subtitle: 'Modelos, políticas de seguridad, MCP y sandbox' }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    if (!isDemo) {
      void logout();
      return;
    }
    addToast({
      title: 'Sesión DEMO',
      message: 'En este entorno de demostración local, la sesión de Ramiro permanece activa para interactuar con la consola.',
      type: 'info'
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (hermesRef.current && !hermesRef.current.contains(e.target as Node)) {
        setIsHermesPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="main-topbar"
      className="h-16 bg-[#0A141D] border-b border-[#1E293B] px-3 sm:px-4 md:px-6 flex items-center justify-between z-20 select-none sticky top-0"
    >
      {/* Left: Mobile hamburger menu & Screen Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={() => setIsMobileSidebarOpen(prev => !prev)}
          className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors shrink-0"
          title="Abrir menú de navegación"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base font-bold text-white truncate">
              {screenTitles[currentScreen]?.title || 'Resumen Ejecutivo'}
            </h1>
            <span
              className={`hidden sm:inline-block text-[10px] border px-2 py-0.5 rounded font-mono uppercase tracking-tight shrink-0 ${
                isProduction
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isStaging
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}
            >
              {isProduction ? 'Modo PRODUCCIÓN Activo' : isStaging ? 'Modo STAGING Activo' : 'Modo DEMO Activo'}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] hidden md:block truncate max-w-xs sm:max-w-md lg:max-w-xl mt-0.5" title={screenTitles[currentScreen]?.subtitle}>
            {screenTitles[currentScreen]?.subtitle || 'Centro de mando'}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
        {/* Environment Selector for Admins */}
        <EnvironmentSelector />

        {/* Hermes Status Indicator Pill with interactive Popover */}
        <div className="relative" ref={hermesRef}>
          <button
            id="hermes-status-indicator-btn"
            onClick={() => setIsHermesPopoverOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111D27] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-mono transition-all cursor-pointer"
            title={`Estado del motor de agentes Hermes (${isProduction ? 'PRODUCCIÓN' : isStaging ? 'STAGING' : 'DEMO'})`}
            aria-label="Estado del motor de agentes Hermes"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                effectiveHermesStatus === 'Disponible'
                  ? 'bg-emerald-400'
                  : effectiveHermesStatus === 'Procesando tarea' || effectiveHermesStatus === 'Sincronizando'
                  ? 'bg-sky-400 animate-pulse'
                  : effectiveHermesStatus === 'Atención requerida'
                  ? 'bg-amber-400 animate-pulse'
                  : effectiveHermesStatus === 'Error'
                  ? 'bg-rose-400'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-[#94A3B8] hidden lg:inline text-[11px]">Hermes ·</span>
            <span
              className={`font-bold text-[10px] px-1 rounded border ${
                isProduction
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : isStaging
                  ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                  : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
              }`}
            >
              {isProduction ? 'PROD' : isStaging ? 'STAGING' : 'DEMO'}
            </span>
            <span className="text-[#E0E7FF] font-semibold text-[11px] hidden sm:inline truncate max-w-[110px]">
              · {effectiveHermesStatus}
            </span>
          </button>

          {/* Hermes Status Popover */}
          {isHermesPopoverOpen && (
            <div
              id="hermes-status-popover"
              className="absolute right-0 mt-2 w-80 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-2xl shadow-black/90 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="font-bold text-white block">Motor de Agentes Hermes</span>
                    <span className="text-[10px] text-[#64748B]">Plataforma de orquestación</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                    isProduction
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : isStaging
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}
                >
                  {isProduction ? 'PRODUCCIÓN' : isStaging ? 'STAGING' : 'DEMO'}
                </span>
              </div>

              <div className="space-y-1.5 bg-[#0A141D] p-3 rounded-lg border border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Estado Actual:</span>
                <div className="flex items-center gap-2 text-white font-mono font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveHermesStatus === 'Disponible'
                        ? 'bg-emerald-400'
                        : effectiveHermesStatus === 'Procesando tarea' || effectiveHermesStatus === 'Sincronizando'
                        ? 'bg-sky-400 animate-pulse'
                        : effectiveHermesStatus === 'Atención requerida'
                        ? 'bg-amber-400 animate-pulse'
                        : effectiveHermesStatus === 'Error'
                        ? 'bg-rose-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>Hermes · {isProduction ? 'PROD' : isStaging ? 'STAGING' : 'DEMO'} · {effectiveHermesStatus}</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed pt-1">
                  {isDemo && 'Hermes opera en simulación local sin conexión a brokers externos ni APIs productivas.'}
                  {isStaging && 'Hermes conectado al entorno de pruebas de laboratorio no productivo.'}
                  {isProduction && 'Hermes conectado a la infraestructura productiva bajo control de acceso.'}
                </p>
                <div
                  className={`mt-2 p-2 rounded border text-[11px] ${
                    isProduction
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : isStaging
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}
                >
                  {isDemo && '⚠️ Aviso DEMO: No conectado a servicios externos, MikroTik RouterOS ni APIs remotas.'}
                  {isStaging && '🧪 Aviso STAGING: Conectado a sandbox de laboratorio. Operaciones de escritura restringidas.'}
                  {isProduction && '🔒 Aviso PRODUCCIÓN: Operaciones auditadas y registradas criptográficamente.'}
                </div>
              </div>

              {isDemo && (
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block mb-2">
                    Cambiar Estado Simulado de Hermes (DEMO):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['No conectado', 'Disponible', 'Sincronizando', 'Procesando tarea', 'Atención requerida', 'Error'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setDemoHermesStatus(st)}
                        className={`px-2.5 py-1.5 rounded text-[11px] text-left transition-colors cursor-pointer ${
                          demoHermesStatus === st
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold'
                            : 'bg-[#0A141D] hover:bg-[#1E293B] text-[#94A3B8]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Search trigger bar */}
        <button
          id="global-search-trigger"
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center gap-2 bg-[#1E293B] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#334155] text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          title="Búsqueda global (Cmd+K / Ctrl+K)"
          aria-label="Búsqueda global"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline text-xs text-[#CBD5E1]">Buscar...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[#0A141D] border border-[#334155] rounded text-[#94A3B8] font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick KPI: Active tasks */}
        <button
          id="quick-active-tasks-btn"
          onClick={() => setCurrentScreen('tareas')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111D27] hover:bg-[#1E293B] border border-[#1E293B] text-xs text-[#E0E7FF] transition-colors cursor-pointer"
          title={`${openTasksCount} tareas abiertas en entorno ${modeLabel}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono font-bold text-blue-400">{openTasksCount}</span>
          <span className="text-[#94A3B8] text-[11px]">abiertas · {modeLabel}</span>
        </button>

        {/* Quick KPI: Pending decisions */}
        {pendingDecisionsCount > 0 && (
          <button
            id="quick-pending-decisions-btn"
            onClick={() => setCurrentScreen('decisiones')}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-orange-400/15 hover:bg-orange-400/25 border border-orange-500/30 text-xs text-orange-400 font-bold transition-colors animate-pulse cursor-pointer"
            title={`${pendingDecisionsCount} decisiones pendientes · ${modeLabel}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span>{pendingDecisionsCount}</span>
            <span className="hidden sm:inline text-[10px] px-1 bg-orange-500 text-black rounded font-extrabold uppercase">
              {criticalDecisionsCount > 0 ? 'Riesgo crítico' : 'Urgente'} · {modeLabel}
            </span>
          </button>
        )}

        {/* Theme Switcher Toggle Button */}
        <button
          id="theme-switcher-button"
          onClick={toggleTheme}
          className="relative w-9 h-9 rounded-lg border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notification Center Trigger Button */}
        <button
          id="notifications-button"
          onClick={() => setIsNotificationCenterOpen(true)}
          className="relative w-9 h-9 rounded-lg border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Abrir Centro de Notificaciones"
          aria-label="Abrir Centro de Notificaciones"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifs.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#0A141D] ${
                hasCriticalUnread
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-blue-600'
              }`}
            >
              {unreadNotifs.length}
            </span>
          )}
        </button>

        {/* User Profile & Session Menu (Ramiro - Unique Session Control) */}
        <div className="relative" ref={userRef}>
          <button
            id="user-profile-button"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-white/5 transition-colors border border-[#1E293B] cursor-pointer"
            aria-label="Menú de cuenta y sesión de Ramiro"
            title="Cuenta y sesión de Ramiro"
          >
            <div className="w-7 h-7 rounded-full bg-[#1E293B] border border-blue-500/30 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                'R'
              )}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-[#E0E7FF]">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 mt-2 w-72 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-2xl shadow-black/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
            >
              <div className="px-4 py-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-blue-500/30 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      'R'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-blue-400 font-medium">{user.title}</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B]">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-semibold border border-green-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Propietario / Super Admin</span>
                </div>
              </div>

              <div className="py-1">
                {/* Preferencias: Tema */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#E0E7FF] hover:bg-[#0A141D] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                    <span>Preferencias: Tema {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                  </span>
                  <span className="text-[10px] text-[#64748B] uppercase">Alternar</span>
                </button>

                {/* Notificaciones */}
                <button
                  onClick={() => {
                    setIsNotificationCenterOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#E0E7FF] hover:bg-[#0A141D] flex items-center gap-2.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Centro de Notificaciones</span>
                </button>

                {/* Seguridad / Configuración */}
                <button
                  onClick={() => {
                    setCurrentScreen('configuracion');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#E0E7FF] hover:bg-[#0A141D] flex items-center gap-2.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Seguridad & Configuración</span>
                </button>

                {/* Bitácora de Auditoría */}
                <button
                  onClick={() => {
                    setCurrentScreen('auditoria');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#E0E7FF] hover:bg-[#0A141D] flex items-center gap-2.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Bitácora de Auditoría {modeLabel}</span>
                </button>

                {isDemo && <button
                  onClick={() => {
                    resetAllDemoData();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-orange-400 hover:bg-[#0A141D] flex items-center gap-2.5 cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Datos DEMO</span>
                </button>}

                {/* Cerrar Sesión DEMO */}
                <div className="pt-1 mt-1 border-t border-[#1E293B]">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-[#0A141D] flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isDemo ? 'Cerrar Sesión DEMO' : 'Cerrar sesión segura'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
