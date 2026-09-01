import React, { useEffect, useState } from 'react';
import {
  KanbanSquare,
  List,
  Plus,
  Search,
  ShieldAlert,
  Send,
  MessageSquare,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus } from '../../types';

export const TareasScreen: React.FC = () => {
  const {
    tasks,
    updateTask,
    addTaskComment,
    selectedTaskId,
    setSelectedTaskId,
    projects,
    agents,
    appMode,
    openModal,
    loadTaskDetail,
    taskDetailLoading,
    taskDetailError
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');

  const activeTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  useEffect(() => {
    if (appMode !== 'demo' && !selectedTaskId && tasks[0]) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [appMode, selectedTaskId, setSelectedTaskId, tasks]);

  useEffect(() => {
    if (appMode !== 'demo' && selectedTaskId) {
      void loadTaskDetail(selectedTaskId);
    }
  }, [appMode, loadTaskDetail, selectedTaskId]);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog / Plan', color: 'border-[#1E293B]' },
    { id: 'ready', label: 'Listas', color: 'border-blue-500/40' },
    { id: 'in_progress', label: 'En Progreso', color: 'border-orange-500/40' },
    { id: 'blocked', label: 'Bloqueadas', color: 'border-rose-500/40' },
    { id: 'review', label: 'En Revisión', color: 'border-purple-500/40' },
    { id: 'done', label: 'Completadas', color: 'border-green-500/40' }
  ];

  const filteredTasks = tasks.filter(t => {
    if (filterProject !== 'all' && t.projectId !== filterProject) return false;
    if (filterAgent !== 'all' && t.assignedAgent !== filterAgent) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !activeTask) return;
    addTaskComment(activeTask.id, commentInput);
    setCommentInput('');
  };

  return (
    <div id="screen-tareas" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <KanbanSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Tablero de Tareas & Operaciones</h2>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono font-bold text-blue-400">
                {appMode === 'demo' ? 'DEMO' : 'HERMES · SOLO LECTURA'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Seguimiento de ejecución, runs técnicos, dependencias e historial de revisión
            </p>
          </div>
        </div>

        {/* Filter Controls & View Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-none focus:border-blue-500 w-36 sm:w-44 placeholder:text-[#64748B]"
            />
          </div>

          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todos los Proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filterAgent}
            onChange={e => setFilterAgent(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todos los Perfiles</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.roleTitle})
              </option>
            ))}
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center rounded-lg bg-[#0A141D] p-0.5 border border-[#1E293B]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white shadow' : 'text-[#64748B] hover:text-white'
              }`}
              title="Vista Kanban"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-[#64748B] hover:text-white'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-create-task-modal"
            onClick={() => appMode === 'demo' && openModal('newTask')}
            disabled={appMode !== 'demo'}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{appMode === 'demo' ? 'Crear Tarea' : 'Solo lectura'}</span>
          </button>
        </div>
      </div>

      {/* Main Area: Kanban Columns or List View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-xl bg-[#111D27] border border-[#1E293B] p-3 space-y-3 min-h-[480px] flex flex-col shadow-lg shadow-black/40"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{col.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A141D] text-[#94A3B8] border border-[#1E293B]">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards in Column */}
                <div className="space-y-2.5 flex-1">
                  {colTasks.map(task => {
                    const isSelected = activeTask?.id === task.id;
                    const assignedAgent = agents.find(a => a.id === task.assignedAgent);

                    return (
                      <div
                        key={task.id}
                        id={`task-card-${task.id}`}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-[#0A141D] border-blue-500 shadow-md ring-1 ring-blue-500/40'
                            : 'bg-[#0A141D] border-[#1E293B] hover:border-[#334155]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-400">{task.code}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              task.priority === 'urgente'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'alta'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-[#111D27] text-[#94A3B8] border border-[#1E293B]'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{task.title}</h4>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${task.progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#64748B]">
                          <div className="flex items-center gap-1.5">
                            {assignedAgent && (
                              <img
                                src={assignedAgent.avatar}
                                alt={assignedAgent.name}
                                className="w-4 h-4 rounded-full object-cover"
                                title={assignedAgent.name}
                              />
                            )}
                            <span className="truncate max-w-[80px] text-[#94A3B8]">
                              {assignedAgent?.name ? assignedAgent.name.split(' ')[0] : (task.assignedAgent || 'Agente')}
                            </span>
                          </div>

                          {task.requiresHumanApproval && (
                            <span className="text-orange-400 flex items-center gap-0.5" title="Requiere visto bueno humano">
                              <ShieldAlert className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="rounded-xl bg-[#111D27] border border-[#1E293B] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E0E7FF]">
              <thead className="bg-[#0A141D] text-[10px] uppercase tracking-wider text-[#64748B] border-b border-[#1E293B]">
                <tr>
                  <th className="p-3.5">Código</th>
                  <th className="p-3.5">Título</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Especialista</th>
                  <th className="p-3.5">Progreso</th>
                  <th className="p-3.5">Plazo</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredTasks.map(t => {
                  const assignedAgent = agents.find(a => a.id === t.assignedAgent);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="hover:bg-[#0A141D] cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-400">{t.code}</td>
                      <td className="p-3.5 font-semibold text-white">{t.title}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0A141D] border border-[#1E293B] text-[#94A3B8] capitalize">
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'urgente'
                              ? 'bg-rose-500/20 text-rose-300'
                              : t.priority === 'alta'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-[#0A141D] text-[#64748B]'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3.5 flex items-center gap-1.5">
                        {assignedAgent && <img src={assignedAgent.avatar} className="w-4 h-4 rounded-full" />}
                        <span>{assignedAgent?.name || t.assignedAgent}</span>
                      </td>
                      <td className="p-3.5 font-medium font-mono">{t.progressPercent}%</td>
                      <td className="p-3.5 font-mono text-[#64748B]">{t.deadline}</td>
                      <td className="p-3.5 text-right">
                        <button className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">Detalle</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Task Detail Bento Card */}
      {activeTask && (
        <div className="p-5 rounded-xl bg-[#111D27] border border-[#1E293B] shadow-xl space-y-5">
          {taskDetailLoading && appMode !== 'demo' && (
            <div className="text-xs text-blue-300 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
              Consultando detalle read-only en Hermes…
            </div>
          )}
          {taskDetailError && appMode !== 'demo' && (
            <div className="text-xs text-amber-300 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              {taskDetailError}
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-3 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0A141D] border border-blue-500/30 text-blue-400">
                  {activeTask.code}
                </span>
                <span className="text-xs text-[#64748B]">Tablero: {activeTask.hermesBoard || projects.find(p => p.id === activeTask.projectId)?.name || 'General'}</span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-white">{activeTask.title}</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Asignado a: <strong className="text-white">{agents.find(a => a.id === activeTask.assignedAgent)?.name}</strong> • Plazo: <strong className="text-white">{activeTask.deadline}</strong>
              </p>
            </div>

            {/* Quick Status Changers */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#64748B]">Mover a:</span>
              {columns.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleStatusChange(activeTask.id, c.id)}
                  disabled={appMode !== 'demo'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTask.status === c.id
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'bg-[#0A141D] hover:bg-white/5 text-[#94A3B8] border border-[#1E293B]'
                  }`}
                >
                  {c.label?.split(' ')[0] || c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Descripción del Objetivo:</span>
            <p className="text-xs text-[#E0E7FF] mt-1.5 leading-relaxed bg-[#0A141D] p-4 rounded-lg border border-[#1E293B]">
              {activeTask.description}
            </p>
          </div>

          {activeTask.latestSummary && (
            <div>
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Último resumen de Hermes:</span>
              <p className="text-xs text-[#E0E7FF] mt-1.5 leading-relaxed bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">
                {activeTask.latestSummary}
              </p>
            </div>
          )}

          {((activeTask.parentTaskIds?.length ?? 0) > 0 || (activeTask.childTaskIds?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0A141D] border border-[#1E293B] rounded-lg p-3">
                <strong className="text-[#94A3B8]">Tareas padre</strong>
                <p className="font-mono text-blue-300 mt-1">{activeTask.parentTaskIds?.join(', ') || 'Ninguna'}</p>
              </div>
              <div className="bg-[#0A141D] border border-[#1E293B] rounded-lg p-3">
                <strong className="text-[#94A3B8]">Tareas hijas</strong>
                <p className="font-mono text-blue-300 mt-1">{activeTask.childTaskIds?.join(', ') || 'Ninguna'}</p>
              </div>
            </div>
          )}

          {activeTask.events && activeTask.events.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Eventos de Hermes:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {activeTask.events.map(event => (
                  <div key={event.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs">
                    <span className="text-[#E0E7FF] font-medium">{event.kind}</span>
                    <span className="font-mono text-[10px] text-[#64748B]">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Runs History (if any) */}
          {activeTask.runs && activeTask.runs.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-400" />
                Historial de Ejecuciones Técnicas (Runs):
              </span>
              <div className="space-y-2">
                {activeTask.runs.map(run => (
                  <div key={run.id} className="p-3 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-blue-400 font-bold">{run.id}</span>
                      <span className="text-[#64748B]">{run.timestamp}</span>
                    </div>
                    <p className="text-[#E0E7FF]"><strong className="text-[#64748B]">Salida:</strong> {run.outputSummary}</p>
                    <p className="text-[#94A3B8] text-[11px]">
                      <strong className="text-[#64748B]">Herramientas:</strong>{' '}
                      {run.toolsUsed && run.toolsUsed.length > 0 ? run.toolsUsed.join(', ') : 'Ninguna'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Feedback Feed */}
          <div className="space-y-3 pt-3 border-t border-[#1E293B]">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Instrucciones y Retroalimentación de Ramiro:
            </span>

            {/* Comments list */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {activeTask.comments && activeTask.comments.length > 0 ? (
                activeTask.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs">
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] mb-1">
                      <span className="font-bold text-white">{c.authorName}</span>
                      <span className="font-mono">{c.timestamp}</span>
                    </div>
                    <p className="text-[#E0E7FF] leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic">No hay notas registradas en esta tarea.</p>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentInput}
                disabled={appMode !== 'demo'}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddComment();
                }}
                placeholder={appMode === 'demo' ? 'Escribe una instrucción de corrección o ajuste para el agente...' : 'Comentarios deshabilitados durante la fase read-only'}
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-xs text-[#E0E7FF] focus:outline-none focus:border-blue-500 placeholder:text-[#64748B]"
              />
              <button
                onClick={handleAddComment}
                disabled={appMode !== 'demo'}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
