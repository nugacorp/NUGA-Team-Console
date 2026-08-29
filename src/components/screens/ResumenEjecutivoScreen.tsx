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
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

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

  return (
    <div id="screen-resumen-ejecutivo" className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* 4 Core Top Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento Card 1: Estado General */}
        <div className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-green-500/30 transition-all">
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Estado General</p>
            <p className="text-xl font-bold text-green-500 tracking-tight flex items-center gap-1.5">
              OPERATIVO
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">5 Agentes • Sandbox Activo</p>
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
            <p className="text-2xl font-mono font-bold text-white tracking-tight">{totalClients}</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">{towers.length} Torres • {routers.length} Routers</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              +4 hoy
            </span>
            <p className="text-[10px] text-[#64748B] mt-1">WISP Demo</p>
          </div>
        </div>

        {/* Bento Card 3: Tareas Activas */}
        <div
          onClick={() => setCurrentScreen('tareas')}
          className="bg-[#111D27] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Tareas Activas</p>
            <p className="text-2xl font-mono font-bold text-blue-400 tracking-tight">{activeTasks.length}</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">En progreso / revisión</p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-[#111D27] text-[10px] font-bold flex items-center justify-center text-white" title="Director Hermes">
              H
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#111D27] text-[10px] font-bold flex items-center justify-center text-white" title="Ing. NugaCore">
              N
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#111D27] text-[10px] font-bold flex items-center justify-center text-white" title="Especialista Marketing">
              M
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-[#111D27] text-[10px] font-bold flex items-center justify-center text-white" title="Ops WISP">
              W
            </div>
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
              {pendingDecisions.length < 10 ? `0${pendingDecisions.length}` : pendingDecisions.length}
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
              {criticalDecisions.length > 0 ? `${criticalDecisions.length} críticas` : 'Evaluación requerida'}
            </p>
          </div>
          <div className="px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            URGENTE
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
              <span className="text-xs font-normal text-[#64748B] hidden sm:inline">• Prioridad Ejecutiva</span>
            </h3>
            <button
              onClick={() => setCurrentScreen('decisiones')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
            >
              Ver todas ({decisions.length})
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {pendingDecisions.slice(0, 3).map(decision => {
              const isCrit = decision.risk === 'critical';
              const isHigh = decision.risk === 'high';
              const stripeColor = isCrit ? 'bg-rose-500' : isHigh ? 'bg-orange-500' : 'bg-blue-500';

              return (
                <div
                  key={decision.id}
                  className="bg-[#0A141D] border border-[#1E293B] rounded-lg p-3.5 flex items-center gap-4 hover:border-[#334155] transition-all"
                >
                  <div className={`w-1.5 self-stretch rounded-full shrink-0 ${stripeColor}`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        {decision.code}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-white truncate">{decision.title}</h4>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] line-clamp-1">{decision.summary}</p>
                  </div>

                  <div className="text-right px-2 hidden sm:block shrink-0">
                    <p className={`text-[10px] font-bold ${isCrit ? 'text-rose-400' : isHigh ? 'text-orange-400' : 'text-blue-400'}`}>
                      {decision.risk.toUpperCase()} RIESGO
                    </p>
                    <p className="text-[9px] text-[#64748B]">{decision.affectedScope}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDecisionId(decision.id);
                      openModal('decisionDetail', { decisionId: decision.id });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors shadow-sm shadow-blue-900/30"
                  >
                    REVISAR
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Box: Equipo IA Status (4 cols) */}
        <div className="lg:col-span-4 bg-[#111D27] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Equipo IA</span>
              <span className="text-xs font-normal text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
            </h3>
            <button
              onClick={() => setCurrentScreen('equipo-ia')}
              className="text-xs text-blue-400 hover:underline"
            >
              Organigrama
            </button>
          </div>

          <div className="space-y-3.5">
            {agents.slice(0, 3).map((agent, i) => {
              const colors = [
                { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500', pct: '85%' },
                { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', bar: 'bg-purple-500', pct: '45%' },
                { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500', pct: '70%' }
              ][i] || { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500', pct: '60%' };

              return (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} font-bold text-xs border ${colors.border} shrink-0`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#E0E7FF] truncate">{agent.name}</span>
                      <span className="text-[10px] text-green-400 font-mono">Activo</span>
                    </div>
                    <div className="w-full bg-[#1E293B] h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className={`${colors.bar} h-full rounded-full transition-all`} style={{ width: colors.pct }}></div>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-1 truncate">{agent.roleTitle}</p>
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
                99.4% Uptime
              </span>
            </h3>
            <button
              onClick={() => setCurrentScreen('operaciones-wisp')}
              className="text-xs text-blue-400 hover:underline"
            >
              Detalle
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {towers.slice(0, 2).map((tower, idx) => (
              <div key={tower.id} className="p-3 bg-[#0A141D] rounded-lg border border-[#1E293B]">
                <div className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">{tower.name}</div>
                <div className="flex items-end justify-between mt-1">
                  <span className={`text-base font-bold ${tower.status === 'online' ? 'text-green-400' : 'text-amber-400'}`}>
                    {tower.status === 'online' ? 'OK' : 'WARN'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">{tower.connectedClients} Clientes</span>
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
            <span className="text-[11px] text-[#64748B] font-mono">{routers.length} Routers MikroTik RouterOS v7</span>
            <button
              onClick={() => openModal('newIncident')}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold"
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
            </h3>
            <button
              onClick={() => setCurrentScreen('auditoria')}
              className="text-xs text-blue-400 hover:underline"
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
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">{evt.humanExplanation}</p>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono shrink-0">{evt.timestamp ? evt.timestamp.substring(11, 16) : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-40">
        <button
          onClick={() => setCurrentScreen('conversaciones')}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl shadow-blue-900/60 flex items-center justify-center text-xl hover:scale-105 transition-all cursor-pointer"
          title="Consultar al Director Hermes"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={resetAllDemoData}
          className="w-12 h-12 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-white rounded-full shadow-xl flex items-center justify-center text-xl transition-all cursor-pointer"
          title="Restablecer Datos Demo"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
