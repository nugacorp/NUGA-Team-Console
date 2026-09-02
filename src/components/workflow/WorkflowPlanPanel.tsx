import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, HelpCircle, ShieldAlert, XCircle } from 'lucide-react';
import { WorkflowPlan, WorkflowResourceType } from '../../types';
import { workflowService } from '../../services/workflowService';

export const WorkflowPlanPanel: React.FC<{ resourceType: WorkflowResourceType; resourceId: string }> = ({ resourceType, resourceId }) => {
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    workflowService.get(resourceType, resourceId).then(value => { if (active) { setPlan(value); setAnswers(value?.answers ?? {}); } }).catch(() => { if (active) setError('No fue posible consultar el plan.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resourceType, resourceId]);
  const answer = async (id: string) => {
    const value = answers[id]?.trim(); if (!value) return;
    try { setPlan(await workflowService.answer(resourceType, resourceId, id, value)); } catch { setError('No fue posible guardar la respuesta.'); }
  };
  const decide = async (action: 'approve' | 'reject') => {
    try { setPlan(await workflowService.decide(resourceType, resourceId, action)); } catch { setError('La decisión fue rechazada o el plan aún requiere información.'); }
  };
  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">Analizando el registro con IA…</div>;
  if (error) return <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-xs text-amber-200">{error}</div>;
  if (!plan) return <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">El registro se guardó, pero no existe un plan automático. No se ejecutó ninguna acción.</div>;
  return <section className="rounded-2xl border border-sky-900/70 bg-slate-900 p-5 space-y-4">
    <div className="flex items-start justify-between gap-3"><div className="flex gap-2"><Bot className="h-5 w-5 text-sky-400"/><div><h3 className="text-sm font-bold text-slate-100">Plan preparado por IA</h3><p className="text-xs text-slate-400">Solo propuesta; ninguna tarea se ejecuta automáticamente.</p></div></div><span className="rounded-full bg-sky-950 px-2 py-1 text-[10px] font-bold text-sky-300">{plan.status.replace('_',' ').toUpperCase()}</span></div>
    <div className="text-xs"><strong className="text-slate-300">Objetivo interpretado:</strong><p className="mt-1 text-slate-400">{plan.objectiveSummary}</p><p className="mt-2 text-sky-300">Responsable recomendado: {plan.recommendedAgent}</p></div>
    {plan.questions.length > 0 && <div className="space-y-3"><h4 className="flex items-center gap-2 text-xs font-bold text-amber-300"><HelpCircle className="h-4 w-4"/>Información que debe responder Ramiro</h4>{plan.questions.map(question => <div key={question.id} className="rounded-xl border border-slate-700 p-3"><p className="text-xs text-slate-200">{question.question}</p><div className="mt-2 flex gap-2"><input value={answers[question.id] ?? ''} onChange={event => setAnswers(current => ({...current,[question.id]:event.target.value}))} disabled={plan.status === 'approved' || plan.status === 'rejected'} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs" placeholder="Respuesta real…"/><button type="button" onClick={() => answer(question.id)} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950">Guardar</button></div></div>)}</div>}
    <div><h4 className="text-xs font-bold text-slate-300">Tareas propuestas</h4><div className="mt-2 space-y-2">{plan.proposedTasks.map(task => <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="flex justify-between gap-3"><strong className="text-xs text-slate-100">{task.title}</strong><span className="text-[10px] text-sky-300">{task.assignedAgent}</span></div><p className="mt-1 text-[11px] text-slate-400">{task.description}</p>{task.requiresApproval && <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-300"><ShieldAlert className="h-3 w-3"/>Requiere autorización</span>}</div>)}</div></div>
    {plan.risks.length > 0 && <div className="text-xs text-amber-200"><strong>Riesgos identificados:</strong> {plan.risks.join(' · ')}</div>}
    {plan.status === 'pending_approval' && <div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><button type="button" onClick={() => decide('reject')} className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs"><XCircle className="h-4 w-4"/>Rechazar</button><button type="button" onClick={() => decide('approve')} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950"><CheckCircle2 className="h-4 w-4"/>Aprobar plan</button></div>}
    {plan.status === 'approved' && <div className="rounded-lg bg-emerald-950/40 p-3 text-xs text-emerald-300">Plan aprobado por Ramiro. Continúa sin ejecución automática; la creación de tareas será una fase separada.</div>}
  </section>;
};
