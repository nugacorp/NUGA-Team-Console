import React, { useState } from 'react';
import { Plus, X, KanbanSquare, CheckCircle2, User, Calendar, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentRole, PriorityLevel } from '../../types';

export const NewTaskModal: React.FC = () => {
  const { activeModal, closeModal, modalProps, projects, agents, createTask } = useApp();

  if (activeModal !== 'newTask') return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(modalProps?.projectId || projects[0]?.id || 'proj-wisp-pilot');
  const [assignedAgent, setAssignedAgent] = useState<AgentRole>(modalProps?.assignedAgent || 'operaciones');
  const [priority, setPriority] = useState<PriorityLevel>('alta');
  const [deadline, setDeadline] = useState('2026-09-10');
  const [requiresHumanApproval, setRequiresHumanApproval] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      projectId,
      title: title.trim(),
      description: description.trim() || 'Tarea creada desde la consola ejecutiva.',
      assignedAgent,
      priority,
      status: 'ready',
      progressPercent: 0,
      deadline,
      requiresHumanApproval,
      deliverablesIds: [],
      estimatedHours: 8,
      loggedHours: 0
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Crear Nueva Tarea</h3>
              <p className="text-[11px] text-slate-400">Asigna un objetivo a un especialista de IA</p>
            </div>
          </div>

          <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Título de la Tarea:</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Calibrar sector Norte y validar SNR..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Proyecto:</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Especialista Asignado:</label>
              <select
                value={assignedAgent}
                onChange={e => setAssignedAgent(e.target.value as AgentRole)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500 capitalize"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Prioridad:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Plazo de Entrega:</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Descripción y Requisitos Técnicos:</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalla los pasos o criterios de aceptación..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={requiresHumanApproval}
              onChange={e => setRequiresHumanApproval(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <label htmlFor="requiresApproval" className="text-slate-300 font-medium cursor-pointer">
              Exigir visto bueno de Ramiro antes de marcar completada
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Tarea</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
