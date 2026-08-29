import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  Search,
  Filter,
  FileCheck2,
  ExternalLink,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminItem } from '../../types';

export const AdministracionScreen: React.FC = () => {
  const { adminItems, openModal } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = adminItems.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.responsible.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id="screen-administracion" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Operaciones Administrativas & Acuerdos</h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-400">
                DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Minutas, control de arrendamientos, cotizaciones preliminares y seguimiento de compromisos
            </p>
          </div>
        </div>

        <button
          onClick={() => openModal('newAdminItem')}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Registro Administrativo</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs text-sky-200 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0" />
        <span>
          <strong>Nota de Control:</strong> Los registros de pagos y cotizaciones son de carácter exclusivamente informativo y de seguimiento de gestión. No se ejecutan transacciones bancarias reales.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar registros..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todas las Categorías</option>
            <option value="acuerdo">Acuerdos</option>
            <option value="cotizacion">Cotizaciones</option>
            <option value="minuta">Minutas</option>
            <option value="pago_reportado">Pagos Reportados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Mostrando <strong className="text-slate-200">{filteredItems.length}</strong> registros
        </span>
      </div>

      {/* Administrative Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filteredItems || []).map(item => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                  {item.category.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
              {item.notes && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.notes}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Responsable:</span>
                <strong className="text-slate-200">{item.responsible}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plazo / Vencimiento:</span>
                <strong className="text-slate-200 font-mono">{item.deadline}</strong>
              </div>
              {item.amountUsd && (
                <div className="flex justify-between text-slate-400">
                  <span>Monto Referencial:</span>
                  <strong className="text-emerald-400 font-bold">${item.amountUsd.toLocaleString()} USD</strong>
                </div>
              )}
              {item.evidenceRef && (
                <div className="flex items-center gap-1 text-[11px] text-sky-400 truncate pt-1">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.evidenceRef}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
