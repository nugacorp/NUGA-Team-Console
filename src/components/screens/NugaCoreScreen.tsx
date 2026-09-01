import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Code2, RefreshCw, ServerOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NugaCoreOverview {
  systemHealth: number;
  activePipelines: number;
  openPullRequests: number;
  testCoveragePercent: number;
  lastDeployment: string;
  codeSmellsCount: number;
}

type OverviewState =
  | { status: 'loading' }
  | { status: 'available'; data: NugaCoreOverview }
  | { status: 'unavailable'; message: string };

export const NugaCoreScreen: React.FC = () => {
  const { appMode, providers, serverStatus } = useApp();
  const [overview, setOverview] = useState<OverviewState>({ status: 'loading' });

  const loadOverview = useCallback(async () => {
    if (appMode === 'demo') {
      setOverview({ status: 'unavailable', message: 'NugaCore no se consulta en modo DEMO.' });
      return;
    }

    setOverview({ status: 'loading' });
    const result = await providers.nugaCore.getArchitectureOverview();
    if (result.status === 'success' && result.data) {
      setOverview({ status: 'available', data: result.data });
      return;
    }

    setOverview({
      status: 'unavailable',
      message: result.error || 'NugaCore no está conectado a esta consola.'
    });
  }, [appMode, providers]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <div id="screen-nugacore" className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">NugaCore</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-400 uppercase">
                {appMode}
              </span>
            </div>
            <p className="text-xs text-slate-400">Información obtenida exclusivamente desde el endpoint real de NugaCore</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={overview.status === 'loading'}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${overview.status === 'loading' ? 'animate-spin' : ''}`} />
          Actualizar datos reales
        </button>
      </div>

      {overview.status === 'loading' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-sm text-slate-300">
          Consultando NugaCore…
        </div>
      )}

      {overview.status === 'unavailable' && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-amber-500/30 text-center space-y-3">
          <ServerOff className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">NugaCore no conectado</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">{overview.message}</p>
          <p className="text-xs text-amber-300 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            No se muestran métricas, pruebas, cobertura ni módulos simulados.
          </p>
        </div>
      )}

      {overview.status === 'available' && (
        <>
          <div className="flex items-center gap-2 text-xs text-emerald-300 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="w-4 h-4" />
            Datos recibidos del backend NugaCore. Integración declarada: {serverStatus?.integrations.nugacore ? 'activa' : 'no declarada'}.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ['Salud del sistema', `${overview.data.systemHealth}%`],
              ['Pipelines activos', String(overview.data.activePipelines)],
              ['Pull requests abiertos', String(overview.data.openPullRequests)],
              ['Cobertura reportada', `${overview.data.testCoveragePercent}%`],
              ['Problemas de código', String(overview.data.codeSmellsCount)],
              ['Último despliegue', overview.data.lastDeployment]
            ].map(([label, value]) => (
              <div key={label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
                <p className="text-xl font-extrabold text-slate-100 mt-2 break-words">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
