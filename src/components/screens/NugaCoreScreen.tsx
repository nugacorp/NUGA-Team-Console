import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  Play,
  FileCode,
  GitBranch,
  Layers,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NugaCoreScreen: React.FC = () => {
  const { openModal, addToast } = useApp();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsRunningTests(false);
      setTestOutput(`✓ storageService.test.ts (18 tests) - 14ms
✓ routerOsAdapter.test.ts (24 tests) - 32ms
✓ decisionGovernance.test.ts (36 tests) - 45ms
✓ multiAgentOrchestrator.test.ts (42 tests) - 88ms
✓ auditTrailImmutability.test.ts (22 tests) - 19ms

Test Suites: 5 passed, 5 total
Tests:       142 passed, 142 total
Snapshots:   0 total
Time:        4.218 s
Coverage:    92.4% Lines (88.1% Branches)
Ran all test suites in sandbox environment.`);
      addToast({
        type: 'success',
        title: 'Suite CI/CD Exitosa',
        message: '142 pruebas ejecutadas con 100% de éxito en 4.2 segundos.'
      });
    }, 1500);
  };

  const modules = [
    { name: 'Adapter MikroTik v7 (ROS API/SSH)', status: 'operational', version: 'v2.1.0', files: 8, coverage: '94%' },
    { name: 'Local Persistence Engine (StorageService)', status: 'operational', version: 'v1.4.0', files: 4, coverage: '98%' },
    { name: 'Decision & Governance Enforcement', status: 'operational', version: 'v1.2.0', files: 6, coverage: '96%' },
    { name: 'Multi-Agent Orchestrator & Dispatcher', status: 'operational', version: 'v2.4.0', files: 12, coverage: '91%' },
    { name: 'Media Asset Pipeline (Higgsfield Mock)', status: 'operational', version: 'v1.0.0', files: 4, coverage: '82%' }
  ];

  return (
    <div id="screen-nugacore" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Ingeniería NugaCore & CI/CD</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-400">
                DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Arquitectura desacoplada, suite de pruebas, salud de código y adaptadores de infraestructura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-run-ci-tests"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{isRunningTests ? 'Ejecutando Pruebas...' : 'Ejecutar Suite CI/CD'}</span>
          </button>

          <button
            onClick={() => openModal('newTask', { projectId: 'proj-nugacore-refactor' })}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Nueva Tarea de Código</span>
          </button>
        </div>
      </div>

      {/* CI/CD Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pruebas Unitarias</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">DEMO</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-emerald-400">142/142</span>
            <span className="text-xs text-slate-400">Simulación Sandbox</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Cobertura Simulada</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">DEMO</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-sky-400">92.4%</span>
            <span className="text-xs text-slate-400">Métrica Proyectada</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Errores TypeScript</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">REAL</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-100">0</span>
            <span className="text-xs text-emerald-400 font-bold">Modo Estricto</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Desacoplamiento</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">DEMO</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-purple-400">100%</span>
            <span className="text-xs text-slate-400">Capa StorageService</span>
          </div>
        </div>
      </div>

      {/* Test Output Terminal (if run) */}
      {testOutput && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">Terminal CI/CD Runner</span>
            <span>Salida en vivo</span>
          </div>
          <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            {testOutput}
          </pre>
        </div>
      )}

      {/* Core Architectural Modules */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Módulos de Arquitectura NugaCore
        </h3>

        <div className="space-y-2.5">
          {modules.map((mod, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-bold text-slate-200">{mod.name}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{mod.files} archivos • Versión {mod.version}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-300 font-mono">Cobertura: {mod.coverage}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {mod.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
