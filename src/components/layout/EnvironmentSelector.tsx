import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Activity,
  Server
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppMode } from '../../types';

export const EnvironmentSelector: React.FC = () => {
  const {
    appMode,
    appConfig,
    serverStatus,
    capabilities,
    user,
    demoDataset,
    setDemoDataset,
    addToast
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only render for admin or owner users
  if (user.role !== 'admin' && user.role !== 'owner') {
    return null;
  }

  const isProduction = appMode === 'production';
  const isStaging = appMode === 'staging';
  const isDemo = appMode === 'demo';

  const badgeColors: Record<AppMode, { bg: string; text: string; border: string; label: string }> = {
    demo: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      label: 'DEMO'
    },
    staging: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      label: 'STAGING'
    },
    production: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      label: 'PRODUCCIÓN'
    }
  };

  const currentBadge = badgeColors[appMode] || badgeColors.demo;

  const demoDatasets = [
    { id: 'standard', name: 'Conjunto Base Estándar', desc: '5 perfiles, 6 tareas, 4 decisiones equilibradas' },
    { id: 'wisp_crisis', name: 'Escenario: Incidente Crítico WISP', desc: 'Simulación de saturación de enlace en Torre Norte' },
    { id: 'marketing_launch', name: 'Escenario: Lanzamiento Campaña', desc: 'Campaña multimedia activa con revisión de guiones' }
  ];

  const handleSelectDataset = (id: string, name: string) => {
    setDemoDataset(id);
    setIsOpen(false);
    addToast({
      title: 'Conjunto DEMO Seleccionado',
      message: `Visualizando "${name}". Este cambio es estrictamente visual y local.`,
      type: 'info'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="environment-selector-btn"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
        title={`Entorno activo: ${currentBadge.label}`}
        aria-label={`Entorno activo: ${currentBadge.label}`}
      >
        {isProduction ? (
          <Lock className="w-3.5 h-3.5 text-rose-400" />
        ) : isStaging ? (
          <Server className="w-3.5 h-3.5 text-yellow-400" />
        ) : (
          <Layers className="w-3.5 h-3.5 text-orange-400" />
        )}
        <span>{currentBadge.label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div
          id="environment-selector-dropdown"
          className="absolute right-0 mt-2 w-84 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-2xl shadow-black/90 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">Selector de Entorno</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}>
              {currentBadge.label}
            </span>
          </div>

          {/* Mode Explanation Banner */}
          <div className="p-2.5 rounded-lg bg-[#0A141D] border border-[#1E293B] space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Aviso de Entorno</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {isDemo && 'Entorno local de demostración. Ninguna acción modifica sistemas reales.'}
              {isStaging && 'Entorno de pruebas conectado exclusivamente a recursos no productivos.'}
              {isProduction && 'Entorno productivo. Las operaciones requieren autorización y trazabilidad.'}
            </p>
          </div>

          {/* Production Lock Notice */}
          {isProduction && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Modo PRODUCCIÓN Bloqueado</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-snug">
                El modo producción no puede ser desactivado, alternado ni sustituido por datos simulados desde la interfaz de usuario.
              </p>
            </div>
          )}

          {/* Staging Notice */}
          {isStaging && (
            <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 space-y-1">
              <span className="font-bold block">Conexión a Staging</span>
              <p className="text-[11px] text-yellow-300/80">
                Backend de laboratorio configurado en: <code className="text-white font-mono">{appConfig.apiUrl}</code>
              </p>
            </div>
          )}

          {/* Demo Scenario Switcher (Only in Demo Mode) */}
          {isDemo && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                  Conjuntos de Datos DEMO:
                </span>
                <span className="text-[10px] text-orange-400 font-mono">Solo Visual/Local</span>
              </div>

              <div className="space-y-1.5">
                {demoDatasets.map(ds => {
                  const isSelected = demoDataset === ds.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => handleSelectDataset(ds.id, ds.name)}
                      className={`w-full p-2 rounded-lg text-left transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500/15 border border-orange-500/40 text-white'
                          : 'bg-[#0A141D] hover:bg-[#1E293B] border border-transparent text-[#94A3B8]'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-xs text-white">{ds.name}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{ds.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Backend Status Summary */}
          <div className="pt-2 border-t border-[#1E293B] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Servidor: <strong className="text-[#94A3B8]">{serverStatus?.source === 'server' ? 'Remoto' : 'Local'}</strong></span>
            <span>Escrituras: <strong className={serverStatus?.writesEnabled ? 'text-emerald-400' : 'text-[#94A3B8]'}>{serverStatus?.writesEnabled ? 'Habilitadas' : 'Deshabilitadas'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
