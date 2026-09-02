import React, { useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';

export const ProyectosScreen: React.FC = () => {
  const {
    projects,
    tasks,
    deliverables,
    setCurrentScreen,
    setSelectedTaskId,
    setSelectedDeliverableId,
    openModal,
    appMode
  } = useApp();

  const [selectedProjectIdLocal, setSelectedProjectIdLocal] = useState<string>(() => projects[0]?.id || 'proj-wisp-expansion');
  const selectedProject = projects.find(p => p.id === selectedProjectIdLocal) || projects[0];

  return (
    <div id="screen-proyectos" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Proyectos Estratégicos & Roadmaps</h2>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono font-bold text-sky-400">
                {appMode.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Iniciativas de infraestructura WISP, ingeniería NugaCore, marketing y control administrativo
            </p>
          </div>
        </div>

        <button
          onClick={() => openModal('newProject')}
          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Project Cards Selector */}
      {projects.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-sky-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-100">Aún no hay proyectos</h3>
          <p className="mt-2 text-xs text-slate-400">Crea el primer proyecto real; quedará persistido en Supabase y registrado en auditoría.</p>
          <button onClick={() => openModal('newProject')} className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400">
            Crear primer proyecto
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(projects || []).map(project => {
          const isSelected = selectedProject?.id === project.id;
          const projectTasks = (tasks || []).filter(t => t.projectId === project.id);
          const completedCount = projectTasks.filter(t => t.status === 'done').length;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProjectIdLocal(project.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-sky-500 shadow-lg ring-1 ring-sky-500/40'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {project.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {project.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{project.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {project.objective}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Progreso:</span>
                  <span className="font-bold text-slate-200">{project.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>{completedCount}/{projectTasks.length} tareas</span>
                  <span>{project.targetEndDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Full Details */}
      {selectedProject && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-sky-400">{selectedProject.code}</span>
                <span className="text-xs text-slate-400">Responsable: <strong className="text-slate-200">{selectedProject.owner}</strong></span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-100">{selectedProject.name}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">{selectedProject.objective}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Presupuesto Estimado</span>
                <span className="text-sm font-bold text-slate-100">${(selectedProject.budgetEstimateUsd || 0).toLocaleString()} USD</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Progreso</span>
                <span className="text-sm font-bold text-emerald-400">{selectedProject.progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Milestones and Risk Matrix in 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Milestones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                Hitos Estratégicos (Milestones):
              </h4>
              <div className="space-y-2">
                {(selectedProject.milestones || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.completed
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-200">{m.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{m.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Matriz de Riesgos & Mitigaciones:
              </h4>
              <div className="space-y-2">
                {(selectedProject.risks || []).map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{r.description}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          r.level === 'high' || r.level === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      <strong className="text-sky-400">Mitigación:</strong> {r.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
