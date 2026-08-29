import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        return (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/20'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/20'
                : 'bg-slate-900/95 border-sky-500/40 text-slate-100 shadow-sky-950/20'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 leading-tight">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
