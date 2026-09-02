import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { requestWritingSuggestion, WritingContext } from '../../services/aiWritingService';

interface AiWritingAssistantProps {
  context: WritingContext;
  draft: string;
  title?: string;
  category?: string;
  onAccept: (value: string) => void;
}

export const AiWritingAssistant: React.FC<AiWritingAssistantProps> = ({
  context,
  draft,
  title,
  category,
  onAccept
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  const lastRequestedDraftRef = useRef('');

  useEffect(() => {
    setSuggestion('');
    setError('');
    controllerRef.current?.abort();
  }, [draft]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const improve = useCallback(async (automatic = false) => {
    if (draft.trim().length < 10 || loading) return;
    const normalizedDraft = draft.trim();
    if (automatic && lastRequestedDraftRef.current === normalizedDraft) return;
    lastRequestedDraftRef.current = normalizedDraft;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const value = await requestWritingSuggestion({ context, draft, title, category, signal: controller.signal });
      setSuggestion(value);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No fue posible mejorar el texto.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [category, context, draft, loading, title]);

  useEffect(() => {
    if (draft.trim().length < 24 || loading || suggestion) return;
    const timer = window.setTimeout(() => void improve(true), 1_200);
    return () => window.clearTimeout(timer);
  }, [draft, improve, loading, suggestion]);

  useEffect(() => {
    if (!suggestion) return;
    const acceptWithTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      onAccept(suggestion);
      setSuggestion('');
    };
    window.addEventListener('keydown', acceptWithTab);
    return () => window.removeEventListener('keydown', acceptWithTab);
  }, [onAccept, suggestion]);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void improve(false)}
          disabled={loading || draft.trim().length < 10}
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Preparando sugerencia…' : 'Mejorar con IA'}
        </button>
        <span className="text-[10px] text-slate-500">MiniMax · conserva tus datos</span>
      </div>

      {suggestion && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Sugerencia</span>
            <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">Tab para aceptar</span>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{suggestion}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setSuggestion('')} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800">
              <X className="h-3 w-3" /> Descartar
            </button>
            <button type="button" onClick={() => { onAccept(suggestion); setSuggestion(''); }} className="flex items-center gap-1 rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-violet-400">
              <Check className="h-3 w-3" /> Aceptar
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-[11px] text-rose-300">{error}</p>}
    </div>
  );
};
