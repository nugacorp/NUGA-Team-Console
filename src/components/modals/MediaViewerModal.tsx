import React, { useState } from 'react';
import { Film, X, Play, Pause, RotateCcw, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MediaAsset } from '../../types';

export const MediaViewerModal: React.FC = () => {
  const { activeModal, closeModal, modalProps } = useApp();

  if (activeModal !== 'mediaViewer' || !modalProps?.asset) return null;

  const asset: MediaAsset = modalProps.asset;
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(0);

  const frames = asset?.storyboardFrames && asset.storyboardFrames.length > 0
    ? asset.storyboardFrames
    : [asset?.thumbnailUrl || ''];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-fuchsia-400">{asset.code}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {asset.format} • {asset.durationSeconds}s
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{asset.title}</h3>
            </div>
          </div>

          <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs custom-scrollbar">
          {/* Left: Video Player & Storyboard (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Player Container */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden group flex items-center justify-center">
              <img
                src={frames[selectedFrame] || asset.thumbnailUrl}
                alt="Frame"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 flex items-center justify-center shadow-xl shadow-fuchsia-500/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white bg-black/60 backdrop-blur px-3 py-1.5 rounded-xl font-mono">
                <span>0:0{selectedFrame * 5}</span>
                <div className="flex-1 mx-3 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-fuchsia-400 h-full rounded-full transition-all"
                    style={{ width: `${((selectedFrame + 1) / frames.length) * 100}%` }}
                  />
                </div>
                <span>0:{asset.durationSeconds}s</span>
              </div>
            </div>

            {/* Storyboard Frames Thumbnails */}
            <div>
              <span className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                Cuadros del Storyboard (Haz clic para avanzar):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((frame, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFrame(idx)}
                    className={`aspect-video rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      selectedFrame === idx
                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/40'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={frame} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Metadata, Script & Prompt (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div>
                <span className="font-bold text-fuchsia-400 uppercase tracking-wider text-[10px]">Gancho (Hook):</span>
                <p className="text-slate-100 font-semibold mt-0.5">{asset.hook}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Llamado a la Acción (CTA):</span>
                <p className="text-emerald-400 font-bold mt-0.5">{asset.cta}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Guion Locutado:</span>
                <p className="text-slate-300 italic mt-0.5 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  "{asset.scriptTranscript}"
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Prompt Higgsfield Utilizado:</span>
                <p className="text-slate-400 font-mono text-[11px] mt-0.5 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {asset.promptUsed}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
