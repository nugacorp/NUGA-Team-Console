import React, { useState } from 'react';
import { Flame, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IncidentSeverity } from '../../types';

export const NewIncidentModal: React.FC = () => {
  const { activeModal, closeModal, createIncident } = useApp();

  if (activeModal !== 'newIncident') return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [affectedNodes, setAffectedNodes] = useState('TWR-NORTE-RB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createIncident({
      title: title.trim(),
      description: description.trim() || 'Incidente registrado manualmente para seguimiento operativo.',
      severity,
      status: 'investigating',
      affectedNodes: affectedNodes ? affectedNodes.split(',').map(s => s.trim()).filter(Boolean) : [],
      timeline: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: 'Incidente reportado por Ramiro en la consola',
          author: 'Ramiro (Propietario)'
        }
      ]
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Registrar Nuevo Incidente WISP</h3>
              <p className="text-[11px] text-slate-400">Abre un ticket de seguimiento para el equipo</p>
            </div>
          </div>

          <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Título del Incidente:</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Intermitencia de enlace en Torre Norte..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Severidad:</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Nodos Afectados (separar por coma):</label>
              <input
                type="text"
                value={affectedNodes}
                onChange={e => setAffectedNodes(e.target.value)}
                placeholder="TWR-NORTE-RB, LINK-02"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Descripción del Problema:</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalla síntomas, pérdida de paquetes o alarmas..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
            />
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Incidente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
