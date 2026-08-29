import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Plus,
  Filter,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  Clock,
  Eye,
  EyeOff,
  Radio,
  Send
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';
import { AppNotification } from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationCategory = 'all' | 'critical' | 'tasks' | 'activity';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    notifications,
    markNotificationRead,
    toggleNotificationRead,
    deleteNotification,
    clearAllNotifications,
    markAllNotificationsRead,
    createNotification,
    setCurrentScreen,
    setSelectedDecisionId,
    setSelectedTaskId,
    setSelectedDeliverableId
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state for creating custom notification
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'decision' | 'alert' | 'task' | 'system'>('alert');
  const [newPriority, setNewPriority] = useState<'urgente' | 'alta' | 'media' | 'baja'>('alta');
  const [newLinkScreen, setNewLinkScreen] = useState<ScreenId>('decisiones');

  // Counts
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'urgente' || n.type === 'decision' || n.priority === 'alta').length;
  const tasksCount = notifications.filter(n => n.type === 'task').length;
  const activityCount = notifications.filter(n => n.type === 'system' || n.type === 'alert').length;

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Category filter
      if (activeCategory === 'critical') {
        if (item.priority !== 'urgente' && item.priority !== 'alta' && item.type !== 'decision') {
          return false;
        }
      } else if (activeCategory === 'tasks') {
        if (item.type !== 'task') return false;
      } else if (activeCategory === 'activity') {
        if (item.type !== 'system' && item.type !== 'alert') return false;
      }

      // Unread filter
      if (filterUnreadOnly && item.read) {
        return false;
      }

      return true;
    });
  }, [notifications, activeCategory, filterUnreadOnly]);

  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.linkScreen) {
      setCurrentScreen(notif.linkScreen as ScreenId);
      if (notif.linkItemId) {
        if (notif.linkScreen === 'decisiones') {
          setSelectedDecisionId(notif.linkItemId);
        } else if (notif.linkScreen === 'tareas') {
          setSelectedTaskId(notif.linkItemId);
        } else if (notif.linkScreen === 'entregables') {
          setSelectedDeliverableId(notif.linkItemId);
        }
      }
    }
    onClose();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    createNotification({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      priority: newPriority,
      linkScreen: newLinkScreen
    });

    setNewTitle('');
    setNewMessage('');
    setIsCreatingNew(false);
  };

  // Quick simulation presets
  const handleQuickPreset = (preset: 'decision' | 'noise' | 'task_review') => {
    if (preset === 'decision') {
      createNotification({
        title: 'Nueva Decisión Crítica: Autorización Firewall',
        message: 'Especialista Operaciones requiere validación para bloqueo de puertos no autorizados.',
        type: 'decision',
        priority: 'urgente',
        linkScreen: 'decisiones',
        linkItemId: 'dec-001'
      });
    } else if (preset === 'noise') {
      createNotification({
        title: 'Alerta SNMP: Piso de Ruido Elevado en Torre Sur',
        message: 'Interferencia en frecuencia 5.8 GHz detectada por sensor de espectro.',
        type: 'alert',
        priority: 'alta',
        linkScreen: 'operaciones-wisp'
      });
    } else {
      createNotification({
        title: 'Revisión Solicitada: Reporte Semanal WISP',
        message: 'Director IA completó la tarea TSK-117 y solicita visto bueno ejecutivo.',
        type: 'task',
        priority: 'media',
        linkScreen: 'tareas',
        linkItemId: 'task-117'
      });
    }
  };

  return (
    <div
      id="notification-center-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="notification-center-drawer"
        className="w-full sm:w-[480px] md:w-[540px] h-full bg-[#0A141D] border-l border-[#1E293B] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] bg-[#0A141D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Centro de Notificaciones</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B]">Alertas de tareas, riesgos críticos y actividad del equipo</p>
            </div>
          </div>

          <button
            id="close-notification-center-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            title="Cerrar notificaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Actions Bar */}
        <div className="px-4 py-2.5 bg-[#111D27]/80 border-b border-[#1E293B] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              id="notif-toggle-unread-filter"
              onClick={() => setFilterUnreadOnly(prev => !prev)}
              className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                filterUnreadOnly
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                  : 'bg-transparent text-[#94A3B8] border-[#1E293B] hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterUnreadOnly ? 'Solo no leídas' : 'Todas'}</span>
            </button>

            <button
              id="notif-create-toggle-btn"
              onClick={() => setIsCreatingNew(prev => !prev)}
              className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                isCreatingNew
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#0A141D] text-[#E0E7FF] border-[#1E293B] hover:border-blue-500/50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Alerta</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="notif-mark-all-read-btn"
                onClick={markAllNotificationsRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Marcar leídas</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                id="notif-clear-all-btn"
                onClick={clearAllNotifications}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                title="Eliminar todas las notificaciones"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-[#1E293B] bg-[#0A141D] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas</span>
            <span className="text-[10px] opacity-80 font-mono">({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              activeCategory === 'critical'
                ? 'bg-orange-500 text-black font-bold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Riesgos Críticos</span>
            <span className="text-[10px] opacity-80 font-mono">({criticalCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              activeCategory === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tareas Pendientes</span>
            <span className="text-[10px] opacity-80 font-mono">({tasksCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              activeCategory === 'activity'
                ? 'bg-blue-600 text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Actividad</span>
            <span className="text-[10px] opacity-80 font-mono">({activityCount})</span>
          </button>
        </div>

        {/* Modal Body / Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {/* Form to Add New Notification */}
          {isCreatingNew && (
            <div className="p-4 rounded-xl bg-[#111D27] border border-blue-500/40 shadow-lg space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Crear Notificación o Alerta Simulada
                </span>
                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Título de la alerta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sobrecarga de CPU en Router Torre Norte"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-[#0A141D] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Mensaje o detalle</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ej. El uso de CPU superó el umbral del 85% durante 5 minutos continuos."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="w-full bg-[#0A141D] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:border-blue-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Tipo</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="w-full bg-[#0A141D] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                    >
                      <option value="alert">Alerta / Incidente</option>
                      <option value="decision">Decisión Crítica</option>
                      <option value="task">Tarea / Revisión</option>
                      <option value="system">Sistema / Auditoría</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Prioridad</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="w-full bg-[#0A141D] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                    >
                      <option value="urgente">Urgente</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">Pantalla Vinculada</label>
                  <select
                    value={newLinkScreen}
                    onChange={e => setNewLinkScreen(e.target.value as any)}
                    className="w-full bg-[#0A141D] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="decisiones">Centro de Decisiones</option>
                    <option value="operaciones-wisp">WISP MikroTik Ops</option>
                    <option value="tareas">Tablero de Tareas</option>
                    <option value="entregables">Entregables & Documentos</option>
                    <option value="marketing">Marketing</option>
                    <option value="administracion">Administración</option>
                    <option value="auditoria">Bitácora de Auditoría</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Guardar y Emitir</span>
                  </button>
                </div>
              </form>

              {/* Quick simulation presets */}
              <div className="pt-2 border-t border-[#1E293B]/70">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold block mb-1.5">
                  Generadores de prueba instantáneos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('decision')}
                    className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                  >
                    + Decisión Firewall
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('noise')}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                  >
                    + Alerta Ruido WISP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('task_review')}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
                  >
                    + Revisión TSK-117
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#111D27] border border-[#1E293B] flex items-center justify-center text-[#64748B] mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#E0E7FF]">No hay notificaciones en esta categoría</p>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                {filterUnreadOnly
                  ? 'Todas las notificaciones están marcadas como leídas.'
                  : 'El sistema no registra alertas pendientes en esta sección.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const isCritical = notif.priority === 'urgente' || notif.type === 'decision';
              const isHigh = notif.priority === 'alta';

              return (
                <div
                  key={notif.id}
                  id={`notification-item-${notif.id}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 relative group ${
                    !notif.read
                      ? isCritical
                        ? 'bg-orange-950/20 border-orange-500/40 shadow-sm'
                        : isHigh
                        ? 'bg-rose-950/15 border-rose-500/30'
                        : 'bg-[#111D27] border-blue-500/30'
                      : 'bg-[#0A141D] border-[#1E293B] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {notif.type === 'decision' ? (
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'alert' ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'task' ? (
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          {notif.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Priority badge */}
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono uppercase ${
                              notif.priority === 'urgente'
                                ? 'bg-orange-500 text-black'
                                : notif.priority === 'alta'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : notif.priority === 'media'
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {notif.priority}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">{notif.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed mb-2.5">{notif.message}</p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1E293B]/60">
                        <div className="flex items-center gap-2">
                          {notif.linkScreen && (
                            <button
                              onClick={() => handleNotificationClick(notif)}
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <span>Ver en {notif.linkScreen}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleNotificationRead(notif.id)}
                            className="p-1 rounded text-[#64748B] hover:text-[#E0E7FF] hover:bg-white/5 transition-colors"
                            title={notif.read ? 'Marcar como no leída' : 'Marcar como leída'}
                          >
                            {notif.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 rounded text-[#64748B] hover:text-rose-400 hover:bg-white/5 transition-colors"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0A141D] flex items-center justify-between text-xs text-[#64748B]">
          <span>Consola NUGA Hermes v2.4</span>
          <span>{unreadCount} alertas sin resolver</span>
        </div>
      </div>
    </div>
  );
};
