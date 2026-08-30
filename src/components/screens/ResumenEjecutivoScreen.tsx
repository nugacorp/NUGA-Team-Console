import React from 'react';
import {
  Scale,
  KanbanSquare,
  Radio,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Bot,
  Flame,
  Activity,
  Plus,
  RotateCcw,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_INFO, FORMAT_RISK, TEAM_PROFILES_LABEL } from '../../constants';

export const ResumenEjecutivoScreen: React.FC = () => {
  const {
    user,
    decisions,
    tasks,
    towers,
    routers,
    incidents,
    agents,
    auditEvents,
    setCurrentScreen,
    setSelectedDecisionId,
    setSelectedTaskId,
    openModal,
    resetAllDemoData
  } = useApp();

  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const criticalDecisions = pendingDecisions.filter(d => d.risk === 'critical');
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'review');
  const totalClients = towers.reduce((acc, t) => acc + t.connectedClients, 0);

  const getAgentLetter = (role: string) => {
    switch (role) {
      case 'director': return 'D';
      case 'nugacore': return 'N';
      case 'operaciones': return 'O';
      case 'marketing': return 'M';
      case 'administracion': return 'A';
      default: return 'A';
    }
  };

  const getAgentColor = (role: string) => {
    switch (role) {
      case 'director': return { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500', pct: '85%' };
      case 'nugacore': return { bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500', pct: '75%' };
      case 'operaciones': return { bg: 'bg-amber-600/20', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500', pct: '90%' };
      case 'marketing': return { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/30', bar: 'bg-purple-500', pct: '60%' };
      case 'administracion': return { bg: 'bg-rose-600/20', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-500', pct: '65%' };
      default: return { bg: 'bg-slate-600/20', text: 'text-slate-400', border: 'border-slate-500/30', bar: 'bg-slate-500', pct: '50%' };
    }
  };

  return (
    <div id="screen-resumen" className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Banner: DEMO Mode Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#111D27] border border-[#1E293B] text-xs text-[#94A3B8] gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono font-bold text-orange-400 shrink-0">
            DEMO
          </span>
          <span className="truncate">{APP_INFO.demoNotice}</span>
        </div>
        <span className="text-[11px] font-mono text-[#CBD5E1] hidden sm:inline shrink-0 font-medium">
          {TEAM_PROFILES_LABEL}
        </span>
      </div>

      {/* 4 Core Top Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento Card 1: Estado General */}
        <div className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-green-500/30 transition-all">
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Estado General</p>
            <p className="text-xl font-bold text-green-500 tracking-tight flex items-center gap-1.5">
              OPERATIVO <span className="text-xs font-mono font-normal text-green-400/80">· DEMO</span>
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">5 perfiles · Simulación local</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 text-xl font-bold">
            ✓
          </div>
        </div>

        {/* Bento Card 2: Clientes Activos WISP */}
        <div
          onClick={() => setCurrentScreen('operaciones-wisp')}
          className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Clientes Activos</p>
            <p className="text-2xl font-mono font-bold text-white tracking-tight">
              {totalClients} <span className="text-xs font-mono font-normal text-[#94A3B8]">· DEMO</span>
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">{towers.length} Torres · {routers.length} Routers</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              +4 hoy · DEMO
            </span>
            <p className="text-[10px] text-[#64748B] mt-1">WISP Local</p>
          </div>
        </div>

        {/* Bento Card 3: Tareas Activas */}
        <div
          onClick={() => setCurrentScreen('tareas')}
          className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Tareas Activas</p>
            <p className="text-2xl font-mono font-bold text-blue-400 tracking-tight">
              {activeTasks.length} <span className="text-xs font-mono font-normal text-[#94A3B8]">· DEMO</span>
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">En progreso / revisión</p>
          </div>
          <div className="flex -space-x-2">
            {agents.map(a => (
              <div
                key={a.id}
                className="w-7 h-7 rounded-full bg-[#1E293B] border-2 border-[#111D27] text-[10px] font-bold flex items-center justify-center text-white"
                title={`${a.name} (${a.roleTitle})`}
                aria-label={a.name}
              >
                {getAgentLetter(a.id)}
              </div>
            ))}
          </div>
        </div>

        {/* Bento Card 4: Decisiones Pendientes */}
        <div
          onClick={() => setCurrentScreen('decisiones')}
          className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-orange-500/40 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Decisiones</p>
            <p className="text-2xl font-mono font-bold text-orange-400 tracking-tight">
              {pendingDecisions.length} <span className="text-xs font-mono font-normal text-[#94A3B8]">· DEMO</span>
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
              {criticalDecisions.length > 0 ? `${criticalDecisions.length} críticas · DEMO` : 'Evaluación requerida'}
            </p>
          </div>
          <div className="px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            URGENTE · DEMO
          </div>
        </div>
      </div>

      {/* Middle Row Bento Grid: Decisiones (8 cols) + Equipo IA (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Box: Decisiones (8 cols) */}
        <div className="lg:col-span-8 bg-[#111D27] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Necesita tu decisión</span>
              <span className="text-xs font-normal text-[#94A3B8] hidden sm:inline">• Prioridad Ejecutiva</span>
            </h3>
            <button
              onClick={() => setCurrentScreen('decisiones')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver todas ({decisions.length} · DEMO)
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {pendingDecisions.slice(0, 3).map(decision => {
              const isCrit = decision.risk === 'critical';
              const isHigh = decision.risk === 'high';
              const stripeColor = isCrit ? 'bg-rose-500' : isHigh ? 'bg-orange-500' : 'bg-blue-500';
              const riskLabel = FORMAT_RISK[decision.risk] || 'Riesgo evaluado';

              return (
                <div
                  key={decision.id}
                  className="bg-[#0A141D] border border-[#1E293B] rounded-lg p-3.5 flex items-center gap-3 sm:gap-4 hover:border-[#334155] transition-all"
                >
                  <div className={`w-1.5 self-stretch rounded-full shrink-0 ${stripeColor}`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 shrink-0">
                        {decision.code}
                      </span>
                      <h4
                        className="text-xs sm:text-sm font-bold text-white line-clamp-2"
                        title={decision.title}
                      >
                        {decision.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] line-clamp-1">{decision.proposal || decision.situation}</p>
                  </div>

                  <div className="text-right px-2 hidden sm:block shrink-0">
                    <p className={`text-[10px] font-bold ${isCrit ? 'text-rose-400' : isHigh ? 'text-orange-400' : 'text-blue-400'}`}>
                      {riskLabel} · DEMO
                    </p>
                    <p className="text-[10px] text-[#64748B] truncate max-w-[140px]">{decision.affectedScope}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDecisionId(decision.id);
                      openModal('decisionDetail', { decisionId: decision.id });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors shadow-sm shadow-blue-900/30 cursor-pointer"
                    aria-label={`Revisar propuesta ${decision.code}`}
                  >
                    REVISAR
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Box: Equipo IA Status (4 cols) - All 5 Profiles Visible */}
        <div className="lg:col-span-4 bg-[#111D27] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E293B]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>{TEAM_PROFILES_LABEL}</span>
            </h3>
            <button
              onClick={() => setCurrentScreen('equipo-ia')}
              className="text-xs text-blue-400 hover:underline cursor-pointer font-medium"
            >
              Organigrama (5)
            </button>
          </div>

          <div className="space-y-2.5">
            {agents.map((agent) => {
              const color = getAgentColor(agent.id);

              return (
                <div
                  key={agent.id}
                  onClick={() => setCurrentScreen('equipo-ia')}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#0A141D] transition-colors cursor-pointer"
                  title={`${agent.name}: ${agent.roleTitle} (${agent.department})`}
                >
                  <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center ${color.text} font-bold text-xs border ${color.border} shrink-0`}>
                    {getAgentLetter(agent.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#E0E7FF] truncate">{agent.name}</span>
                      <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Activo · DEMO
                      </span>
                    </div>
                    <div className="w-full bg-[#1E293B] h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className={`${color.bar} h-full rounded-full transition-all`} style={{ width: color.pct }}></div>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 truncate">{agent.roleTitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row Bento Grid: Red WISP (5 cols) + Actividad Reciente (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Box: Red WISP (5 cols) */}
        <div className="lg:col-span-5 bg-[#111D27] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Red WISP</span>
              <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">
                99.4% Uptime · DEMO
              </span>
            </h3>
            <button
              onClick={() => setCurrentScreen('operaciones-wisp')}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Detalle
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {towers.slice(0, 2).map((tower, idx) => (
              <div key={tower.id} className="p-3 bg-[#0A141D] rounded-lg border border-[#1E293B]">
                <div className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">{tower.name}</div>
                <div className="flex items-end justify-between mt-1">
                  <span className={`text-base font-bold ${tower.status === 'online' ? 'text-green-400' : 'text-amber-400'}`}>
                    {tower.status === 'online' ? 'OK' : 'WARN'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">{tower.connectedClients} Clientes · DEMO</span>
                </div>
                {/* Micro sparkline bar */}
                <div className="flex gap-1 mt-2">
                  <div className="h-3 flex-1 bg-green-500 rounded-xs"></div>
                  <div className="h-4 flex-1 bg-green-500 rounded-xs"></div>
                  <div className="h-2 flex-1 bg-green-500 rounded-xs"></div>
                  <div className={`h-3 flex-1 ${idx === 1 ? 'bg-amber-500' : 'bg-green-500'} rounded-xs`}></div>
                  <div className="h-4 flex-1 bg-green-500 rounded-xs"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1E293B]">
            <span className="text-[11px] text-[#94A3B8] font-mono">{routers.length} Routers MikroTik RouterOS v7</span>
            <button
              onClick={() => openModal('newIncident')}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
            >
              + Reportar Incidente
            </button>
          </div>
        </div>

        {/* Bento Box: Actividad Reciente & Auditoría (7 cols) */}
        <div className="lg:col-span-7 bg-[#111D27] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Actividad Reciente</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                DEMO
              </span>
            </h3>
            <button
              onClick={() => setCurrentScreen('auditoria')}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Bitácora Completa
            </button>
          </div>

          <div className="space-y-3 overflow-hidden">
            {auditEvents.slice(0, 3).map((evt, idx) => (
              <div key={evt.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                    idx === 0 ? 'bg-blue-500 ring-2 ring-blue-500/20' : idx === 1 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#E0E7FF]">
                    <span className="font-bold text-white">{evt.actorName}</span>{' '}
                    <span className="text-[#94A3B8]">{evt.action}</span>
                  </p>
                  <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{evt.humanExplanation}</p>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono shrink-0">{evt.timestamp ? evt.timestamp.substring(11, 16) : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Controls - Compact, organized and safely positioned */}
      <aside aria-label="Acciones rápidas flotantes" className="fixed bottom-6 right-6 z-40">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#111D27]/90 backdrop-blur-md border border-[#1E293B] shadow-2xl shadow-black/80">
          <button
            onClick={() => setCurrentScreen('conversaciones')}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-lg shadow-blue-900/40"
            title="Abrir canal con el Director (Coordinador del equipo)"
            aria-label="Abrir canal con el Director"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentScreen('auditoria')}
            className="w-10 h-10 bg-[#1E293B] hover:bg-[#334155] text-[#E0E7FF] rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Ver Bitácora de Auditoría DEMO"
            aria-label="Ver Bitácora de Auditoría DEMO"
          >
            <Activity className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={resetAllDemoData}
            className="w-10 h-10 bg-[#1E293B] hover:bg-[#334155] text-orange-400 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Restablecer Datos DEMO"
            aria-label="Restablecer Datos DEMO"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </div>
  );
};

