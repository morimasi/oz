
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dhikr } from '../types';
import { Plus, Trash2, Check, RotateCcw, HandHeart, X, ArrowLeft, Trophy } from 'lucide-react';

const DEFAULT_DHIKRS: Dhikr[] = [
  { id: 'subhanallah', text: 'Sübhanallah', target: 33, isCustom: false },
  { id: 'alhamdulillah', text: 'Elhamdülillah', target: 33, isCustom: false },
  { id: 'allahuakbar', text: 'Allahu Ekber', target: 33, isCustom: false },
  { id: 'lailahaillallah', text: 'La ilahe illallah', target: 100, isCustom: false },
  { id: 'salawat', text: 'Allahümme salli alâ seyyidinâ Muhammed', target: 100, isCustom: false },
];

const CircularProgress: React.FC<{ progress: number; size?: number; strokeWidth?: number; }> = ({ progress, size = 280, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100 * circumference);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                className="text-primary-600"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
        </svg>
    );
};

interface DhikrCounterProps {
    onBack?: () => void;
}

const DhikrCounter: React.FC<DhikrCounterProps> = ({ onBack }) => {
  const [dhikrs, setDhikrs] = useState<Dhikr[]>([]);
  const [currentDhikr, setCurrentDhikr] = useState<Dhikr | null>(null);
  const [count, setCount] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [newDhikrText, setNewDhikrText] = useState('');
  const [newDhikrTarget, setNewDhikrTarget] = useState(100);
  const [showCompletion, setShowCompletion] = useState(false);
  
  // Audio Context for feedback sound
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const savedDhikrs = localStorage.getItem('dhikr_list');
      const customDhikrs = savedDhikrs ? JSON.parse(savedDhikrs) : [];
      setDhikrs([...DEFAULT_DHIKRS, ...customDhikrs]);

      const savedProgress = localStorage.getItem('dhikr_progress');
      if (savedProgress) {
        const { dhikrId, count } = JSON.parse(savedProgress);
        const allDhikrs = [...DEFAULT_DHIKRS, ...customDhikrs];
        const activeDhikr = allDhikrs.find(d => d.id === dhikrId);
        if (activeDhikr) {
          setCurrentDhikr(activeDhikr);
          setCount(count);
        }
      } else {
         setCurrentDhikr(DEFAULT_DHIKRS[0]);
         setCount(0);
      }
    } catch (e) {
      console.error("Failed to load dhikr data, resetting.", e);
      setDhikrs(DEFAULT_DHIKRS);
      setCurrentDhikr(DEFAULT_DHIKRS[0]);
    }
    
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
        if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, []);

  useEffect(() => {
    if (currentDhikr) {
      localStorage.setItem('dhikr_progress', JSON.stringify({ dhikrId: currentDhikr.id, count }));
    }
  }, [count, currentDhikr]);
  
  const playCompletionSound = () => {
      if (!audioContextRef.current) return;
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
      }
      
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioContextRef.current.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, audioContextRef.current.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
      
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.5);
  };

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    
    if (currentDhikr && newCount === currentDhikr.target) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playCompletionSound();
        setShowCompletion(true);
        setTimeout(() => setShowCompletion(false), 3000); // Hide after 3s
    } else {
        if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  const handleReset = () => {
    setCount(0);
     if (navigator.vibrate) navigator.vibrate(50);
  };
  
  const handleSelectDhikr = (dhikr: Dhikr) => {
    if (currentDhikr?.id !== dhikr.id) {
        setCurrentDhikr(dhikr);
        setCount(0);
    }
    setIsPickerOpen(false);
  };
  
  const handleAddDhikr = () => {
    if (!newDhikrText.trim()) return;
    const newDhikr: Dhikr = {
        id: `custom_${Date.now()}`,
        text: newDhikrText.trim(),
        target: newDhikrTarget,
        isCustom: true
    };
    const updatedDhikrs = [...dhikrs, newDhikr];
    setDhikrs(updatedDhikrs);
    localStorage.setItem('dhikr_list', JSON.stringify(updatedDhikrs.filter(d => d.isCustom)));
    setNewDhikrText('');
    setNewDhikrTarget(100);
  };
  
  const handleDeleteDhikr = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedDhikrs = dhikrs.filter(d => d.id !== id);
    setDhikrs(updatedDhikrs);
    localStorage.setItem('dhikr_list', JSON.stringify(updatedDhikrs.filter(d => d.isCustom)));
    if (currentDhikr?.id === id) {
        setCurrentDhikr(DEFAULT_DHIKRS[0]);
        setCount(0);
    }
  };

  const progress = useMemo(() => {
    if (!currentDhikr || currentDhikr.target === 0) return 0;
    return Math.min((count / currentDhikr.target) * 100, 100);
  }, [count, currentDhikr]);
  
  const isTargetCompleted = currentDhikr && count >= currentDhikr.target;


  return (
    <div className="h-full flex flex-col items-center justify-between p-4 bg-gray-50 relative">
      <div className="w-full flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
           {onBack && (
               <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                   <ArrowLeft size={24} />
               </button>
           )}
           <div className="flex items-center gap-2">
               <HandHeart size={20} className="text-primary-700" />
               <h1 className="text-xl font-bold text-gray-800">Zikirmatik</h1>
           </div>
        </div>
        <button onClick={handleReset} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full active:scale-95 transition-transform"><RotateCcw size={20} /></button>
      </div>

      {/* Completion Overlay */}
      {showCompletion && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
              <div className="bg-white/90 backdrop-blur-md rounded-full w-64 h-64 flex flex-col items-center justify-center shadow-2xl border-4 border-green-400">
                  <Trophy size={64} className="text-yellow-500 mb-2 animate-bounce"/>
                  <h3 className="text-2xl font-bold text-green-600">Hedef Tamam!</h3>
                  <p className="text-gray-500 font-medium mt-1">{currentDhikr?.target} / {currentDhikr?.target}</p>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-0">
        <div className="relative flex items-center justify-center">
            <CircularProgress progress={progress} />
            <div className="absolute w-full h-full flex items-center justify-center">
                 <button onClick={handleIncrement} className="w-[80%] h-[80%] bg-white rounded-full shadow-lg active:shadow-inner active:scale-95 transition-all flex items-center justify-center text-gray-800 font-mono font-bold text-7xl select-none touch-manipulation">
                    {count}
                 </button>
            </div>
        </div>
      </div>
      
      <div className="w-full max-w-sm flex flex-col items-center gap-4 relative z-10">
        <p className={`font-semibold text-lg transition-colors ${isTargetCompleted ? 'text-primary-600' : 'text-gray-400'}`}>
            Hedef: {currentDhikr?.target} {isTargetCompleted && <Check className="inline mb-1 ml-1" size={20} />}
        </p>
        <h2 className="text-2xl font-serif text-center font-bold text-gray-800 h-16 px-4 flex items-center justify-center">{currentDhikr?.text}</h2>

        <button onClick={() => setIsPickerOpen(true)} className="w-full py-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-200 font-semibold active:scale-[0.98] transition-transform">
            Tesbihatı Değiştir
        </button>
      </div>

      {isPickerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end animate-in fade-in duration-300">
            <div className="w-full bg-gray-50 rounded-t-3xl max-h-[80%] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Tesbihat Seç</h3>
                    <button onClick={() => setIsPickerOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto p-4 space-y-2">
                    {dhikrs.map(dhikr => (
                        <button key={dhikr.id} onClick={() => handleSelectDhikr(dhikr)} className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-colors ${currentDhikr?.id === dhikr.id ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-100 hover:border-primary-200'}`}>
                            <div>
                                <p className="font-semibold text-gray-800">{dhikr.text}</p>
                                <p className="text-sm text-gray-500">Hedef: {dhikr.target}</p>
                            </div>
                            {dhikr.isCustom && (
                                <button onClick={(e) => handleDeleteDhikr(dhikr.id, e)} className="p-2 text-gray-300 hover:text-red-500 rounded-full">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </button>
                    ))}
                </div>
                 <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                    <h4 className="font-bold text-gray-700">Yeni Zikir Ekle</h4>
                    <input type="text" value={newDhikrText} onChange={e => setNewDhikrText(e.target.value)} placeholder="Zikir metni..." className="w-full p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-primary-500 outline-none" />
                    <div className="flex items-center gap-2">
                       <label className="text-sm font-medium text-gray-600">Hedef:</label>
                       <input type="number" value={newDhikrTarget} onChange={e => setNewDhikrTarget(Math.max(1, parseInt(e.target.value) || 1))} placeholder="Hedef" className="w-24 p-2 text-center bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-primary-500 outline-none" />
                       <button onClick={handleAddDhikr} className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2"><Plus size={18} /> Ekle</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DhikrCounter;
