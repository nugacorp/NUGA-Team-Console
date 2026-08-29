import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Scale,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Paperclip,
  PlusCircle,
  Clock,
  Wrench,
  HelpCircle,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { Message, Conversation, AgentRole } from '../../types';

export const ConversacionesScreen: React.FC = () => {
  const {
    conversations,
    selectedAgentId,
    setSelectedAgentId,
    setCurrentScreen,
    setSelectedDecisionId,
    setSelectedTaskId,
    addToast
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    if (selectedAgentId) {
      const match = conversations.find(c => c.agentId === selectedAgentId);
      if (match) return match.id;
    }
    return conversations[0]?.id || 'conv-director';
  });

  const [messages, setMessages] = useState<Message[]>(() => storageService.getMessages(activeConvId));
  const [inputText, setInputText] = useState('');
  const [isOnlyAnalysis, setIsOnlyAnalysis] = useState(true);
  const [createTaskDerived, setCreateTaskDerived] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');
  const [expandedTechEvidence, setExpandedTechEvidence] = useState<Record<string, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync if selectedAgentId changed externally (e.g. from Equipo IA)
  useEffect(() => {
    if (selectedAgentId) {
      const match = conversations.find(c => c.agentId === selectedAgentId);
      if (match) {
        setActiveConvId(match.id);
        setMessages(storageService.getMessages(match.id));
      }
    }
  }, [selectedAgentId, conversations]);

  // Load messages on activeConvId change
  useEffect(() => {
    setMessages(storageService.getMessages(activeConvId));
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const { userMessage, botMessage } = storageService.sendMessage(activeConvId, text, {
      isOnlyAnalysis,
      createTask: createTaskDerived,
      priority: selectedPriority
    });

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputText('');

    addToast({
      type: 'info',
      title: 'Respuesta de Agente',
      message: `${activeConv?.title?.split(' & ')[0] || 'El agente'} ha completado el análisis solicitado.`
    });

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const quickPrompts = [
    'Resume las decisiones pendientes más críticas y el estado del equipo hoy.',
    'Revisa el estado del piloto WISP y el hallazgo de firewall en EDGE-DEMO-01.',
    'Prepara una campaña de Internet Hogar con creatividades de video.',
    'Organiza los pendientes administrativos y el contrato de Carrier Metro.',
    '¿Qué tareas de NugaCore están listas para despliegue?'
  ];

  return (
    <div id="screen-conversaciones" className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4 pb-2 animate-in fade-in duration-200">
      {/* Left Sidebar: Conversations list */}
      <div className="w-full md:w-80 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Canales de Agentes
            </h2>
            <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono font-bold text-sky-400">
              DEMO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Orquestación y consultas directas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {conversations.map(conv => {
            const isActive = conv.id === activeConvId;

            return (
              <button
                key={conv.id}
                id={`conv-tab-${conv.id}`}
                onClick={() => {
                  setActiveConvId(conv.id);
                  setSelectedAgentId(conv.agentId);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-slate-800 border-sky-500/60 shadow-lg ring-1 ring-sky-500/30'
                    : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-800/60 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  {conv.agentId?.substring(0, 2).toUpperCase() || 'AG'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 truncate">{conv.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{conv.lastMessageTimestamp}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Chat Window */}
      <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{activeConv?.title}</h3>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Agente en línea • Modo sandbox local
              </span>
            </div>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-950/30">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold ring-1 ring-slate-600">
                      R
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold ring-1 ring-sky-500/40">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender Header */}
                  <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span>{msg.timestamp ? msg.timestamp.substring(11, 16) : ''}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-lg shadow-sky-900/30'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-lg'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Executive Summary Card if agent response */}
                    {msg.executiveSummary && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
                        <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] block mb-1">
                          Resumen Ejecutivo:
                        </span>
                        <p className="text-slate-200">{msg.executiveSummary}</p>
                      </div>
                    )}

                    {/* Key Findings List */}
                    {msg.findings && msg.findings.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                          Hallazgos Clave:
                        </span>
                        {msg.findings.map((f, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Required Decision Button */}
                    {msg.requiredDecisionId && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs text-amber-200 font-semibold truncate">
                            Requiere visto bueno en DEC-001
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDecisionId(msg.requiredDecisionId);
                            setCurrentScreen('decisiones');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                        >
                          Ver Decisión
                        </button>
                      </div>
                    )}

                    {/* Tool Calls Accordion */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700/60">
                        <button
                          onClick={() => setExpandedTools(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-sky-400" />
                            Herramientas Ejecutadas ({msg.toolCalls.length})
                          </span>
                          {expandedTools[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedTools[msg.id] && (
                          <div className="mt-2 space-y-1.5">
                            {msg.toolCalls.map((tc, idx) => (
                              <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
                                <div className="flex items-center justify-between text-sky-300">
                                  <span>{tc.toolName}</span>
                                  <span className="text-emerald-400 text-[10px]">{tc.status}</span>
                                </div>
                                <p className="text-slate-400 text-[10px] mt-0.5">{tc.resultSummary}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expandable Technical Evidence */}
                    {msg.technicalEvidence && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedTechEvidence(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-1 font-semibold"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>{expandedTechEvidence[msg.id] ? 'Ocultar Evidencia Técnica' : 'Ver Evidencia Técnica y Telemetría'}</span>
                        </button>

                        {expandedTechEvidence[msg.id] && (
                          <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {msg.technicalEvidence}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Sugerencias:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar & Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isOnlyAnalysis}
                  onChange={e => {
                    setIsOnlyAnalysis(e.target.checked);
                    if (e.target.checked) setCreateTaskDerived(false);
                  }}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Solo Análisis / Diagnóstico</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={createTaskDerived}
                  onChange={e => {
                    setCreateTaskDerived(e.target.checked);
                    if (e.target.checked) setIsOnlyAnalysis(false);
                  }}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Crear Tarea / Objetivo Derivado</span>
              </label>
            </div>

            {createTaskDerived && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Prioridad:</span>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value as any)}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Escribe una instrucción para ${activeConv?.title?.split(' & ')[0] || 'el agente'}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />

            <button
              id="btn-send-message"
              onClick={() => handleSendMessage()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
