
import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { surahs } from '../services/quranData';
import { Surah, Verse, QuranBookmark, AudioPlayerContextType } from '../types';
import { AppContext } from '../App';
import { ArrowLeft, ChevronRight, Search, Bookmark, Share2, Edit, Play, Pause, Loader2, X, Info, CheckCircle2, Circle, Trophy, RefreshCw, BookOpen, ArrowDownUp, Type, MessageSquareQuote } from 'lucide-react';
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
            
            // Calculate progress (0 to 1)
            // Adjust calculation based on playback rate if necessary, but audioContext.currentTime flows in real time
            // However, the buffer plays faster if rate > 1. 
            // The buffer.duration is static length. The actual play duration is duration / rate.
            const effectiveDuration = duration / audio.playbackRate;
            const progress = Math.max(0, Math.min(1, elapsed / effectiveDuration));
            
            // Map progress to word index
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
        <div className={`font-serif ${textSizeClass} transition-colors leading-loose`} dir="rtl">
            {words.map((word, i) => (
                <span 
                    key={i} 
                    className={`inline-block mx-0.5 px-0.5 rounded transition-all duration-150 ${
                        i === activeIndex 
                        ? 'text-yellow-600 font-bold scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
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
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal');
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
    
    // Initialize explanation audio
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

  // Scroll to active verse or last read verse logic
  useEffect(() => {
    // Priority 1: Audio playing verse
    if (audio.currentVerse && selectedSurah && audio.currentSurah?.id === selectedSurah.id) {
        scrollToVerse(audio.currentVerse.id);
        saveLastRead(selectedSurah, audio.currentVerse); // Auto-save progress on audio play
    } 
    // Priority 2: Jump to last read if just opened and matching
    else if (selectedSurah && lastRead && lastRead.surahId === selectedSurah.id && !audio.isPlaying) {
        // We use a small timeout to allow rendering
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
              rect.top >= 100 && // Offset for header
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
    // Save last read on click
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
    
    // Stop any main audio if playing
    if (audio.isPlaying) audio.pause();

    // If currently playing this explanation, stop it
    if (activeExplanationId === verse.id) {
        if (explanationAudioRef.current) {
            explanationAudioRef.current.pause();
            setActiveExplanationId(null);
        }
        return;
    }

    setLoadingExplanationId(verse.id);
    
    try {
        // 1. Generate Explanation Text
        const explanationText = await getVerseExplanation(surah.name, verse.number, verse.text);
        
        if (!explanationText) throw new Error("Açıklama üretilemedi.");

        // 2. Generate Audio from that text
        const base64Audio = await generateVerseSpeech(explanationText);

        if (!base64Audio) throw new Error("Ses oluşturulamadı.");

        // 3. Play
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
          case 'large': return 'text-2xl';
          case 'xl': return 'text-3xl';
          default: return 'text-xl';
      }
  };


  if (selectedSurah) {
    const isAnyVerseBookmarked = selectedVerseIds.some(id => bookmarks.some(b => b.id === id));

    return (
      <div className="h-full flex flex-col bg-gray-50 relative animate-in slide-in-from-right-5 duration-300">
        <div className="p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20 flex items-center gap-2">
            <button onClick={() => setSelectedSurah(null)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 leading-tight truncate">{selectedSurah.name} Suresi</h2>
              <p className="text-xs text-gray-500">Nuzul: {selectedSurah.revelationOrder} · {selectedSurah.verses.length} Ayet</p>
            </div>
            
            {/* Speed Control */}
            <button 
                onClick={handleToggleSpeed}
                className="px-2 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"
            >
                {speed}x
            </button>

            {/* Text Size Controls */}
            <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                <button onClick={() => setTextSize('normal')} className={`p-1.5 rounded-md ${textSize === 'normal' ? 'bg-white shadow-sm' : 'text-gray-400'}`}><Type size={14}/></button>
                <button onClick={() => setTextSize('large')} className={`p-1.5 rounded-md ${textSize === 'large' ? 'bg-white shadow-sm' : 'text-gray-400'}`}><Type size={18}/></button>
            </div>

            <button onClick={() => audio.playSurah(selectedSurah)} className={`p-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${audio.currentSurah?.id === selectedSurah.id && (audio.isPlaying || audio.isLoading) ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
               {audio.currentSurah?.id === selectedSurah.id && audio.isLoading ? <Loader2 size={20} className="animate-spin" /> : 
                audio.currentSurah?.id === selectedSurah.id && audio.isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
          {selectedSurah.description && (
            <div className="mb-4 bg-primary-50/50 border border-primary-100 p-4 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-primary-700"/>
                    <h4 className="font-bold text-primary-800">Sure Hakkında</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedSurah.description}</p>
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
                className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                  isSelected ? 'bg-primary-50 border-primary-300 shadow-md ring-1 ring-primary-200' : 
                  isPlaying ? 'bg-amber-50 border-amber-300 shadow-md scale-[1.01]' : 
                  'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isSelected ? 'bg-primary-200 text-primary-800' : isPlaying ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                        {verse.number}
                    </span>
                    {bookmark && <Bookmark size={16} className="text-yellow-500" fill="currentColor" />}
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
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button 
                        onClick={(e) => handlePlayExplanation(e, selectedSurah, verse)}
                        disabled={isLoadingExplanation}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isExplaining ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    >
                        {isLoadingExplanation ? <Loader2 size={14} className="animate-spin" /> : 
                         isExplaining ? <Pause size={14} className="fill-current" /> : 
                         <MessageSquareQuote size={14} />}
                        {isExplaining ? 'Dinleniyor...' : isLoadingExplanation ? 'Hazırlanıyor...' : 'Açıklama'}
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedVerseIds.length > 0 && (
          <div className="fixed bottom-[84px] left-4 right-4 bg-gray-900/95 backdrop-blur-sm text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between z-40 animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-white/10">
             {editingNoteForVerseId ? (
                <div className="flex w-full items-center gap-2">
                    <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Notunuzu yazın..." className="flex-1 bg-gray-800 text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-700"/>
                    <button onClick={handleSaveNote} className="p-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl transition-colors"><Edit size={18}/></button>
                    <button onClick={() => setEditingNoteForVerseId(null)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"><X size={18}/></button>
                </div>
             ) : (
                <div className="flex items-center justify-evenly w-full gap-2">
                    <button onClick={handleBookmark} className={`flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors ${isAnyVerseBookmarked ? 'text-yellow-400' : 'text-gray-200'}`}><Bookmark size={22} fill={isAnyVerseBookmarked ? "currentColor" : "none"} /> <span className="text-[10px] font-medium mt-1">Kaydet</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleStartEditingNote} disabled={selectedVerseIds.length !== 1} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors disabled:opacity-30 text-gray-200"><Edit size={22} /> <span className="text-[10px] font-medium mt-1">Not Al</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleShare} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors text-gray-200"><Share2 size={22} /> <span className="text-[10px] font-medium mt-1">Paylaş</span></button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={handleClearSelection} className="flex flex-col items-center justify-center p-2 rounded-xl w-full active:bg-white/10 transition-colors text-red-300"><X size={22} /> <span className="text-[10px] font-medium mt-1">Kapat</span></button>
                </div>
             )}
          </div>
        )}
        
        {/* Toast Notification */}
        {showToast.visible && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white text-sm font-medium px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400"/>
                {showToast.message}
            </div>
        )}
      </div>
    );
  }
  
  const completionRate = Math.round((completedSurahs.length / 114) * 100);

  return (
    <div className="px-4 h-full flex flex-col relative">
      <div className="pt-4 pb-4 sticky top-0 bg-inherit z-10 space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Kuran-ı Kerim</h2>
                <p className="text-sm text-gray-500">{sortBy === 'MUSHAF' ? 'Mushaf Sıralaması' : 'Nuzul (İniş) Sıralaması'}</p>
            </div>
            
            <button 
                onClick={() => setSortBy(prev => prev === 'MUSHAF' ? 'REVELATION' : 'MUSHAF')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 shadow-sm hover:border-primary-200 hover:text-primary-700 transition-all"
            >
                <ArrowDownUp size={14}/>
                {sortBy === 'MUSHAF' ? 'Nuzul' : 'Mushaf'}
            </button>
        </div>
        
        {/* Last Read Card */}
        {lastRead && (
            <button onClick={handleContinueReading} className="w-full bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/80 group-hover:bg-white/20 transition-colors">
                        <BookOpen size={20}/>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-white/60 font-medium uppercase tracking-wider mb-0.5">Kaldığın Yerden Devam Et</p>
                        <h4 className="font-bold text-lg">{lastRead.surahName} Suresi</h4>
                        <p className="text-sm text-white/80">{lastRead.verseNumber}. Ayet</p>
                    </div>
                </div>
                <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors group-hover:translate-x-1">
                    <ChevronRight size={20}/>
                </div>
            </button>
        )}
        
        {/* Progress Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-100 rounded-xl text-yellow-700 shadow-sm"><Trophy size={20}/></div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">Hatim İlerlemesi</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{completedSurahs.length} / 114 Sure</p>
                    </div>
                </div>
                {completedSurahs.length > 0 && (
                    <button onClick={resetProgress} className="text-xs font-medium text-gray-400 hover:text-red-500 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                        <RefreshCw size={12} /> Sıfırla
                    </button>
                )}
            </div>
            <div className="flex items-end justify-between mb-2 relative z-10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tamamlanan</span>
                <span className="text-2xl font-black text-primary-600">%{completionRate}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden relative z-10">
                <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.3)]" style={{ width: `${completionRate}%` }}></div>
            </div>
        </div>

        <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Sure adı ile ara..." className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm text-sm" />
        </div>
      </div>
      <div className="overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {filteredSurahs.map((surah, index) => {
            const isCompleted = completedSurahs.includes(surah.id);
            const isActive = audio.currentSurah?.id === surah.id;
            return (
              <div
                key={surah.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left border transition-all transform hover:scale-[1.02] active:scale-[0.99] animate-fade-slide-up ${
                    isActive ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-200 shadow-md' :
                    isCompleted ? 'bg-gray-50/50 border-gray-200/60' : 
                    'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                <button onClick={(e) => toggleSurahCompletion(surah.id, e)} className="flex-shrink-0 transition-transform active:scale-90 p-1">
                    {isCompleted ? <CheckCircle2 size={24} className="text-teal-600 fill-teal-50"/> : <Circle size={24} className="text-gray-300 hover:text-gray-400"/>}
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
                  <p className="text-xs font-medium text-gray-400">{surah.verses.length} Ayet</p>
                </button>
                
                <div className="flex items-center gap-1">
                    <button onClick={() => audio.playSurah(surah)} className={`p-2 rounded-full transition-all ${
                        isActive && (audio.isPlaying || audio.isLoading) ? 'bg-primary-600 text-white shadow-md' : 
                        'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}>
                      {isActive && audio.isLoading ? <Loader2 size={18} className="animate-spin"/> : 
                       isActive && audio.isPlaying ? <Pause size={18} className="fill-current"/> :
                       <Play size={18} className="fill-current ml-0.5"/>}
                    </button>
                    <button onClick={() => setSelectedSurah(surah)} className="p-2 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                </div>
              </div>
            );
        })}
      </div>
      
      {/* Toast Notification */}
      {showToast.visible && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white text-sm font-medium px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400"/>
              {showToast.message}
          </div>
      )}
    </div>
  );
};

export default Quran;
