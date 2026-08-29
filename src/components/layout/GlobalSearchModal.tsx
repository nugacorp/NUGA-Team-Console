import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Radio,
  Scale,
  KanbanSquare,
  Sparkles,
  FileCheck2,
  FolderKanban,
  Bot,
  ArrowRight,
  Command
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    tasks,
    decisions,
    projects,
    routers,
    towers,
    deliverables,
    campaigns,
    agents,
    setCurrentScreen,
    setSelectedTaskId,
    setSelectedDecisionId,
    setSelectedRouterId,
    setSelectedDeliverableId
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTasks = q
    ? (tasks || []).filter(t => (t.title || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
    : [];
  const filteredDecisions = q
    ? (decisions || []).filter(d => (d.title || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q) || (d.proposal || d.situation || '').toLowerCase().includes(q))
    : [];
  const filteredRouters = q
    ? (routers || []).filter(r => (r.identity || (r as any).name || '').toLowerCase().includes(q) || (r.interfaces?.[0]?.ipAddress || (r as any).ip || '').includes(q) || (r.model || '').toLowerCase().includes(q) || (r.id || '').toLowerCase().includes(q))
    : [];
  const filteredProjects = q
    ? (projects || []).filter(p => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q) || (p.objective || '').toLowerCase().includes(q))
    : [];
  const filteredDeliverables = q
    ? (deliverables || []).filter(d => (d.title || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q) || (d.executiveSummary || '').toLowerCase().includes(q))
    : [];
  const filteredCampaigns = q
    ? (campaigns || []).filter(c => (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q) || (c.objective || '').toLowerCase().includes(q))
    : [];

  const totalResults = filteredTasks.length + filteredDecisions.length + filteredRouters.length + filteredProjects.length + filteredDeliverables.length + filteredCampaigns.length;

  const handleSelect = (screen: ScreenId, callback?: () => void) => {
    setCurrentScreen(screen);
    if (callback) callback();
    setIsSearchModalOpen(false);
  };

  return (
    <div id="global-search-modal" className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="global-search-dialog"
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            id="global-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por palabra clave, código (DEC-001, TSK-201, EDGE-01)..."
            className="flex-1 bg-transparent border-none text-slate-100 text-sm focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button id="clear-search-btn" onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="close-search-modal-btn"
            onClick={() => setIsSearchModalOpen(false)}
            className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!q ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accesos Rápidos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleSelect('decisiones')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Decisiones Pendientes</span>
                </button>
                <button
                  onClick={() => handleSelect('operaciones-wisp')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Monitoreo MikroTik</span>
                </button>
                <button
                  onClick={() => handleSelect('tareas')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <KanbanSquare className="w-4 h-4 text-sky-400" />
                  <span>Tablero Kanban</span>
                </button>
                <button
                  onClick={() => handleSelect('marketing')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>Medios & Videos</span>
                </button>
                <button
                  onClick={() => handleSelect('entregables')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <FileCheck2 className="w-4 h-4 text-teal-400" />
                  <span>Entregables Técnicos</span>
                </button>
                <button
                  onClick={() => handleSelect('conversaciones')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs text-slate-200 transition-colors"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Chat con Hermes</span>
                </button>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No se encontraron resultados para &ldquo;<span className="text-slate-200">{query}</span>&rdquo;
            </div>
          ) : (
            <div className="space-y-4">
              {/* Decisions results */}
              {filteredDecisions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Decisiones ({filteredDecisions.length})
                  </p>
                  <div className="space-y-1.5">
                    {filteredDecisions.map(d => (
                      <div
                        key={d.id}
                        onClick={() => handleSelect('decisiones', () => setSelectedDecisionId(d.id))}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-amber-400 font-bold">{d.code}</span>
                            <span className="text-xs font-semibold text-slate-200">{d.title}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{d.proposal || d.situation}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks results */}
              {filteredTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <KanbanSquare className="w-3.5 h-3.5" /> Tareas ({filteredTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {filteredTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect('tareas', () => setSelectedTaskId(t.id))}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-sky-400 font-bold">{t.code}</span>
                            <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routers results */}
              {filteredRouters.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> Infraestructura MikroTik ({filteredRouters.length})
                  </p>
                  <div className="space-y-1.5">
                    {filteredRouters.map(r => (
                      <div
                        key={r.id}
                        onClick={() => handleSelect('operaciones-wisp', () => setSelectedRouterId(r.id))}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">{r.identity || r.id}</span>
                            <span className="text-xs font-semibold text-slate-200">{r.model}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">{r.interfaces?.[0]?.ipAddress || (r as any).ip || '192.0.2.1'}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{r.routerOsVersion || (r as any).firmwareVersion || 'RouterOS v7'} • Uptime: {r.uptime}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables results */}
              {filteredDeliverables.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5" /> Entregables ({filteredDeliverables.length})
                  </p>
                  <div className="space-y-1.5">
                    {filteredDeliverables.map(del => (
                      <div
                        key={del.id}
                        onClick={() => handleSelect('entregables', () => setSelectedDeliverableId(del.id))}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-teal-400 font-bold">{del.code}</span>
                            <span className="text-xs font-semibold text-slate-200">{del.title}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{del.executiveSummary}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
