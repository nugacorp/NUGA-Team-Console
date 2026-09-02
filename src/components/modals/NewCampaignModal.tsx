import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AiWritingAssistant } from '../forms/AiWritingAssistant';

export const NewCampaignModal: React.FC = () => {
  const { activeModal, closeModal, createCampaign } = useApp();

  if (activeModal !== 'newCampaign') return null;

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [budgetUsd, setBudgetUsd] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !objective.trim() || !targetAudience.trim()) return;

    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    createCampaign({
      code: `CAM-${suffix}`,
      name: name.trim(),
      objective: objective.trim(),
      status: 'draft',
      simulatedBudgetUsd: budgetUsd ? Number(budgetUsd) : 0,
      spentBudgetUsd: 0,
      scheduleDateRange: `${new Date().toISOString().slice(0, 10)} — por definir`,
      channels: [],
      targetAudience: targetAudience.trim(),
      valueProposition: objective.trim(),
      creativeStage: 'brief',
      variantsCount: 0,
      requiresApproval: true,
      assignedAgent: 'marketing',
      metrics: {
        impressions: 0,
        clicks: 0,
        ctrPercent: 0,
        leadsGenerated: 0,
        cpaUsd: 0
      }
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Nueva Campaña de Marketing</h3>
              <p className="text-[11px] text-slate-400">Planifica pauta publicitaria y distribución de videos</p>
            </div>
          </div>

          <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Nombre de la Campaña:</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Oferta Instalación Gratuita Q3..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Presupuesto (USD):</label>
              <input
                type="number"
                value={budgetUsd}
                onChange={e => setBudgetUsd(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Público Objetivo:</label>
              <input
                type="text"
                required
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Objetivo Estratégico:</label>
            <textarea
              rows={3}
              required
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="Detalla la propuesta de valor y meta de conversión..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
            />
            <AiWritingAssistant
              context="campaign_objective"
              draft={objective}
              title={name}
              category="marketing"
              onAccept={setObjective}
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
              className="px-5 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Crear Campaña</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
