import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Film,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Plus,
  FileVideo,
  Layers,
  ChevronRight,
  ExternalLink,
  Eye,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Campaign, MediaAsset } from '../../types';

export const MarketingScreen: React.FC = () => {
  const {
    campaigns,
    mediaAssets,
    selectedMediaAsset,
    setSelectedMediaAsset,
    openModal,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'library' | 'generator'>('campaigns');
  const [selectedCampaignIdLocal, setSelectedCampaignIdLocal] = useState<string>(() => campaigns[0]?.id || 'camp-fibra-residencial');
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignIdLocal) || campaigns[0];

  // Generator form state
  const [genObjective, setGenObjective] = useState('Captación de clientes residenciales en zona Norte');
  const [genChannel, setGenChannel] = useState<'meta_ads' | 'tiktok' | 'google_ads'>('meta_ads');
  const [genFormat, setGenFormat] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [genHook, setGenHook] = useState('¿Tu internet se corta en las videollamadas importantes?');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSimulateGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      addToast({
        type: 'success',
        title: 'Video Generado (Simulado)',
        message: 'Variante de video vertical renderizada y agregada a la Biblioteca Multimedia.'
      });
      setActiveTab('library');
    }, 1400);
  };

  return (
    <div id="screen-marketing" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Marketing & Biblioteca Multimedia</h2>
              <span className="px-2 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10px] font-mono font-bold text-fuchsia-400">
                DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Campañas de pauta, generación de videos (simulado) y métricas de adquisición
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('generator')}
            className="px-3.5 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-fuchsia-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Video con IA</span>
          </button>

          <button
            onClick={() => openModal('newCampaign')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-fuchsia-400" />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Campañas Activas ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'library'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Biblioteca Multimedia ({mediaAssets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'generator'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generador de Creativos IA</span>
        </button>
      </div>

      {/* TAB 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Campaigns list (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {(campaigns || []).map(camp => {
              const isSelected = selectedCampaign?.id === camp.id;

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignIdLocal(camp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-fuchsia-500 shadow-xl ring-1 ring-fuchsia-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-fuchsia-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {camp.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      {camp.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{camp.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{camp.objective}</p>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <div>Leads: <strong className="text-slate-200">{camp.metrics?.leadsGenerated || 0}</strong></div>
                    <div>CPA: <strong className="text-emerald-400">${camp.metrics?.cpaUsd || 0} USD</strong></div>
                    <div>Gasto: <strong className="text-slate-200">${camp.spentBudgetUsd || 0}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campaign Details (7 cols) */}
          {selectedCampaign && (
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono font-bold text-fuchsia-400">{selectedCampaign.code}</span>
                    <h3 className="text-lg font-extrabold text-slate-100 mt-1">{selectedCampaign.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Plazo: {selectedCampaign.scheduleDateRange || 'En curso'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Presupuesto Simulado</span>
                    <span className="text-base font-bold text-slate-100">${(selectedCampaign.simulatedBudgetUsd || 0).toLocaleString()} USD</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Métricas de Rendimiento (Simuladas):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                      <span className="text-slate-400 text-[10px] block">Impresiones</span>
                      <strong className="text-base text-slate-100">{(selectedCampaign.metrics?.impressions || 0).toLocaleString()}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                      <span className="text-slate-400 text-[10px] block">Clics</span>
                      <strong className="text-base text-slate-100">{(selectedCampaign.metrics?.clicks || 0).toLocaleString()}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                      <span className="text-slate-400 text-[10px] block">CTR</span>
                      <strong className="text-base text-sky-400">{selectedCampaign.metrics?.ctrPercent || 0}%</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                      <span className="text-slate-400 text-[10px] block">Leads Generados</span>
                      <strong className="text-base text-emerald-400">{selectedCampaign.metrics?.leadsGenerated || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Creative Brief */}
                <div className="space-y-3 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="font-bold text-fuchsia-400 uppercase tracking-wider text-[10px]">Público Objetivo:</span>
                    <p className="text-slate-200 mt-0.5">{selectedCampaign.targetAudience}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Canales de Distribución:</span>
                    <p className="text-slate-300 mt-0.5 capitalize">{selectedCampaign.channels ? selectedCampaign.channels.join(', ') : 'Digital'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Multimedia Library */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(mediaAssets || []).map(asset => (
            <div
              key={asset.id}
              onClick={() => openModal('mediaViewer', { asset })}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl hover:border-sky-500/60 transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Thumbnail with overlay icon */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur font-mono text-[10px]">
                    {asset.format}
                  </span>
                  {asset.durationSeconds && (
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur font-mono text-[10px]">
                      0:{asset.durationSeconds}s
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">{asset.code}</span>
                  <span className="capitalize">{asset.engine}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{asset.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{asset.hook}</p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-sky-400 font-semibold">
                  <span>Ver Storyboard</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Creative Prompt Generator */}
      {activeTab === 'generator' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              Generador de Activos Audiovisuales (Higgsfield Engine Simulado)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configura el brief creativo para que el especialista en Marketing renderice variantes de video y guiones
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Objetivo del Creativo:</label>
              <input
                type="text"
                value={genObjective}
                onChange={e => setGenObjective(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Canal de Distribución:</label>
                <select
                  value={genChannel}
                  onChange={e => setGenChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="meta_ads">Meta Ads (Instagram & Facebook)</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="google_ads">YouTube Shorts / Google Display</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Formato / Relación de Aspecto:</label>
                <select
                  value={genFormat}
                  onChange={e => setGenFormat(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="9:16">9:16 Vertical (Reels / TikTok)</option>
                  <option value="16:9">16:9 Horizontal (YouTube / Web)</option>
                  <option value="1:1">1:1 Cuadrado (Feed Instagram)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Gancho Principal (Hook):</label>
              <textarea
                value={genHook}
                onChange={e => setGenHook(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSimulateGeneration}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Generando en Sandbox...' : 'Generar Video con Higgsfield (Simulado)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
