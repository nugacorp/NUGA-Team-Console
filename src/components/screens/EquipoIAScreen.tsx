import React, { useEffect, useState } from 'react';
import {
  Bot,
  Shield,
  Sliders,
  MessageSquare,
  Wrench,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  Zap,
  Radio,
  Briefcase,
  Code2,
  ExternalLink,
  Camera,
  LoaderCircle,
  UserRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentProfile, AgentRole } from '../../types';

export const EquipoIAScreen: React.FC = () => {
  const { agents, updateAgent, setCurrentScreen, setSelectedAgentId, conversations, appMode } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(agents[0] ?? null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(selectedAgent?.systemInstructions ?? '');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const modeLabel = appMode === 'demo' ? 'DEMO' : appMode === 'staging' ? 'STAGING' : 'PRODUCCIÓN';

  useEffect(() => {
    setSelectedAgent(current => {
      if (current && agents.some(agent => agent.id === current.id)) {
        return current;
      }

      const next = agents[0] ?? null;
      setCustomPrompt(next?.systemInstructions ?? '');
      return next;
    });
  }, [agents]);

  const handleSelectAgent = (agent: AgentProfile) => {
    setSelectedAgent(agent);
    setCustomPrompt(agent.systemInstructions);
    setIsEditingPrompt(false);
  };

  const handleSavePrompt = async () => {
    if (!selectedAgent) return;

    const saved = await updateAgent(selectedAgent.id, { systemInstructions: customPrompt });
    if (saved) {
      setIsEditingPrompt(false);
      setSelectedAgent(prev => prev ? { ...prev, systemInstructions: customPrompt } : null);
    }
  };

  const handleAutonomyChange = async (level: AgentProfile['autonomyLevel']) => {
    if (!selectedAgent) return;

    const saved = await updateAgent(selectedAgent.id, { autonomyLevel: level });
    if (saved) setSelectedAgent(prev => prev ? { ...prev, autonomyLevel: level } : null);
  };

  const resizeAvatar = (file: File): Promise<string> => new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      reject(new Error('Selecciona una imagen PNG, JPEG o WebP.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('La imagen original no debe exceder 8 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No fue posible leer la imagen.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
      image.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('El navegador no pudo procesar la imagen.'));
          return;
        }
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;
        context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        const result = canvas.toDataURL('image/webp', 0.82);
        if (result.length > 180_000) {
          reject(new Error('La imagen procesada excede el límite permitido.'));
          return;
        }
        resolve(result);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  const handleAvatarFile = async (file?: File) => {
    if (!selectedAgent || !file) return;
    setSavingAvatar(true);
    try {
      const avatar = await resizeAvatar(file);
      const saved = await updateAgent(selectedAgent.id, { avatar });
      if (saved) setSelectedAgent(current => current ? { ...current, avatar } : null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No fue posible procesar la imagen.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const renderAvatar = (agent: AgentProfile, className: string) => agent.avatar ? (
    <img
      src={agent.avatar}
      alt={agent.name}
      className={className}
      onError={event => {
        event.currentTarget.style.display = 'none';
        event.currentTarget.nextElementSibling?.classList.remove('hidden');
      }}
    />
  ) : null;

  return (
    <div id="screen-equipo-ia" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Organigram & Structure Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Organigrama de los 5 Perfiles del Equipo</h2>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono font-bold text-sky-400">
                  {modeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Estructura de coordinación, perfiles del equipo, límites de autonomía y permisos del entorno {modeLabel.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              {agents.length} perfiles del equipo · {modeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Organigram Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {(agents || []).map(agent => {
          const isSelected = selectedAgent?.id === agent.id;
          const isDirector = agent.id === 'director';

          return (
            <div
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-sky-500 shadow-xl shadow-sky-950/40 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="relative w-11 h-11 shrink-0">
                    {renderAvatar(agent, 'absolute inset-0 w-11 h-11 rounded-xl object-cover ring-2 ring-slate-700')}
                    <div className={`w-11 h-11 rounded-xl bg-sky-500/15 text-sky-300 ring-2 ring-slate-700 flex items-center justify-center font-bold ${agent.avatar ? 'hidden' : ''}`}>
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDirector
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isDirector ? 'COORDINADOR' : 'PERFIL'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{agent.name}</h3>
                <p className="text-xs text-sky-400 font-medium line-clamp-1 mt-0.5">{agent.roleTitle}</p>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {agent.responsibilities?.[0] || agent.department}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">{agent.model ? agent.model.split('/')[0].trim() : 'Hermes'} · {modeLabel}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    agent.status === 'active'
                      ? 'bg-emerald-400'
                      : agent.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                  title={agent.status}
                />
              </div>
            </div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <Bot className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-100">Perfiles no disponibles</h3>
          <p className="text-xs text-slate-400 mt-1">
            Hermes no entregó perfiles del equipo. La consola continuará en modo seguro.
          </p>
        </div>
      )}

      {/* Selected Agent Detailed Inspector */}
      {selectedAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Responsibilities, Scopes, Tools (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 shrink-0 group">
                    {renderAvatar(selectedAgent, 'absolute inset-0 w-14 h-14 rounded-2xl object-cover ring-2 ring-sky-500/40')}
                    <div className={`w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-300 ring-2 ring-sky-500/40 flex items-center justify-center font-bold ${selectedAgent.avatar ? 'hidden' : ''}`}>
                      <UserRound className="w-6 h-6" />
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg" title="Cambiar foto">
                      {savingAvatar ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={savingAvatar}
                        onChange={event => {
                          void handleAvatarFile(event.target.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-100">{selectedAgent.name}</h3>
                    <p className="text-xs text-sky-400 font-semibold">{selectedAgent.roleTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Motor: {selectedAgent.model}</p>
                  </div>
                </div>

                <button
                  id="btn-chat-with-agent"
                  onClick={() => {
                    setSelectedAgentId(selectedAgent.id);
                    setCurrentScreen('conversaciones');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Chat Directo</span>
                </button>
              </div>

              {/* Objectives and Mission */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Objetivo & Misión:</span>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60">
                  {selectedAgent.systemInstructions}
                </p>
              </div>

              {/* Key Responsibilities */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Responsabilidades Principales:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {(selectedAgent.responsibilities || []).map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowed Scopes & Sandbox Rules */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Límites & Políticas de Seguridad:</span>
                <div className="flex flex-col gap-2 mt-2">
                  {(selectedAgent.limits || []).map((limit, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 text-xs flex items-start gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{limit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools permitted */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  Herramientas Asignadas (Sandbox & MCP):
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedAgent.allowedTools || []).map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-300 text-xs font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* Right Col: Autonomy Controls & System Prompt Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Autonomy Level Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                Nivel de Autonomía Operativa
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Define el grado de libertad del agente antes de requerir confirmación humana obligatoria.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAutonomyChange('supervisado')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                  selectedAgent.autonomyLevel === 'supervisado'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>1. Supervisión Total (Recomendado)</span>
                  {selectedAgent.autonomyLevel === 'supervisado' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Todas las acciones de lectura y escritura pasan por la bandeja de decisiones de Ramiro.
                </p>
              </button>

              <button
                onClick={() => handleAutonomyChange('semi-autonomo')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                  selectedAgent.autonomyLevel === 'semi-autonomo'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-200 ring-1 ring-sky-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>2. Semi-Autónomo (Autonomía Media)</span>
                  {selectedAgent.autonomyLevel === 'semi-autonomo' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Acciones de bajo riesgo y lectura automática. Solo acciones críticas requieren confirmación.
                </p>
              </button>

              <button
                onClick={() => handleAutonomyChange('autonomo')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                  selectedAgent.autonomyLevel === 'autonomo'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>3. Autónomo (Modo Laboratorio)</span>
                  {selectedAgent.autonomyLevel === 'autonomo' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ejecución autónoma en sandbox con registro continuo en bitácora de auditoría.
                </p>
              </button>
            </div>
          </div>

          {/* System Prompt & Instructions Editor */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-sky-400" />
                  Instrucciones del Sistema (System Prompt)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Comportamiento base del agente</p>
              </div>

              {!isEditingPrompt ? (
                <button
                  onClick={() => setIsEditingPrompt(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs transition-colors"
                >
                  Editar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingPrompt(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Guardar
                  </button>
                </div>
              )}
            </div>

            {isEditingPrompt ? (
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={8}
                className="w-full p-3 rounded-xl bg-slate-950 border border-sky-500/50 text-slate-200 font-mono text-xs focus:outline-none custom-scrollbar"
              />
            ) : (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 custom-scrollbar">
                {selectedAgent.systemInstructions}
              </pre>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
