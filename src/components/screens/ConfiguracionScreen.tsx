import React from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  RefreshCcw,
  Moon,
  Sun,
  Activity,
  Cpu,
  Server,
  Lock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfiguracionScreen: React.FC = () => {
  const { settings, updateSettings, theme, toggleTheme, resetAllDemoData, appMode, serverStatus } = useApp();
  const isDemo = appMode === 'demo';

  return (
    <div id="screen-configuracion" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Configuración & Seguridad de la Consola</h2>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono font-bold text-sky-400">
                {appMode.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gobernanza de agentes, políticas de sandbox, parámetros de persistencia y adaptadores
            </p>
          </div>
        </div>

        {isDemo && <button
          onClick={resetAllDemoData}
          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Restablecer Datos DEMO</span>
        </button>}
      </div>

      {/* Grid: Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Security & Governance */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Políticas de Seguridad & Gobernanza Humana</h3>
          </div>

          {!isDemo && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-sky-200">
              La configuración efectiva es informada por el backend. La edición permanecerá bloqueada hasta disponer de persistencia y auditoría específicas para políticas.
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Toggle 1: Human confirmation */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div>
                <span className="font-bold text-slate-200 block">
                  Exigir confirmación explícita para acciones de Alto Riesgo
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Obliga a escribir una frase de confirmación en la bandeja de decisiones para scripts de RouterOS o cambios presupuestales.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={!isDemo}
                checked={settings.requireHumanApprovalAllHighRisk}
                onChange={e => updateSettings({ requireHumanApprovalAllHighRisk: e.target.checked })}
                className="mt-1 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 w-4 h-4"
              />
            </div>

            {/* Toggle 2: Restrict write tools */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div>
                <span className="font-bold text-slate-200 block">
                  Permitir herramientas de escritura fuera de sandbox
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Por defecto deshabilitado para garantizar que ningún agente pueda emitir comandos destructivos sin simulación previa.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={!isDemo}
                checked={settings.allowWriteToolsGlobal}
                onChange={e => updateSettings({ allowWriteToolsGlobal: e.target.checked })}
                className="mt-1 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 w-4 h-4"
              />
            </div>

            {/* Toggle 3: Mask sensitive data */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div>
                <span className="font-bold text-slate-200 block">
                  Enmascarar tokens, credenciales e IPs en bitácora
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Oculta datos sensibles en la interfaz y en los registros de auditoría JSON exportados.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={!isDemo}
                checked={settings.maskSensitiveData}
                onChange={e => updateSettings({ maskSensitiveData: e.target.checked })}
                className="mt-1 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Environment & Adapter Status */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Estado real de adaptadores & servicios</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Hermes Kanban (solo lectura)</span>
                <span className="text-[11px] text-slate-400">Lectura de tableros informada por el backend; mensajería no conectada</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                {serverStatus?.hermes === 'available' ? 'DISPONIBLE' : serverStatus?.hermes === 'degraded' ? 'DEGRADADO' : 'NO CONECTADO'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Servidor MCP & Protocolos</span>
                <span className="text-[11px] text-slate-400">No habilitado en esta fase</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                NO CONECTADO
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Adaptador RouterOS v7</span>
                <span className="text-[11px] text-slate-400">Sin credenciales ni conexión MikroTik</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-semibold text-[10px]">
                DESCONECTADO
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Higgsfield Media Engine</span>
                <span className="text-[11px] text-slate-400">Capacidad no conectada</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-semibold text-[10px]">
                NO CONECTADO
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Appearance & Preferences */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-100">Preferencia Visual & Notificaciones</h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
            <div>
              <span className="font-bold text-slate-200 block">Tema Visual de la Consola</span>
              <p className="text-slate-400 text-[11px]">Tema actual: {theme === 'dark' ? 'Oscuro Profesional' : 'Claro'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
              <span>Alternar</span>
            </button>
          </div>
        </div>

        {/* Card 4: Data Persistence & Reset */}
        {isDemo && <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">Almacenamiento Local & Persistencia</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Todos los cambios efectuados por Ramiro (creación de tareas, aprobación de decisiones, comentarios, etc.) se almacenan en el <code className="text-sky-400 font-mono">localStorage</code> del navegador.
          </p>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rose-200 block">Restaurar Estado de Fábrica DEMO</span>
              <span className="text-[11px] text-slate-400">Elimina todas las mutaciones locales y vuelve a los 50 eventos iniciales.</span>
            </div>
            <button
              onClick={resetAllDemoData}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
            >
              Restablecer
            </button>
          </div>
        </div>}
      </div>
    </div>
  );
};
