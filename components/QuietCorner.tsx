
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, Wind, CloudRain, Waves, Sparkles, Volume2, Settings2, CheckCircle2, Heart, X, Volume1, ArrowLeft } from 'lucide-react';

// --- DATA & CONFIG ---

const SOUNDS = [
  { id: 'forest', name: 'Huzurlu Orman', src: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_a84f60f64c.mp3', icon: Wind, color: 'bg-emerald-500' },
  { id: 'rain', name: 'Yumuşak Yağmur', src: 'https://cdn.pixabay.com/download/audio/2022/08/11/audio_eb7f7b34b7.mp3', icon: CloudRain, color: 'bg-blue-500' },
  { id: 'waves', name: 'Sakin Dalgalar', src: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_34193d551c.mp3', icon: Waves, color: 'bg-cyan-600' },
  { id: 'drone', name: 'Derin Odak', src: 'https://cdn.pixabay.com/download/audio/2022/11/17/audio_855737190b.mp3', icon: Sparkles, color: 'bg-violet-600' },
  { id: 'silence', name: 'Tam Sessizlik', src: '', icon: Volume1, color: 'bg-gray-600' },
];

const TECHNIQUES = [
    { 
        id: 'resonance', 
        name: 'Denge (Rezonans)', 
        desc: 'Kalp ritmini dengeler, stresi azaltır.', 
        pattern: [5, 0, 5, 0], // In, Hold, Out, Hold
        text: ['Nefes Al', '', 'Nefes Ver', '']
    },
    { 
        id: 'relax', 
        name: 'Rahatlama (4-7-8)', 
        desc: 'Sinir sistemini yatıştırır, uykuya hazırlar.', 
        pattern: [4, 7, 8, 0], 
        text: ['Burnundan Al', 'Tut', 'Ağzından Ver', '']
    },
    { 
        id: 'box', 
        name: 'Odak (Kutu)', 
        desc: 'Zihni berraklaştırır, konsantrasyonu artırır.', 
        pattern: [4, 4, 4, 4], 
        text: ['Nefes Al', 'Tut', 'Nefes Ver', 'Tut']
    }
];

// --- COMPONENTS ---

const QuietCorner: React.FC = () => {
    // Session Config State
    const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
    const [selectedTechnique, setSelectedTechnique] = useState(TECHNIQUES[0]);
    const [durationMinutes, setDurationMinutes] = useState(5);
    const [volume, setVolume] = useState(0.5);

    // Active Session State
    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED'>('IDLE');
    const [timeLeft, setTimeLeft] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0); // 0:In, 1:Hold, 2:Out, 3:Hold
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    
    // Refs
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const timerRef = useRef<number | null>(null);
    const phaseTimerRef = useRef<number | null>(null);

    // --- AUDIO MANAGEMENT ---
    useEffect(() => {
        const audio = audioRef.current;
        audio.loop = true;
        
        if (selectedSound.id !== 'silence') {
            audio.src = selectedSound.src;
        } else {
            audio.src = '';
        }

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [selectedSound]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (status === 'RUNNING' && selectedSound.id !== 'silence') {
            audio.play().catch(e => console.error("Audio play failed", e));
        } else {
            audio.pause();
        }
    }, [status, selectedSound]);

    // --- TIMER & BREATHING LOGIC ---
    const startNextPhase = useCallback(() => {
        setPhaseIndex(prev => {
            const nextIndex = (prev + 1) % 4;
            // Skip phases with 0 duration (e.g., hold phases in simple breathing)
            if (selectedTechnique.pattern[nextIndex] === 0) {
                return (nextIndex + 1) % 4;
            }
            return nextIndex;
        });
    }, [selectedTechnique]);

    // Reset phase logic when technique changes or starts
    useEffect(() => {
        setPhaseIndex(0);
        setPhaseTimeLeft(selectedTechnique.pattern[0]);
    }, [selectedTechnique, status]);

    // Update Phase duration when phase changes
    useEffect(() => {
        setPhaseTimeLeft(selectedTechnique.pattern[phaseIndex]);
    }, [phaseIndex, selectedTechnique]);

    // Main Loop
    useEffect(() => {
        if (status === 'RUNNING') {
            timerRef.current = window.setInterval(() => {
                // 1. Session Timer
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        finishSession();
                        return 0;
                    }
                    return prev - 1;
                });

                // 2. Breathing Phase Timer
                setPhaseTimeLeft(prev => {
                    if (prev <= 1) {
                        startNextPhase();
                        // Return the duration of the *next* phase to avoid a render glitch? 
                        // Actually better to let the useEffect[phaseIndex] handle the reset, 
                        // but we need to prevent negative drift.
                        // For smooth UI, we rely on CSS transitions mostly, this timer syncs state.
                        return 0; 
                    }
                    return prev - 1;
                });

            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, startNextPhase]);

    const finishSession = () => {
        setStatus('FINISHED');
        // Save stats
        try {
            const currentTotal = parseInt(localStorage.getItem('total_meditation_minutes') || '0');
            localStorage.setItem('total_meditation_minutes', (currentTotal + durationMinutes).toString());
        } catch(e) {}
    };

    const handleStart = () => {
        setTimeLeft(durationMinutes * 60);
        setPhaseIndex(0);
        setPhaseTimeLeft(selectedTechnique.pattern[0]);
        setStatus('RUNNING');
    };

    const handleReset = () => {
        setStatus('IDLE');
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- RENDER HELPERS ---

    const getCircleScale = () => {
        if (phaseIndex === 0) return 'scale-125'; // Inhale -> Grow
        if (phaseIndex === 1) return 'scale-125'; // Hold -> Stay big
        if (phaseIndex === 2) return 'scale-75';  // Exhale -> Shrink
        return 'scale-75';                        // Hold -> Stay small
    };

    const getPhaseText = () => {
        return selectedTechnique.text[phaseIndex];
    };
    
    const getPhaseColor = () => {
        if (phaseIndex === 0) return 'text-emerald-300';
        if (phaseIndex === 2) return 'text-blue-300';
        return 'text-white';
    };

    // --- VIEW: CONFIGURATION (IDLE) ---
    if (status === 'IDLE') {
        return (
            <div className="h-full flex flex-col bg-gray-900 text-white overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="p-6 pt-8 pb-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Sessizlik Köşesi</h1>
                    <p className="text-gray-400 text-sm mt-1">Zihnini sustur, ruhunu dinlendir.</p>
                </div>

                <div className="flex-1 px-6 pb-24 space-y-8">
                    
                    {/* Duration Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Süre</label>
                            <span className="text-xl font-mono font-bold text-emerald-400">{durationMinutes} dk</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="60" 
                            step="1"
                            value={durationMinutes} 
                            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    {/* Technique Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Nefes Tekniği</label>
                        <div className="grid grid-cols-1 gap-3">
                            {TECHNIQUES.map(tech => (
                                <button 
                                    key={tech.id}
                                    onClick={() => setSelectedTechnique(tech)}
                                    className={`text-left p-4 rounded-2xl border transition-all ${selectedTechnique.id === tech.id ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`font-bold ${selectedTechnique.id === tech.id ? 'text-emerald-400' : 'text-white'}`}>{tech.name}</h3>
                                        {selectedTechnique.id === tech.id && <CheckCircle2 size={18} className="text-emerald-400"/>}
                                    </div>
                                    <p className="text-xs text-gray-400">{tech.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sound Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ortam Sesi</label>
                        <div className="grid grid-cols-3 gap-3">
                            {SOUNDS.map(sound => (
                                <button 
                                    key={sound.id}
                                    onClick={() => setSelectedSound(sound)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all aspect-square ${selectedSound.id === sound.id ? `${sound.color} bg-opacity-20 border-${sound.color.split('-')[1]}-500 text-white` : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'}`}
                                >
                                    <sound.icon size={24} className="mb-2"/>
                                    <span className="text-[10px] font-bold text-center leading-tight">{sound.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <div className="fixed bottom-[84px] left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent">
                    <button 
                        onClick={handleStart}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Play fill="currentColor" /> Başla
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW: ACTIVE SESSION (RUNNING / PAUSED) ---
    if (status === 'RUNNING' || status === 'PAUSED') {
        const bgGradient = selectedSound.id === 'forest' ? 'from-emerald-900 to-black' :
                           selectedSound.id === 'rain' ? 'from-slate-900 to-black' :
                           selectedSound.id === 'waves' ? 'from-cyan-900 to-black' :
                           selectedSound.id === 'drone' ? 'from-violet-900 to-black' :
                           'from-gray-900 to-black';

        return (
            <div className={`h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b ${bgGradient} text-white relative overflow-hidden transition-colors duration-1000`}>
                
                {/* Top Controls */}
                <div className="w-full flex justify-between items-center z-10">
                    <button onClick={handleReset} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm"><X size={20}/></button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-full backdrop-blur-sm border border-white/10">
                        <selectedSound.icon size={14} className="text-emerald-400"/>
                        <span className="text-xs font-bold tracking-wide">{selectedSound.name}</span>
                    </div>
                    <div className="relative group">
                        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm"><Volume2 size={20}/></button>
                        {/* Volume Popup */}
                        <div className="absolute top-full right-0 mt-2 p-3 bg-gray-800 rounded-xl border border-gray-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity w-32">
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Visualizer */}
                <div className="flex-1 flex flex-col items-center justify-center w-full relative z-0">
                    {/* Breath Circle */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        {/* Outer Glows */}
                        <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 transition-all duration-[4000ms] ease-in-out ${getCircleScale()} ${selectedSound.color}`}></div>
                        <div className={`absolute inset-4 rounded-full border-2 border-white/10 transition-all duration-[4000ms] ease-in-out ${getCircleScale()}`}></div>
                        
                        {/* Main Circle */}
                        <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-2xl transition-transform duration-[4000ms] ease-in-out ${getCircleScale()}`}>
                            <p className={`text-2xl font-bold transition-colors duration-500 ${getPhaseColor()}`}>
                                {getPhaseText()}
                            </p>
                            <p className="text-xs text-white/50 mt-1 font-mono uppercase tracking-widest">{selectedTechnique.name}</p>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="mt-12 text-center">
                        <p className="text-5xl font-mono font-bold tracking-tight text-white/90">{formatTime(timeLeft)}</p>
                        <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Kalan Süre</p>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="w-full max-w-xs z-10 pb-20">
                    <button 
                        onClick={() => setStatus(status === 'RUNNING' ? 'PAUSED' : 'RUNNING')}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {status === 'RUNNING' ? <Pause fill="currentColor"/> : <Play fill="currentColor"/>}
                        <span className="font-bold">{status === 'RUNNING' ? 'Duraklat' : 'Devam Et'}</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW: FINISHED ---
    if (status === 'FINISHED') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-900 text-white text-center pb-24 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                    <Sparkles size={48} />
                </div>
                <h2 className="text-4xl font-bold mb-2">Maşallah</h2>
                <p className="text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Kendine ayırdığın bu {durationMinutes} dakika, ruhun için bir şifadır.
                </p>
                
                <div className="mt-12 w-full max-w-xs space-y-3">
                    <button onClick={handleStart} className="w-full py-3 bg-emerald-600 rounded-xl font-bold shadow-lg shadow-emerald-900/50">Tekrarla</button>
                    <button onClick={handleReset} className="w-full py-3 bg-gray-800 rounded-xl font-bold text-gray-300">Ana Menü</button>
                </div>
            </div>
        );
    }

    return null;
};

export default QuietCorner;
