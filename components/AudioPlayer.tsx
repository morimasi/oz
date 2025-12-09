import React, { useContext, useState } from 'react';
import { AudioPlayerContextType } from '../types';
import { AppContext } from '../App';
import { Play, Pause, Loader2, SkipBack, SkipForward, Rewind, FastForward, ChevronUp, ChevronDown, X } from 'lucide-react';

const AudioPlayer: React.FC = () => {
  const audio = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!audio || !audio.currentSurah || !audio.currentVerse) {
    return null;
  }

  const {
    isPlaying,
    isLoading,
    currentSurah,
    currentVerse,
    pause,
    resume,
    playNextVerse,
    playPrevVerse,
    skipToNextSurah,
    skipToPrevSurah,
    stop
  } = audio;

  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-primary-900 text-white z-[100] flex flex-col p-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <button onClick={() => setIsExpanded(false)} className="p-2 text-primary-200 hover:bg-white/10 rounded-full"><ChevronDown size={24} /></button>
          <h2 className="font-bold text-lg uppercase tracking-wider">Şimdi Oynatılıyor</h2>
          <button onClick={stop} className="p-2 text-primary-200 hover:bg-white/10 rounded-full"><X size={24} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h3 className="font-bold text-3xl font-serif">{currentSurah.name} Suresi, {currentVerse.number}. Ayet</h3>
          <p className="text-2xl font-serif mt-6 leading-relaxed opacity-90">{currentVerse.text}</p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-4">
            <button onClick={skipToPrevSurah} className="p-4 text-primary-200 hover:bg-white/10 rounded-full"><Rewind size={24} /></button>
            <button onClick={playPrevVerse} className="p-4 text-primary-200 hover:bg-white/10 rounded-full"><SkipBack size={24} /></button>
            <button onClick={isPlaying ? pause : resume} className="w-20 h-20 bg-white text-primary-800 rounded-full flex items-center justify-center shadow-lg">
              {isLoading ? <Loader2 size={32} className="animate-spin" /> : (isPlaying ? <Pause size={32} /> : <Play size={32} />)}
            </button>
            <button onClick={playNextVerse} className="p-4 text-primary-200 hover:bg-white/10 rounded-full"><SkipForward size={24} /></button>
            <button onClick={skipToNextSurah} className="p-4 text-primary-200 hover:bg-white/10 rounded-full"><FastForward size={24} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[76px] left-2 right-2 bg-gray-800 text-white rounded-lg p-3 shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <button onClick={() => setIsExpanded(true)} className="flex-1 flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          {isLoading ? (
            <div className="w-10 h-10 flex items-center justify-center"><Loader2 size={20} className="animate-spin" /></div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }} className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-md">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{currentSurah.name} Suresi</p>
          <p className="text-xs text-gray-300 truncate">{currentVerse.number}. Ayet</p>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); playNextVerse(); }} className="p-2 rounded-full hover:bg-white/20"><SkipForward size={20} /></button>
        <button onClick={(e) => { e.stopPropagation(); stop(); }} className="p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
      </div>
    </div>
  );
};

export default AudioPlayer;
