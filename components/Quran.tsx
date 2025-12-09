import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { surahs } from '../services/quranData';
import { Surah, Verse, QuranBookmark, AudioPlayerContextType } from '../types';
import { AppContext } from '../App';
import { ArrowLeft, ChevronRight, Search, Bookmark, Share2, Edit, Play, Pause, Loader2, X, Info, CheckCircle2, Circle, Trophy, RefreshCw, BookOpen, ArrowDownUp, MessageSquareQuote, Gauge } from 'lucide-react';
import { getVerseExplanation, generateVerseSpeech } from '../services/geminiService';

// --- SUB-COMPONENT: WORD HIGHLIGHTER ---
const WordHighlighter: React.FC<{ 
    text: string; 
    isPlaying: boolean; 
    isCurrentVerse: boolean;
    audio: AudioPlayerContextType;
    textSizeClass: string;
}> = ({ text, isPlaying, isCurrentVerse, audio, textSizeClass }) => {
    const words = useMemo(() => text.split(' '), [text]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPlaying || !isCurrentVerse) {
            setActiveIndex(-1);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const updateHighlight = () => {
            const { startTime, duration } = audio.audioTiming;
            if (!startTime || !duration) return;

            const currentTime = audio.getCurrentTime();
            const elapsed = currentTime - startTime;
            
            const effectiveDuration = duration / audio.playbackRate;
            const progress = Math.max(0, Math.min(1, elapsed / effectiveDuration));
            
            const index = Math.floor(progress * words.length);
            setActiveIndex(index);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(updateHighlight);
            }
        };

        rafRef.current = requestAnimationFrame(updateHighlight);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, isCurrentVerse, audio.audioTiming, audio.playbackRate, words.length]);

    return (
        <div className={`font-serif ${textSizeClass} transition-all duration-300 leading-[2.5] text-right`} dir="rtl">
            {words.map((word, i) => (
                <span 
                    key={i} 
                    className={`inline-block mx-1 px-1 rounded transition-all duration-150 ${
                        i === activeIndex 
                        ? 'text-amber-700 bg-amber-100 font-bold scale-110' 
                        : isCurrentVerse ? 'text-gray-900' : 'text-inherit'
                    }`}
                >
                    {word}
                </span>
            ))}
        </div>
    );
};


const Quran: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [editingNoteForVerseId, setEditingNoteForVerseId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [completedSurahs, setCompletedSurahs] = useState<number[]>([]);
  const [showToast, setShowToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [lastRead, setLastRead] = useState<{ surahId: number, verseId: string, surahName: string, verseNumber: number } | null>(null);
  
  // Explanation States
  const [activeExplanationId, setActiveExplanationId] = useState<string | null>(null);
  const [loadingExplanationId, setLoadingExplanationId] = useState<string | null>(null);
  const explanationAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Settings States
  const [sortBy, setSortBy] = useState<'REVELATION' | 'MUSHAF'>('MUSHAF');
  const [textSize, setTextSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [speed, setSpeed] = useState(1.0); // Local state for UI toggle display

  const audio = useContext(AppContext) as AudioPlayerContextType;
  const verseRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    try {
        const savedBookmarks = localStorage.getItem('quran_bookmarks');
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

        const savedProgress = localStorage.getItem('quran_completed_surahs');
        if (savedProgress) setCompletedSurahs(JSON.parse(savedProgress));

        const savedLastRead = localStorage.getItem('quran_last_read');
        if (savedLastRead) setLastRead(JSON.parse(savedLastRead));
    } catch(e) { console.error("Failed to parse Quran data", e); }
    
    explanationAudioRef.current = new Audio();
    explanationAudioRef.current.onended = () => {
        setActiveExplanationId(null);
    };

    return () => {
        if (explanationAudioRef.current) {
            explanationAudioRef.current.pause();
            explanationAudioRef.current = null;
        }
    }
  }, []);

  const saveLastRead = (surah: Surah, verse: Verse) => {
      const data = { surahId: surah.id, verseId: verse.id, surahName: surah.name, verseNumber: verse.number };
      setLastRead(data);
      localStorage.setItem('quran_last_read', JSON.stringify(data));
  };

  useEffect(() => {
    if (audio.currentVerse && selectedSurah && audio.currentSurah?.id === selectedSurah.id) {
        scrollToVerse(audio.currentVerse.id);
        saveLastRead(selectedSurah, audio.currentVerse);
    } 
    else if (selectedSurah && lastRead && lastRead.surahId === selectedSurah.id && !audio.isPlaying) {
        setTimeout(() => {
            scrollToVerse(lastRead.verseId);
        }, 500);
    }
  }, [audio.currentVerse, selectedSurah, audio.currentSurah, lastRead]);

  const scrollToVerse = (verseId: string) => {
      const element = verseRefs.current[verseId];
      if (element) {
          const rect = element.getBoundingClientRect();
          const isInView = (
              rect.top >= 100 && 
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
          );

          if (!isInView) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  };

  useEffect(() => {
      if (showToast.visible) {
          const timer = setTimeout(() => setShowToast({ ...showToast, visible: false }), 2000);
          return () => clearTimeout(timer);
      }
  }, [showToast]);

  const sortedSurahs = useMemo(() => {
      let sorted = [...surahs];
      if (sortBy === 'MUSHAF') {
          sorted.sort((a, b) => a.id - b.id);
      } else {
          sorted.sort((a, b) => a.revelationOrder - b.revelationOrder);
      }
      return sorted;
  }, [sortBy]);

  const filteredSurahs = sortedSurahs.filter(surah => surah.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleToggleVerseSelection = (verse: Verse) => {
    if (selectedSurah) saveLastRead(selectedSurah, verse);

    setSelectedVerseIds(prev => {
        const isSelected = prev.includes(verse.id);
        if (isSelected) return prev.filter(id => id !== verse.id);
        return [...prev, verse.id];
    });
  };

  const handleClearSelection = () => {
    setSelectedVerseIds([]);
    setEditingNoteForVerseId(null);
  }

  const handleShare = () => {
      if (!selectedSurah || selectedVerseIds.length === 0) return;
      const versesToShare = selectedSurah.verses
          .filter(v => selectedVerseIds.includes(v.id))
          .map(v => `"${v.text}" (${selectedSurah.name}, ${v.number})`)
          .join('\n\n');
      
      navigator.share({
          title: `Kuran'dan Ayetler: ${selectedSurah.name} Suresi`,
          text: versesToShare,
      }).catch(err => console.error("Share failed", err));
  };
  
  const handleBookmark = () => {
      if (!selectedSurah) return;
      const newBookmarks = [...bookmarks];
      const versesToProcess = selectedSurah.verses.filter(v => selectedVerseIds.includes(v.id));

      versesToProcess.forEach(verse => {
          const bookmarkIndex = newBookmarks.findIndex(b => b.id === verse.id);
          if (bookmarkIndex > -1) {
              newBookmarks.splice(bookmarkIndex, 1);
          } else {
              newBookmarks.push({
                  id: verse.id,
                  surahName: selectedSurah.name,
                  verseNumber: verse.number,
                  text: verse.text,
                  date: new Date().toISOString(),
              });
          }
      });
      
      setBookmarks(newBookmarks);
      localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
      setShowToast({ message: 'Ayet kaydedildi', visible: true });
  };
  
  const handleStartEditingNote = () => {
      if (selectedVerseIds.length !== 1) return;
      const verseId = selectedVerseIds[0];
      setEditingNoteForVerseId(verseId);
      const existingBookmark = bookmarks.find(b => b.id === verseId);
      setNoteInput(existingBookmark?.note || '');
  };

  const handleSaveNote = () => {
      if (!editingNoteForVerseId) return;
      
      const newBookmarks = [...bookmarks];
      let bookmark = newBookmarks.find(b => b.id === editingNoteForVerseId);

      if (bookmark) {
          bookmark.note = noteInput;
      } else if(selectedSurah){
          const verse = selectedSurah.verses.find(v => v.id === editingNoteForVerseId);
          if(verse){
            newBookmarks.push({
              id: verse.id,
              surahName: selectedSurah.name,
              verseNumber: verse.number,
              text: verse.text,
              note: noteInput,
              date: new Date().toISOString(),
            });
          }
      }
      
      setBookmarks(newBookmarks);
      localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
      setEditingNoteForVerseId(null);
      setNoteInput('');
      setShowToast({ message: 'Not kaydedildi', visible: true });
  };

  const toggleSurahCompletion = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const isCompleted = completedSurahs.includes(id);
      const newCompleted = isCompleted
          ? completedSurahs.filter(c => c !== id) 
          : [...completedSurahs, id];
      setCompletedSurahs(newCompleted);
      localStorage.setItem('quran_completed_surahs', JSON.stringify(newCompleted));
      setShowToast({ message: isCompleted ? 'İşaret kaldırıldı' : 'İlerleme kaydedildi', visible: true });
  };
  
  const resetProgress = () => {
      if (confirm("Tüm hatim ilerlemeniz sıfırlanacak. Emin misiniz?")) {
          setCompletedSurahs([]);
          localStorage.removeItem('quran_completed_surahs');
          setShowToast({ message: 'İlerleme sıfırlandı', visible: true });
      }
  };
  
  const handleContinueReading = () => {
      if (lastRead) {
          const surah = surahs.find(s => s.id === lastRead.surahId);
          if (surah) setSelectedSurah(surah);
      }
  };

  const handleToggleSpeed = () => {
      const newSpeed = speed === 1.0 ? 1.25 : speed === 1.25 ? 0.75 : 1.0;
      setSpeed(newSpeed);
      audio.setPlaybackRate(newSpeed);
  };

  const handlePlayExplanation = async (e: React.MouseEvent, surah: Surah, verse: Verse) => {
    e.stopPropagation();
    if (audio.isPlaying) audio.pause();

    if (activeExplanationId === verse.id) {
        if (explanationAudioRef.current) {
            explanationAudioRef.current.pause();
            setActiveExplanationId(null);
        }
        return;
    }

    setLoadingExplanationId(verse.id);
    
    try {
        const explanationText = await getVerseExplanation(surah.name, verse.number, verse.text);
        if (!explanationText) throw new Error("Açıklama üretilemedi.");

        const base64Audio = await generateVerseSpeech(explanationText);
        if (!base64Audio) throw new Error("Ses oluşturulamadı.");

        if (explanationAudioRef.current) {
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const wavHeader = getWavHeader(bytes.length, 24000);
            const wavBytes = new Uint8Array(wavHeader.length + bytes.length);
            wavBytes.set(wavHeader);
            wavBytes.set(bytes, wavHeader.length);
            
            const url = URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' }));
            explanationAudioRef.current.src = url;
            explanationAudioRef.current.play();
            setActiveExplanationId(verse.id);
        }

    } catch (err) {
        console.error(err);
        setShowToast({ message: 'Açıklama yüklenemedi', visible: true });
    } finally {
        setLoadingExplanationId(null);
    }
  };

  const getWavHeader = (dataLength: number, sampleRate: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); 
    view.setUint16(34, 16, true); 
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    return new Uint8Array(buffer);
  };
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const getTextSizeClass = () => {
      switch(textSize) {
          case 'small': return 'text-xl'; // 20px
          case 'large': return 'text-4xl'; // 36px
          default: return 'text-3xl'; // Normal 30px
      }
  };


  if (selectedSurah) {
    const isAnyVerseBookmarked = selectedVerseIds.some(id => bookmarks.some(b => b.id === id));

    return (
      <div className="h-full flex flex-col bg-sand-100 relative animate-in slide-in-from-right-5 duration-300">
        <div className="p-4 bg-sand-50/80 backdrop-blur-md border-b border-sand-200 shadow-sm sticky top-0 z-20 flex items-center gap-2">
            <button onClick={() => setSelectedSurah(null)} className="p-2 text-gray-500 rounded-full hover:bg-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 leading-tight truncate">{selectedSurah.name} Suresi</h2>
              <p className="text-xs text-gray-500">Nuzul: {selectedSurah.revelationOrder} · {selectedSurah.verses.length} Ayet</p>
            </div>
            
            {/* Text Size Controls */}
            <div className="flex bg-white rounded-lg p-1 mr-2 gap-1 border border-sand-200">
                <button 
                    onClick={() => setTextSize('small')} 
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${textSize === 'small' ? 'bg-sand-100 shadow-sm text-gray-900 font-bold' : 'text-gray-400 font-medium hover:bg-sand-50'}`}
                    title="Küçük"
                >
                    <span className="text-xs">A</span>
                </button>
                <button 
                    onClick={() => setTextSize('normal')} 
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${textSize === 'normal' ? 'bg-sand-100 shadow-sm text-gray-900 font-bold' : 'text-gray-400 font-medium hover:bg-sand-50'}`}
                    title="Normal"
                >
                    <span className="text-sm">A</span>
                </button>
                <button 
                    onClick={() => setTextSize('large')} 
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${textSize === 'large' ? 'bg-sand-100 shadow-sm text-gray-900 font-bold' : 'text-gray-400 font-medium hover:bg-sand-50'}`}
                    title="Büyük"
                >
                    <span className="text-lg">A</span>
                </button>
            </div>

            {/* Speed Control */}
            <button 
                onClick={handleToggleSpeed}
                className="h-8 px-3 rounded-lg text-xs font-bold bg-white text-gray-600 border border-sand-200 hover:bg-sand-50 transition-colors flex items-center gap-1"
                title="Okuma Hızı"
            >
                <Gauge size={14} />
                {speed}x
            </button>

            <button onClick={() => audio.playSurah(selectedSurah)} className={`p-2.5 rounded-full transition-all duration-300 flex-shrink-0 shadow-sm ${audio.currentSurah?.id === selectedSurah.id && (audio.isPlaying || audio.isLoading) ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
               {audio.currentSurah?.id === selectedSurah.id && audio.isLoading ? <Loader2 size={20} className="animate-spin" /> : 
                audio.currentSurah?.id === selectedSurah.id && audio.isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {selectedSurah.description && (
            <div className="mb-6 bg-sand-200/50 border border-sand-300/50 p-5 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-amber-800"/>
                    <h4 className="font-bold text-amber-900">Sure Hakkında</h4>
                </div>
                <p className="text-sm text-amber-900/80 leading-relaxed font-serif">{selectedSurah.description}</p>
            </div>
          )}
          
          {selectedSurah.verses.map((verse) => {
            const isSelected = selectedVerseIds.includes(verse.id);
            const isPlaying = audio.currentVerse?.id === verse.id && audio.isPlaying; 
            const bookmark = bookmarks.find(b => b.id === verse.id);
            const isExplaining = activeExplanationId === verse.id;
            const isLoadingExplanation = loadingExplanationId === verse.id;

            return (
              <div
                key={verse.id}
                ref={el => { if(el) verseRefs.current[verse.id] = el; }}
                onClick={() => handleToggleVerseSelection(verse)}
                className={`relative p-6 rounded-[20px] border transition-all duration-500 cursor-pointer group ${
                  isSelected ? 'bg-sand-50 border-amber-300 shadow-md ring-1 ring-amber-200' : 
                  isPlaying ? 'bg-white border-amber-200 shadow-lg ring-1 ring-amber-100 scale-[1.01]' : 
                  'bg-white border-transparent shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full ${isSelected ? 'bg-amber-100 text-amber-800' : isPlaying ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-500'}`}>
                        {verse.number}
                    </span>
                    {bookmark && <Bookmark size={16} className="text-amber-500" fill="currentColor" />}
                  </div>
                </div>
                
                {/* Word Highlighter Component */}
                <WordHighlighter 
                    text={verse.text} 
                    isPlaying={isPlaying} 
                    isCurrentVerse={audio.currentVerse?.id === verse.id}
                    audio={audio}
                    textSizeClass={getTextSizeClass()}
                />
                
                {/* Actions Row */}
                <div className="mt-6 pt-3 border-t border-gray-50 flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => handlePlayExplanation(e, selectedSurah, verse)}
                        disabled={isLoadingExplanation}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExplaining ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    >
                        {isLoadingExplanation ? <Loader2 size={14} className="animate-spin" /> : 
                         isExplaining ? <Pause size={14} className="fill-current" /> : 
                         <MessageSquareQuote size={14} />}
                        {isExplaining ? 'Dinleniyor...' : isLoadingExplanation ? 'Hazırlanıyor...' : 'Tefsir'}
                    </button>
                </div>
              </div>
            );
        })}
      </div>

        {selectedVerseIds.length > 0 && (
          <div className="fixed bottom-[84px] left-4 right-4 bg-gray-900/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between z-40 animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-white/10">
             {editingNoteForVerseId ? (
                <div className="flex w-full items-center gap-2">
                    <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Notunuzu yazın..." className="flex-1 bg-gray-800 text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 border border-gray-700"/>
                    <button onClick={handleSaveNote} className="p-3 bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"><Edit size={18}/></button>
                    <button onClick={() => setEditingNoteForVerseId(null)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"><X size={18}/></button>
                </div>
             ) : (
                <div className="flex items-center justify-evenly w-full gap-2">
                    <button onClick={handleBookmark} className={`flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors ${isAnyVerseBookmarked ? 'text-amber-400' : 'text-gray-300'}`}><Bookmark size={22} fill={isAnyVerseBookmarked ? "currentColor" : "none"} /> <span className="text-[10px] font-medium mt-1">Kaydet</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleStartEditingNote} disabled={selectedVerseIds.length !== 1} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors disabled:opacity-30 text-gray-300"><Edit size={22} /> <span className="text-[10px] font-medium mt-1">Not Al</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleShare} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors text-gray-300"><Share2 size={22} /> <span className="text-[10px] font-medium mt-1">Paylaş</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleClearSelection} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors text-red-300"><X size={22} /> <span className="text-[10px] font-medium mt-1">Kapat</span></button>
                </div>
             )}
          </div>
        )}
        
        {/* Toast Notification */}
        {showToast.visible && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white text-sm font-medium px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400"/>
                {showToast.message}
            </div>
        )}
      </div>
    );
  }
  
  const completionRate = Math.round((completedSurahs.length / 114) * 100);

  return (
    <div className="px-6 h-full flex flex-col relative bg-sand-50">
      <div className="pt-6 pb-6 sticky top-0 bg-sand-50 z-10 space-y-5">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Kuran-ı Kerim</h2>
                <p className="text-sm text-gray-500 font-medium">{sortBy === 'MUSHAF' ? 'Mushaf Sıralaması' : 'Nuzul (İniş) Sıralaması'}</p>
            </div>
            
            <button 
                onClick={() => setSortBy(prev => prev === 'MUSHAF' ? 'REVELATION' : 'MUSHAF')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 shadow-sm hover:border-primary-200 hover:text-primary-700 transition-all active:scale-95"
            >
                <ArrowDownUp size={14}/>
                {sortBy === 'MUSHAF' ? 'Nuzul' : 'Mushaf'}
            </button>
        </div>
        
        {/* Last Read Card */}
        {lastRead && (
            <button onClick={handleContinueReading} className="w-full bg-gradient-to-r from-gray-800 to-gray-900 p-5 rounded-3xl shadow-xl shadow-gray-200 text-white flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white/90 group-hover:bg-white/20 transition-colors border border-white/10">
                        <BookOpen size={24}/>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Kaldığın Yerden</p>
                        <h4 className="font-bold text-xl leading-none">{lastRead.surahName} Suresi</h4>
                        <p className="text-sm text-white/80 mt-1">{lastRead.verseNumber}. Ayet</p>
                    </div>
                </div>
                <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors group-hover:translate-x-1 relative z-10">
                    <ChevronRight size={20}/>
                </div>
            </button>
        )}
        
        {/* Progress Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm border border-amber-100"><Trophy size={24}/></div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">Hatim İlerlemesi</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{completedSurahs.length} / 114 Sure</p>
                    </div>
                </div>
                {completedSurahs.length > 0 && (
                    <button onClick={resetProgress} className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors uppercase tracking-wide">
                        <RefreshCw size={12} /> Sıfırla
                    </button>
                )}
            </div>
            <div className="flex items-end justify-between mb-2 relative z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamamlanan</span>
                <span className="text-2xl font-black text-primary-600">%{completionRate}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative z-10">
                <div className="bg-gradient-to-r from-primary-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${completionRate}%` }}></div>
            </div>
        </div>

        <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Sure adı ile ara..." className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm text-sm font-medium placeholder-gray-400 transition-shadow" />
        </div>
      </div>
      <div className="overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {filteredSurahs.map((surah, index) => {
            const isCompleted = completedSurahs.includes(surah.id);
            const isActive = audio.currentSurah?.id === surah.id;
            return (
              <div
                key={surah.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`w-full flex items-center gap-4 p-5 rounded-3xl text-left border transition-all transform hover:scale-[1.01] active:scale-[0.99] animate-fade-slide-up ${
                    isActive ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-200 shadow-lg shadow-primary-100' :
                    isCompleted ? 'bg-gray-50/80 border-gray-200/60 opacity-80' : 
                    'bg-white border-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md'
                }`}
              >
                <button onClick={(e) => toggleSurahCompletion(surah.id, e)} className="flex-shrink-0 transition-transform active:scale-90 p-1">
                    {isCompleted ? <CheckCircle2 size={24} className="text-emerald-600 fill-emerald-50"/> : <Circle size={24} className="text-gray-300 hover:text-gray-400"/>}
                </button>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                    isActive ? 'bg-primary-200 text-primary-800' :
                    isCompleted ? 'bg-white text-gray-400 border border-gray-100' : 
                    'bg-gray-100 text-gray-500'
                }`}>
                  {sortBy === 'MUSHAF' ? surah.id : surah.revelationOrder}
                </div>
                
                <button onClick={() => setSelectedSurah(surah)} className="flex-1 text-left min-w-0">
                  <h3 className={`font-bold text-lg truncate ${isCompleted && !isActive ? 'text-gray-500' : 'text-gray-800'}`}>{surah.name} Suresi</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{surah.verses.length} Ayet</p>
                </button>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => audio.playSurah(surah)} className={`p-3 rounded-full transition-all ${
                        isActive && (audio.isPlaying || audio.isLoading) ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 
                        'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600'
                    }`}>
                      {isActive && audio.isLoading ? <Loader2 size={18} className="animate-spin"/> : 
                       isActive && audio.isPlaying ? <Pause size={18} className="fill-current"/> :
                       <Play size={18} className="fill-current ml-0.5"/>}
                    </button>
                </div>
              </div>
            );
        })}
      </div>
      
      {/* Toast Notification */}
      {showToast.visible && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2 border border-white/10">
              <CheckCircle2 size={18} className="text-emerald-400"/>
              {showToast.message}
          </div>
      )}
    </div>
  );
};

export default Quran;