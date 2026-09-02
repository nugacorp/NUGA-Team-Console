import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  User,
  Bot,
  Activity,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditEvent } from '../../types';

export const AuditoriaScreen: React.FC = () => {
  const { auditEvents, addToast, appMode } = useApp();
  const isDemo = appMode === 'demo';

  const [filterActor, setFilterActor] = useState<string>('all');
  const [filterActionType, setFilterActionType] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  const filteredEvents = auditEvents.filter(evt => {
    if (filterActor !== 'all' && evt.actorType !== filterActor) return false;
    if (filterActionType !== 'all' && evt.actionType !== filterActionType) return false;
    if (filterRisk !== 'all' && evt.risk !== filterRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.action.toLowerCase().includes(q) ||
        evt.actorName.toLowerCase().includes(q) ||
        evt.humanExplanation.toLowerCase().includes(q) ||
        evt.resourceLabel.toLowerCase().includes(q) ||
        evt.correlationId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const togglePayload = (id: string) => {
    setExpandedPayloads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    if (filteredEvents.length === 0) return;

    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nuga-auditoria-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Exportación de Auditoría',
      message: `${filteredEvents.length} eventos descargados en formato JSON.`
    });
  };

  return (
    <div id="screen-auditoria" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Bitácora de Auditoría del Sistema</h2>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">{appMode.toUpperCase()}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isDemo ? 'Bitácora local de demostración.' : 'Eventos de auditoría recibidos desde la API de NUGA. No se fabrican eventos ausentes.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredEvents.length === 0}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Exportar Bitácora (JSON)</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por correlación, acción, actor..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-44 sm:w-64"
            />
          </div>

          <select
            value={filterActor}
            onChange={e => setFilterActor(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todos los Actores</option>
            <option value="user">Ramiro (Propietario)</option>
            <option value="agent">Especialistas IA</option>
            <option value="system">Sistema Hermes</option>
          </select>

          <select
            value={filterActionType}
            onChange={e => setFilterActionType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todos los Tipos de Acción</option>
            <option value="requested">Solicitadas</option>
            <option value="approved">Aprobadas</option>
            <option value="executed">Ejecutadas</option>
            <option value="reverted">Revertidas / Rechazadas</option>
          </select>

          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Cualquier Nivel de Riesgo</option>
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Mostrando <strong className="text-slate-200">{filteredEvents.length}</strong> eventos
        </span>
      </div>

      {/* Events Timeline / Feed */}
      <div className="space-y-3">
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <ScrollText className="mx-auto h-7 w-7 text-slate-500" />
            <h3 className="mt-3 text-sm font-bold text-slate-200">Aún no hay eventos de auditoría</h3>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-400">
              La bitácora se genera automáticamente cuando se crean o modifican registros reales. No se permite fabricar eventos manualmente.
            </p>
          </div>
        )}
        {filteredEvents.map(evt => {
          const isUser = evt.actorType === 'user';
          const isCrit = evt.risk === 'critical';
          const isHigh = evt.risk === 'high';
          const isExpanded = !!expandedPayloads[evt.id];

          return (
            <div
              key={evt.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2.5 hover:border-slate-700 transition-all"
            >
              {/* Event Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isUser
                        ? 'bg-sky-500/20 text-sky-400'
                        : evt.actorType === 'agent'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-100">{evt.actorName}</span>
                    <span className="text-xs text-slate-400 mx-2">•</span>
                    <span className="text-xs font-mono text-sky-400">{evt.correlationId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {evt.mode?.toUpperCase() || appMode.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      evt.actionType === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : evt.actionType === 'reverted'
                        ? 'bg-rose-500/20 text-rose-300'
                        : evt.actionType === 'requested'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {evt.actionType.toUpperCase()}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">{evt.timestamp}</span>
                </div>
              </div>

              {/* Action Title & Human Explanation */}
              <div className="pl-9 space-y-1">
                <h4 className="text-xs font-bold text-slate-200">{evt.action}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.humanExplanation}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span>Recurso: <strong className="text-slate-300">{evt.resourceLabel}</strong></span>
                  <span>•</span>
                  <span>Impacto: <strong className="text-slate-300">{evt.scopeImpact}</strong></span>
                </div>
              </div>

              {/* JSON Payload Accordion */}
              {evt.jsonPayload && (
                <div className="pl-9 pt-1">
                  <button
                    onClick={() => togglePayload(evt.id)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{isExpanded ? 'Ocultar Carga JSON' : 'Ver Carga JSON / Telemetría'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </button>

                  {isExpanded && (
                    <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(evt.jsonPayload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
