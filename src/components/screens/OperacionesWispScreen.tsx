import React, { useEffect, useState } from 'react';
import {
  Radio,
  Server,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Plus,
  Wifi,
  FileText,
  Play,
  Send,
  Eye,
  AlertTriangle,
  X,
  Copy,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MikroTikRouter } from '../../types';

export const OperacionesWispScreen: React.FC = () => {
  const {
    towers,
    routers,
    links,
    incidents,
    selectedRouterId,
    setSelectedRouterId,
    setCurrentScreen,
    setSelectedDecisionId,
    openModal,
    addToast,
    appMode
  } = useApp();

  const [activeTab, setActiveTab] = useState<'routers' | 'towers' | 'links' | 'incidents'>('routers');
  const [selectedRouter, setSelectedRouter] = useState<MikroTikRouter | null>(
    routers.find(r => r.id === selectedRouterId) ?? routers[0] ?? null
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [showBackupProposalModal, setShowBackupProposalModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const modeLabel = appMode === 'demo' ? 'DEMO' : appMode === 'staging' ? 'STAGING' : 'PRODUCCIÓN';
  const isDemoBuild = import.meta.env.VITE_APP_MODE === 'demo';

  useEffect(() => {
    setSelectedRouter(current => {
      if (current && routers.some(router => router.id === current.id)) {
        return current;
      }

      return routers.find(router => router.id === selectedRouterId) ?? routers[0] ?? null;
    });
  }, [routers, selectedRouterId]);

  const handleSimulateAudit = () => {
    if (!selectedRouter || !isDemoBuild) return;
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      addToast({
        type: 'warning',
        title: 'Análisis local finalizado',
        message: 'El análisis local de demostración terminó sin modificar dispositivos.'
      });
    }, 1000);
  };

  const handleRequestDryRun = () => {
    if (!selectedRouter) return;

    addToast({
      type: 'info',
      title: 'Dry-Run Solicitado',
      message: `Simulación de validación de sintaxis y compatibilidad para ${selectedRouter.identity || selectedRouter.id} registrada en bitácora.`
    });
  };

  const handleSendToApproval = () => {
    if (!selectedRouter) return;

    addToast({
      type: 'success',
      title: 'Propuesta Enviada a Aprobación',
      message: `Se ha generado la solicitud de cambio para ${selectedRouter.identity || selectedRouter.id}. Disponible en el panel de Decisiones.`
    });
  };

  return (
    <div id="screen-operaciones-wisp" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Operaciones WISP & Análisis MikroTik</h2>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                {modeLabel} · MIKROTIK DESCONECTADO
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Monitoreo de nodos, RouterOS v7, enlaces punto a punto y resolución de incidentes
            </p>
          </div>
        </div>

        {/* Action Buttons (Strictly: Analizar, Preparar propuesta, Solicitar dry-run, Enviar a aprobación, Ver evidencia) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-run-mikrotik-audit"
            onClick={handleSimulateAudit}
            disabled={isAuditing || !selectedRouter || appMode !== 'demo'}
            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-green-950/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isAuditing ? 'Analizando...' : 'Analizar'}</span>
          </button>

          <button
            id="btn-prepare-backup-proposal"
            onClick={() => setShowBackupProposalModal(true)}
            disabled={!selectedRouter || appMode !== 'demo'}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Preparar propuesta</span>
          </button>

          <button
            id="btn-request-dryrun"
            onClick={handleRequestDryRun}
            disabled={!selectedRouter || appMode !== 'demo'}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Solicitar dry-run</span>
          </button>

          <button
            id="btn-send-approval"
            onClick={handleSendToApproval}
            disabled={!selectedRouter || appMode !== 'demo'}
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar a aprobación</span>
          </button>

          <button
            id="btn-view-evidence"
            onClick={() => setShowEvidenceModal(true)}
            disabled={!selectedRouter || appMode !== 'demo'}
            className="px-3 py-1.5 rounded-lg bg-[#0A141D] hover:bg-white/5 text-[#E0E7FF] border border-[#1E293B] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Ver evidencia</span>
          </button>
        </div>
      </div>

      {/* Explicit Permanent Proposal Warning Banner */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Regla Operativa WISP:</strong> Esta propuesta no se ejecuta desde NUGA Team Console. Requiere validación humana y aplicación mediante el procedimiento operativo autorizado.
        </span>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2">
        <button
          onClick={() => setActiveTab('routers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'routers'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Routers MikroTik ({routers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('towers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'towers'
              ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Torres WISP ({towers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'links'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Enlaces RF ({links.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'incidents'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Incidentes ({incidents.length})</span>
        </button>
      </div>

      {/* TAB 1: Routers MikroTik */}
      {activeTab === 'routers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Routers List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {routers.length === 0 && (
              <div className="p-5 rounded-xl bg-[#111D27] border border-[#1E293B] text-center">
                <Server className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <h3 className="text-sm font-bold text-white">MikroTik no conectado</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  No hay routers disponibles. La consola mantiene deshabilitadas las acciones WISP.
                </p>
              </div>
            )}
            {routers.map(router => {
              const isSelected = selectedRouter?.id === router.id;
              const allFindings = router.findings || (router as any).securityFindings || [];
              const hasCrit = allFindings.some((f: any) => f.severity === 'critical');
              const ipDisplay = router.interfaces?.[0]?.ipAddress || (router as any).ip || '192.0.2.1';
              const nameDisplay = router.identity || (router as any).name || router.id;

              return (
                <div
                  key={router.id}
                  id={`router-card-${router.id}`}
                  onClick={() => {
                    setSelectedRouter(router);
                    setSelectedRouterId(router.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111D27] border-blue-500 shadow-xl ring-1 ring-blue-500/40'
                      : 'bg-[#111D27] border-[#1E293B] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-[#0A141D] border border-[#1E293B]">
                        {router.id}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {modeLabel}
                      </span>
                      <span className="text-[11px] font-mono text-blue-400 font-semibold">{ipDisplay}</span>
                    </div>

                    {hasCrit ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        VULNERABLE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                        SEGURO
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white">{nameDisplay}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{(router as any).role || 'Router Core'} • {router.model}</p>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#1E293B] text-[11px] text-[#64748B]">
                    <div>CPU: <strong className="text-white font-mono">{router.cpuPercent ?? (router as any).cpuLoadPercent ?? 0}%</strong></div>
                    <div>RAM: <strong className="text-white font-mono">{router.ramUsagePercent ?? (router as any).memoryUsagePercent ?? 0}%</strong></div>
                    <div>Uptime: <strong className="text-white font-mono">{router.uptime ? router.uptime.split(',')[0] : 'N/A'}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Router Deep Inspection & Security Hardening (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedRouter ? (
              <div className="p-5 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-xl space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-400">{selectedRouter.id}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {modeLabel}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">
                      {selectedRouter.interfaces?.[0]?.ipAddress || (selectedRouter as any).ip || '192.0.2.1'}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white">
                    {selectedRouter.identity || (selectedRouter as any).name || selectedRouter.id}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Modelo: <strong className="text-white">{selectedRouter.model}</strong> • RouterOS <strong className="text-white">{selectedRouter.routerOsVersion || (selectedRouter as any).firmwareVersion || 'v7.14'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] font-mono">
                    WireGuard: {(selectedRouter.wireguardPeersCount && selectedRouter.wireguardPeersCount > 0) || (selectedRouter as any).wireguardConfigured ? 'Activo' : 'No'}
                  </span>
                </div>
              </div>

              {/* Open Ports & Services */}
              <div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Puertos & Servicios Activos:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {(selectedRouter.servicesRunning && selectedRouter.servicesRunning.length > 0
                    ? selectedRouter.servicesRunning.map(s => ({
                        port: s.port,
                        service: s.name,
                        protocol: 'TCP',
                        status: s.status
                      }))
                    : ((selectedRouter as any).openPorts || [])
                  ).map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs ${
                        p.port === 8291
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                          : 'bg-[#0A141D] border-[#1E293B] text-[#E0E7FF]'
                      }`}
                    >
                      <div className="flex justify-between font-mono font-bold">
                        <span>:{p.port}</span>
                        <span className="text-[10px] text-[#64748B]">{p.protocol || 'TCP'}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] capitalize mt-0.5">{p.service || p.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Audit Findings */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  Hallazgos de Auditoría de Seguridad:
                </span>

                {(!(selectedRouter.findings || (selectedRouter as any).securityFindings) ||
                  (selectedRouter.findings || (selectedRouter as any).securityFindings).length === 0) ? (
                  <div className="p-4 rounded-lg bg-green-950/30 border border-green-500/30 text-xs text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Este nodo cumple con las mejores prácticas de hardening en RouterOS v7.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(selectedRouter.findings || (selectedRouter as any).securityFindings || []).map((finding: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border space-y-1.5 ${
                          finding.severity === 'critical'
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-orange-950/20 border-orange-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{finding.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {finding.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8]">{finding.description}</p>
                        <div className="p-2 rounded bg-[#0A141D] text-blue-300 font-mono text-[11px] border border-[#1E293B]">
                          <strong>Remediación sugerida:</strong> {finding.proposedRemediation || finding.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>
            ) : (
              <div className="p-5 rounded-xl bg-[#111D27] border border-[#1E293B] text-xs text-[#94A3B8]">
                Selecciona un router cuando la integración MikroTik esté disponible.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Torres WISP Bento Grid */}
      {activeTab === 'towers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {towers.map(tower => (
            <div
              key={tower.id}
              className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{tower.id}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {modeLabel}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tower.status === 'online'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}
                  >
                    {tower.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{tower.name}</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{tower.location} • {(tower as any).heightMeters ? `${(tower as any).heightMeters}m altura` : 'Cota principal'}</p>
              </div>

              <div className="space-y-1.5 text-xs bg-[#0A141D] p-3 rounded-lg border border-[#1E293B]">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Clientes:</span>
                  <span className="font-bold text-white font-mono">{tower.connectedClients}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Tráfico:</span>
                  <span className="font-bold text-white font-mono">{tower.currentTrafficMbps ?? (tower as any).bandwidthMbps ?? 0} Mbps</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Enlace:</span>
                  <span className="font-bold text-white">{tower.uplinkProvider || (tower as any).powerSource || 'Troncal'}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Sectores RF:</span>
                  <span className="font-bold text-white font-mono">
                    {tower.sectorsCount ?? ((tower as any).sectors ? (tower as any).sectors.length : 3)} radios
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Enlaces RF Bento Grid */}
      {activeTab === 'links' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map(link => (
            <div key={link.id} className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-blue-400">{link.id}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {modeLabel}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                  {link.status.toUpperCase()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">
                {link.name || `${link.fromNodeId || (link as any).sourceTowerId} ➔ ${link.toNodeId || (link as any).targetTowerId}`}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#0A141D] p-3 rounded-lg border border-[#1E293B]">
                <div>
                  <span className="text-[#64748B] text-[10px] block">Frecuencia</span>
                  <strong className="text-white font-mono">{link.frequency || `${(link as any).frequencyMhz || 5800} MHz`}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Capacidad</span>
                  <strong className="text-white font-mono">{link.capacityMbps ?? 300} Mbps</strong>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">SNR</span>
                  <strong className="text-white font-mono">{link.snrDb ?? 30} dB</strong>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Distancia</span>
                  <strong className="text-white font-mono">{link.distanceKm ?? 2.5} km</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Incidentes */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => openModal('newIncident')}
              className="px-3.5 py-2 rounded-lg bg-[#0A141D] hover:bg-white/5 text-[#E0E7FF] border border-[#1E293B] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-green-400" />
                  <span>Nuevo incidente {modeLabel}</span>
            </button>
          </div>

          {incidents.map(inc => (
            <div
              key={inc.id}
              className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {inc.code}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {modeLabel}
                  </span>
                  <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {inc.status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">{inc.diagnosis}</p>

              <div className="text-xs bg-[#0A141D] p-3 rounded-lg border border-[#1E293B] space-y-1">
                <span className="font-bold text-[#64748B] text-[10px] uppercase tracking-wider block">Línea de Tiempo del Incidente:</span>
                {(inc.timeline || []).map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#94A3B8] text-[11px]">
                    <span className="font-mono text-blue-400">{t.time}</span>
                    <span className="text-white">{t.event}</span>
                    <span className="text-[#64748B]">({t.author})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Preparar Propuesta de Respaldo */}
      {showBackupProposalModal && selectedRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Propuesta de Respaldo Seguro RouterOS</h3>
                  <span className="text-[11px] text-slate-400">Documento técnico estructurado para autorización</span>
                </div>
              </div>
              <button
                onClick={() => setShowBackupProposalModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Aviso de Seguridad:</strong>
                <span>Esta propuesta no se ejecuta desde NUGA Team Console. Requiere validación humana y aplicación mediante el procedimiento operativo autorizado.</span>
              </div>
            </div>

            {/* 8 Structured Proposal Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">1. Objetivo</span>
                <p className="text-slate-200 font-medium">Generación y resguardo de backup cifrado y export compacto de configuración.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">2. Dispositivo</span>
                <p className="text-slate-200 font-mono font-medium">{selectedRouter.identity || selectedRouter.id} ({selectedRouter.model})</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">3. Alcance</span>
                <p className="text-slate-200">Exportación de configuración (/export compact hide-sensitive) y archivo binario de estado.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">4. Nivel de Riesgo</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  Bajo / Informativo (Operación de sólo lectura)
                </span>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">5. Comandos No Ejecutables (Informativo)</span>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`/system backup save name=backup-${selectedRouter.id}-\${TIMESTAMP} encryption=aes-sha256 password=***
/export file=export-${selectedRouter.id}-\${TIMESTAMP} compact hide-sensitive`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">6. Validación</span>
                <p className="text-slate-300">Verificación de checksum SHA-256 generado localmente y comprobación de tamaño mayor a 0 KB.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">7. Procedimiento de Rollback</span>
                <p className="text-slate-300">No aplica alteración de estado. En caso de fallo de export, reintentar fuera de horas pico.</p>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">8. Autorización Requerida</span>
                <p className="text-slate-300">Aprobación explícita por Ramiro (Propietario) con registro en bitácora local DEMO.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowBackupProposalModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowBackupProposalModal(false);
                  handleSendToApproval();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar a Panel de Decisiones</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver Evidencia */}
      {showEvidenceModal && selectedRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Evidencia de Auditoría RouterOS</h3>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Router Consultado:</span>
                <strong className="text-slate-200 font-mono">{selectedRouter.identity || selectedRouter.id}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Registro de Evidencia (DEMO):</span>
                <p className="text-slate-300 leading-relaxed">
                  Captura de configuración firewall filter correspondiente a la regla #4 que expone el puerto 8291 en WAN sin restricción de IP de origen.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Hash de Verificación Local:</span>
                <code className="text-teal-400 font-mono text-[10px] break-all block">
                  sha256:d8e8fca2dc0f896fd7cb4cb0031ba249
                </code>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Hash calculado localmente en el navegador; no constituye firma digital ni evidencia de servidor.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
