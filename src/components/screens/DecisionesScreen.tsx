import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  FileCode,
  Search,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Check,
  Info,
  Layers,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DecisionesScreen: React.FC = () => {
  const {
    decisions,
    selectedDecisionId,
    setSelectedDecisionId,
    executeDecisionAction,
    openModal
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected decision for deep inspection
  const activeDecision = decisions.find(d => d.id === selectedDecisionId) || decisions[0];

  const filteredDecisions = decisions.filter(d => {
    if (filterStatus === 'pending' && d.status !== 'pending') return false;
    if (filterStatus === 'approved' && d.status !== 'approved') return false;
    if (filterStatus === 'rejected' && d.status !== 'rejected') return false;
    if (filterStatus === 'simulated' && d.status !== 'simulated') return false;

    if (filterRisk !== 'all' && d.risk !== filterRisk) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.situation.toLowerCase().includes(q) ||
        d.specialist.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="screen-decisiones" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Header bar & Filter controls Bento Tile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bandeja de Decisiones Ejecutivas</h2>
            <p className="text-xs text-[#94A3B8]">
              Control de gobernanza humana para acciones operativas, técnicas y de infraestructura
            </p>
          </div>
        </div>

        {/* Filter pills & search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filtrar decisiones..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-hidden focus:border-blue-500 w-40 sm:w-48 placeholder:text-[#64748B]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes ({decisions.filter(d => d.status === 'pending').length})</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="simulated">Simuladas (Dry-run)</option>
          </select>

          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Cualquier Riesgo</option>
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Decision List on Left, Active Decision Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Decision Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#111D27] border border-[#1E293B] text-[#64748B] text-xs">
              No hay decisiones que coincidan con los filtros seleccionados.
            </div>
          ) : (
            filteredDecisions.map(decision => {
              const isSelected = activeDecision?.id === decision.id;
              const isCrit = decision.risk === 'critical';
              const isHigh = decision.risk === 'high';

              return (
                <div
                  key={decision.id}
                  id={`decision-card-${decision.id}`}
                  onClick={() => setSelectedDecisionId(decision.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111D27] border-blue-500 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/40'
                      : 'bg-[#111D27] border-[#1E293B] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#E0E7FF] px-2 py-0.5 rounded bg-[#0A141D] border border-[#1E293B]">
                        {decision.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {decision.risk.toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        decision.status === 'pending'
                          ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          : decision.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : decision.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {decision.status === 'pending'
                        ? 'Pendiente'
                        : decision.status === 'approved'
                        ? 'Aprobada'
                        : decision.status === 'rejected'
                        ? 'Rechazada'
                        : decision.status === 'simulated'
                        ? 'Simulada'
                        : 'En Revisión'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{decision.title}</h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1 leading-relaxed">{decision.situation}</p>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-3 pt-2.5 border-t border-[#1E293B]">
                    <span>Especialista: <strong className="text-[#E0E7FF] capitalize">{decision.specialist}</strong></span>
                    <span className="text-[10px] text-orange-400 font-mono">Plazo: {decision.deadline}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Deep Inspection & Action Center (7 cols) */}
        {activeDecision ? (
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-xl space-y-5">
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400 px-2.5 py-1 rounded bg-[#0A141D] border border-blue-500/30">
                      {activeDecision.code}
                    </span>
                    <span className="text-xs text-[#64748B]">Creada: {activeDecision.createdAt}</span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      activeDecision.status === 'pending'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse'
                        : activeDecision.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : activeDecision.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    Estado: {activeDecision.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white">{activeDecision.title}</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Especialista: <strong className="text-white capitalize">{activeDecision.specialist}</strong> • Prioridad: <strong className="text-white uppercase">{activeDecision.priority}</strong> • Riesgo: <strong className="text-orange-400 uppercase">{activeDecision.risk}</strong>
                </p>
              </div>

              {/* 1. Situation & Evidence */}
              <div className="space-y-3 text-xs bg-[#0A141D] p-4 rounded-xl border border-[#1E293B]">
                <div>
                  <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Situación Detectada:
                  </span>
                  <p className="text-[#E0E7FF] mt-1 leading-relaxed">{activeDecision.situation}</p>
                </div>
                {activeDecision.evidence && (
                  <div className="pt-2 border-t border-[#1E293B]">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      Evidencia Técnica / Métricas:
                    </span>
                    <p className="text-[#94A3B8] mt-1 leading-relaxed">{activeDecision.evidence}</p>
                  </div>
                )}
              </div>

              {/* 2. Impact & Scope */}
              <div className="p-3.5 rounded-xl bg-[#0A141D] border border-[#1E293B] text-xs">
                <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Impacto en Red & Operaciones:
                </span>
                <p className="text-[#E0E7FF] mt-1 leading-relaxed">{activeDecision.impact}</p>
                <div className="mt-2 text-[11px] text-[#64748B]">
                  Alcance Afectado: <strong className="text-white">{activeDecision.affectedScope}</strong>
                </div>
              </div>

              {/* 3. Risk of Action vs Risk of Inaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/40">
                  <span className="font-bold text-orange-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Riesgo de Actuar:
                  </span>
                  <p className="text-[#E0E7FF] font-medium mt-1 leading-relaxed">{activeDecision.riskOfAction}</p>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/40">
                  <span className="font-bold text-rose-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 shrink-0" />
                    Riesgo de No Actuar:
                  </span>
                  <p className="text-[#E0E7FF] font-medium mt-1 leading-relaxed">{activeDecision.riskOfInaction}</p>
                </div>
              </div>

              {/* 4. Proposal & Diff */}
              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-lg bg-[#0A141D] border border-[#1E293B]">
                  <span className="font-bold text-blue-400 text-[10px] uppercase tracking-wider block mb-1">
                    Propuesta de Modificación:
                  </span>
                  <p className="text-[#E0E7FF] leading-relaxed">{activeDecision.proposal}</p>
                </div>

                {activeDecision.exactChangeDiff && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#E0E7FF] flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      Diff Exacto de Configuración / Script RouterOS:
                    </span>
                    <pre className="p-3.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-blue-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-40 custom-scrollbar">
                      {activeDecision.exactChangeDiff}
                    </pre>
                  </div>
                )}
              </div>

              {/* 5. Rollback Plan */}
              <div className="p-3 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs">
                <span className="font-bold text-rose-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Plan de Rollback Automático / Safe-Mode:
                </span>
                <p className="text-[#94A3B8] leading-relaxed font-mono text-[11px]">
                  {activeDecision.rollbackPlan}
                </p>
              </div>

              {/* Action Buttons for Ramiro with Modal triggers */}
              <div className="pt-3 border-t border-[#1E293B]">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                  Acciones Ejecutivas de Gobernanza (Ramiro):
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {/* Primary Approve Button (opens reinforced confirmation modal) */}
                  <button
                    id="btn-approve-decision"
                    onClick={() => openModal('decisionDetail', { decisionId: activeDecision.id, defaultTab: 'approve' })}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Decisión</span>
                  </button>

                  {/* Reject Button (opens reinforced confirmation modal) */}
                  <button
                    id="btn-reject-decision"
                    onClick={() => openModal('decisionDetail', { decisionId: activeDecision.id, defaultTab: 'reject' })}
                    className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>

                  {/* Simulate / Dry-run */}
                  <button
                    id="btn-simulate-decision"
                    onClick={() => openModal('decisionDetail', { decisionId: activeDecision.id, defaultTab: 'simulate' })}
                    className="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Simular Dry-run</span>
                  </button>

                  {/* Request Info */}
                  <button
                    id="btn-request-info-decision"
                    onClick={() => openModal('decisionDetail', { decisionId: activeDecision.id, defaultTab: 'info' })}
                    className="px-3.5 py-2 rounded-lg bg-[#0A141D] hover:bg-white/5 text-[#94A3B8] hover:text-white border border-[#1E293B] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Pedir Información</span>
                  </button>

                  {/* Postpone */}
                  <button
                    id="btn-postpone-decision"
                    onClick={() => {
                      executeDecisionAction(activeDecision.id, 'postpone', 'Pospuesta para siguiente sesión ejecutiva.');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#0A141D] hover:bg-white/5 text-[#64748B] hover:text-[#94A3B8] border border-[#1E293B] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Posponer</span>
                  </button>
                </div>
              </div>

              {/* Decision History Log */}
              {activeDecision.history && activeDecision.history.length > 0 && (
                <div className="pt-3 border-t border-[#1E293B] space-y-2">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Historial de Gobernanza:</span>
                  <div className="space-y-2">
                    {activeDecision.history.map(h => (
                      <div key={h.id} className="p-2.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                          <span className="font-semibold text-white">{h.user}</span>
                          <span className="font-mono">{h.timestamp}</span>
                        </div>
                        <p className="text-blue-400 font-medium">{h.action}</p>
                        {h.comment && <p className="text-[#94A3B8] text-[11px]">{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
