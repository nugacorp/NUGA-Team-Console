import React, { useState } from 'react';
import { FolderKanban, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentRole, Project } from '../../types';

export const NewProjectModal: React.FC = () => {
  const { activeModal, closeModal, createProject } = useApp();
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [owner, setOwner] = useState('Ramiro');
  const [category, setCategory] = useState<Project['category']>('wisp');
  const [targetEndDate, setTargetEndDate] = useState('2026-12-31');
  if (activeModal !== 'newProject') return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !objective.trim()) return;
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const team: AgentRole[] = category === 'wisp' ? ['director', 'operaciones'] : ['director', category === 'admin' ? 'administracion' : category];
    createProject({
      code: `PRJ-${suffix}`, name: name.trim(), category, objective: objective.trim(), owner: owner.trim(),
      team, status: 'planning', progressPercent: 0,
      startDate: new Date().toISOString().slice(0, 10), targetEndDate,
      risks: [], milestones: [], budgetEstimateUsd: 0,
      summaryExecutive: objective.trim(), deliverablesCount: 0
    });
    closeModal();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3"><FolderKanban className="text-sky-400"/><div><h3 className="font-bold">Nuevo proyecto real</h3><p className="text-xs text-slate-400">Se guardará en Supabase y quedará auditado</p></div></div>
        <button onClick={closeModal}><X className="w-5 h-5"/></button>
      </div>
      <form onSubmit={submit} className="p-5 space-y-4 text-xs">
        <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del proyecto" className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700"/>
        <textarea required rows={3} value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Objetivo verificable" className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700"/>
        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={e=>setCategory(e.target.value as Project['category'])} className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700"><option value="wisp">WISP</option><option value="nugacore">NugaCore</option><option value="marketing">Marketing</option><option value="admin">Administración</option></select>
          <input required value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Responsable" className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700"/>
        </div>
        <input type="date" required value={targetEndDate} onChange={e=>setTargetEndDate(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700"/>
        <div className="flex justify-end gap-2"><button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-800">Cancelar</button><button className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold flex gap-2"><CheckCircle2 className="w-4 h-4"/>Crear proyecto</button></div>
      </form>
    </div>
  </div>;
};
