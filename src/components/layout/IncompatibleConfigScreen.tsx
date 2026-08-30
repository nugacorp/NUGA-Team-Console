import React from 'react';
import { ShieldAlert, AlertOctagon, RefreshCw, Lock } from 'lucide-react';
import { AppMode } from '../../types';

interface IncompatibleConfigProps {
  reason: string;
  frontendMode: AppMode;
  serverMode?: string;
  onRetry?: () => void;
}

export const IncompatibleConfigScreen: React.FC<IncompatibleConfigProps> = ({
  reason,
  frontendMode,
  serverMode,
  onRetry
}) => {
  return (
    <div
      id="incompatible-config-screen"
      className="min-h-screen bg-[#070D12] text-slate-100 flex items-center justify-center p-4 select-none"
    >
      <div className="max-w-lg w-full rounded-2xl bg-[#0F1923] border border-rose-500/40 p-6 sm:p-8 shadow-2xl shadow-rose-950/40 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            Configuración Incompatible
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-3">
            Operaciones Bloqueadas por Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Se ha detectado una discrepancia crítica de entorno entre la aplicación y el servidor backend, o una configuración no permitida.
          </p>
        </div>

        <div className="bg-[#080E14] p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Modo Frontend:</span>
            <span className="text-rose-400 font-bold uppercase">{frontendMode}</span>
          </div>
          {serverMode && (
            <div className="flex justify-between text-slate-400">
              <span>Modo Backend Reportado:</span>
              <span className="text-yellow-400 font-bold uppercase">{serverMode}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 text-slate-300">
            <span className="text-slate-500 block mb-1 font-sans text-[11px] font-semibold">Detalle del Bloqueo:</span>
            <p className="text-rose-300 font-sans text-xs">{reason}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 text-left flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Por directriz de gobernanza, NUGA Team Console no realiza fallback silencioso a datos de demostración en entornos productivos o de laboratorio no sincronizados.
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Verificación de Salud</span>
          </button>
        )}
      </div>
    </div>
  );
};
