import React, { useState } from 'react';
import { Briefcase, X, CheckCircle2, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminCategory } from '../../types';

export const NewAdminItemModal: React.FC = () => {
  const { activeModal, closeModal, createAdminItem } = useApp();

  if (activeModal !== 'newAdminItem') return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AdminCategory>('acuerdo');
  const [responsible, setResponsible] = useState('Ramiro / Especialista Administración');
  const [deadline, setDeadline] = useState('2026-09-15');
  const [amountUsd, setAmountUsd] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createAdminItem({
      title: title.trim(),
      category,
      responsible: responsible.trim(),
      status: 'pending',
      deadline,
      amountUsd: amountUsd ? Number(amountUsd) : undefined,
      notes: notes.trim()
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Nuevo Registro Administrativo</h3>
              <p className="text-[11px] text-slate-400">Minutas, contratos, cotizaciones y compromisos</p>
            </div>
          </div>

          <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Título / Concepto:</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Acuerdo de Arrendamiento Torre Sur..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Categoría:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AdminCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="acuerdo">Acuerdo</option>
                <option value="cotizacion">Cotización</option>
                <option value="minuta">Minuta de Reunión</option>
                <option value="pago_reportado">Pago Reportado (Informativo)</option>
                <option value="pendiente">Pendiente General</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Responsable:</label>
              <input
                type="text"
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Fecha / Plazo:</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Monto Referencial USD (Opcional):</label>
              <input
                type="number"
                value={amountUsd}
                onChange={e => setAmountUsd(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Notas y Detalles:</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalle cláusulas clave, enlace de respaldo o contactos..."
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
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
