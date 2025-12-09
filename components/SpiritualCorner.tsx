
import React, { useState, useEffect, useMemo, useRef } from 'react';
import DhikrCounter from './DhikrCounter';
import DuaLibrary from './DuaLibrary';
import EsmaulHusna from './EsmaulHusna';
import { esmaulHusna } from '../services/esmaulhusnaData';
import { quranAdviceList } from '../services/quranAdviceData';
import { 
    HandHeart, HelpingHand, Gem, ChevronRight, MoonStar, 
    Activity, Play, Sparkles, HeartHandshake, Gift, 
    ArrowRight, BookOpen, Quote, CalendarDays, ScrollText, ArrowLeft, Star,
    Compass, BookCheck, MapPin, CheckCircle2, XCircle, RotateCcw, Award, Lightbulb, Book
} from 'lucide-react';

// --- TYPES & DATA ---

type ViewState = 'MENU' | 'DHIKR' | 'DUA' | 'ESMA' | 'QURAN_ADVICE' | 'CALENDAR' | 'QIBLA' | 'QUIZ' | 'WISDOM';

const SADAKA_SUGGESTIONS = [
    "Bir yakınına tebessüm et (Sadakadır).",
    "Yoldaki bir taşı kenara çek.",
    "Bir sokak hayvanına su ver.",
    "Ailene güzel bir söz söyle.",
    "Tanımadığın birine selam ver.",
    "Bugün öfkeni yut.",
    "Bir arkadaşının derdini dinle.",
    "İlmini başkasıyla paylaş."
];

const WISDOM_QUOTES = [
    { id: 1, text: "Dün zekiydim, dünyayı değiştirmek isterdim. Bugün bilgeyim, kendimi değiştiriyorum.", source: "Mevlana Celaleddin Rumi" },
    { id: 2, text: "Edep, aklın tercümanıdır. Herkes edebi kadar akıllı, aklı kadar şerefli, şerefi kadar kıymetlidir.", source: "Şems-i Tebrizi" },
    { id: 3, text: "Dilini terbiye etmeden önce yüreğini terbiye et; çünkü söz yürekten gelir, dilden çıkar.", source: "Mevlana Celaleddin Rumi" },
    { id: 4, text: "İlim üç şeydir: Zikreden dil, şükreden kalp, sabreden beden.", source: "Şems-i Tebrizi" },
    { id: 5, text: "Gönül, Allah'ın evidir; onu başkasına verme.", source: "Yunus Emre" },
    { id: 6, text: "Cahil kimsenin yanında kitap gibi sessiz ol.", source: "Mevlana Celaleddin Rumi" },
    { id: 7, text: "Kusur görenindir.", source: "Mevlana Celaleddin Rumi" },
    { id: 8, text: "Neyi arıyorsan O'sun sen.", source: "Mevlana Celaleddin Rumi" },
    { id: 9, text: "Aşkın mezhebi olmaz.", source: "Mevlana Celaleddin Rumi" },
    { id: 10, text: "Yaratılanı hoş gör, Yaradan'dan ötürü.", source: "Yunus Emre" }
];

const RELIGIOUS_DAYS = [
    { name: "Regaib Kandili", date: "2025-01-02", hijri: "1 Recep 1446" },
    { name: "Miraç Kandili", date: "2025-01-26", hijri: "27 Recep 1446" },
    { name: "Berat Kandili", date: "2025-02-13", hijri: "15 Şaban 1446" },
    { name: "Ramazan Başlangıcı", date: "2025-03-01", hijri: "1 Ramazan 1446" },
    { name: "Kadir Gecesi", date: "2025-03-26", hijri: "27 Ramazan 1446" },
    { name: "Ramazan Bayramı", date: "2025-03-30", hijri: "1 Şevval 1446" },
    { name: "Kurban Bayramı", date: "2025-06-06", hijri: "10 Zilhicce 1446" },
    { name: "Aşure Günü", date: "2025-07-06", hijri: "10 Muharrem 1447" },
    { name: "Mevlid Kandili", date: "2025-09-03", hijri: "12 Rebiülevvel 1447" }
];

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "Kur'an-ı Kerim'in kalbi olarak bilinen sure hangisidir?",
        options: ["Fatiha", "Yasin", "Bakara", "İhlas"],
        correct: 1
    },
    {
        id: 2,
        question: "İlk inen ayetler hangi surededir?",
        options: ["Alak", "Müddessir", "Fatiha", "Bakara"],
        correct: 0
    },
    {
        id: 3,
        question: "Peygamber Efendimiz (s.a.v) hangi tarihte doğmuştur?",
        options: ["571", "610", "622", "632"],
        correct: 0
    },
    {
        id: 4,
        question: "Namazın farzlarından biri olan 'Kıyam' ne demektir?",
        options: ["Eğilmek", "Ayakta durmak", "Oturmak", "Secde etmek"],
        correct: 1
    },
    {
        id: 5,
        question: "Zekat kimlere verilmez?",
        options: ["Fakirlere", "Borçlulara", "Anne-Babaya", "Yolda kalmışlara"],
        correct: 2
    }
];

// --- SUB-COMPONENTS ---

const QuranAdviceView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="flex flex-col h-full bg-gray-50 pt-6 px-4 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Kur'an'dan Öğütler</h2>
                <p className="text-xs text-gray-500">Hayatın içinden İlahi rehberlik</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 space-y-4 no-scrollbar">
            {quranAdviceList.map((item, i) => (
                <div key={item.id} style={{ animationDelay: `${i * 50}ms` }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wide">{item.category}</span>
                    </div>
                    <div className="mb-3">
                        <Quote size={20} className="text-emerald-200 fill-emerald-50 mb-1 inline-block mr-2" />
                        <span className="text-lg font-serif text-gray-800 leading-relaxed">"{item.text}"</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400 italic">💡 {item.context}</p>
                        <span className="text-xs font-bold text-gray-600">{item.source}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const WisdomView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="flex flex-col h-full bg-gray-50 pt-6 px-4 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Hikmet Kapısı</h2>
                <p className="text-xs text-gray-500">Gönül sultanlarından inciler</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 space-y-4 no-scrollbar">
            {WISDOM_QUOTES.map((quote, i) => (
                <div key={quote.id} style={{ animationDelay: `${i * 50}ms` }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="relative z-10">
                        <Lightbulb size={24} className="text-amber-400 mb-3" />
                        <p className="text-lg font-serif text-gray-800 leading-relaxed italic mb-4">"{quote.text}"</p>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-px bg-amber-200"></div>
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{quote.source}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CalendarView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const today = new Date();
    
    const upcomingEvents = RELIGIOUS_DAYS.filter(day => new Date(day.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const getDaysLeft = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 pt-6 px-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dini Günler</h2>
                    <p className="text-xs text-gray-500">Mübarek zaman dilimleri</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-24 space-y-4 no-scrollbar">
                {/* Hero: Next Event */}
                {upcomingEvents.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="relative z-10 text-center">
                            <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Sıradaki Mübarek Gün</span>
                            <h3 className="text-3xl font-bold mt-2 mb-1">{upcomingEvents[0].name}</h3>
                            <p className="text-indigo-100 text-sm mb-4">{new Date(upcomingEvents[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                                <span className="text-2xl font-mono font-bold">{getDaysLeft(upcomingEvents[0].date)}</span> <span className="text-xs">Gün Kaldı</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {RELIGIOUS_DAYS.map((day, i) => {
                        const isPast = new Date(day.date) < today;
                        const daysLeft = getDaysLeft(day.date);
                        
                        return (
                            <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div>
                                    <h4 className="font-bold text-gray-800">{day.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · <span className="text-indigo-500">{day.hijri}</span></p>
                                </div>
                                {!isPast && (
                                    <div className="text-center bg-gray-50 px-3 py-1.5 rounded-lg min-w-[60px]">
                                        <span className="block text-lg font-bold text-gray-800 leading-none">{daysLeft}</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Gün</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const QiblaView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [heading, setHeading] = useState(0);
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Kaaba Coordinates
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    useEffect(() => {
        // 1. Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const bearing = calculateQibla(latitude, longitude);
                    setQiblaBearing(bearing);
                },
                (err) => {
                    setError("Konum izni alınamadı. Kıble açısı hesaplanamıyor.");
                }
            );
        } else {
            setError("Cihazınız konum servisini desteklemiyor.");
        }
    }, []);

    const handleRequestPermission = () => {
        // DeviceOrientation permission for iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            (DeviceOrientationEvent as any).requestPermission()
                .then((permissionState: string) => {
                    if (permissionState === 'granted') {
                        setPermissionGranted(true);
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        setError("Pusula izni reddedildi.");
                    }
                })
                .catch(console.error);
        } else {
            // Android / Older iOS
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
        const e = event as any;
        if (e.webkitCompassHeading) {
            // iOS
            setHeading(e.webkitCompassHeading);
        } else if (event.alpha) {
            // Android (alpha is not exactly compass heading, needs compensation usually, simplified here)
            setHeading(360 - event.alpha);
        }
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    const calculateQibla = (lat: number, lng: number) => {
        const phiK = KAABA_LAT * Math.PI / 180.0;
        const lambdaK = KAABA_LNG * Math.PI / 180.0;
        const phi = lat * Math.PI / 180.0;
        const lambda = lng * Math.PI / 180.0;
        const psi = 180.0 / Math.PI * Math.atan2(Math.sin(lambdaK - lambda), Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda));
        return Math.round(psi);
    };

    const rotateDegree = qiblaBearing ? qiblaBearing - heading : 0;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white pt-6 px-4 animate-in slide-in-from-right duration-300 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-full"><ArrowLeft size={24}/></button>
                <div>
                    <h2 className="text-2xl font-bold">Kıble Bulucu</h2>
                    <p className="text-xs text-slate-400">Yüzünü Kabe'ye dön</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-20">
                {error ? (
                    <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <XCircle size={32} className="mx-auto text-red-500 mb-2"/>
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                ) : !permissionGranted && typeof (DeviceOrientationEvent as any).requestPermission === 'function' ? (
                    <div className="text-center">
                        <Compass size={64} className="mx-auto text-emerald-500 mb-4 animate-pulse"/>
                        <p className="mb-6 text-slate-300">Pusulayı kalibre etmek için izne ihtiyacımız var.</p>
                        <button onClick={handleRequestPermission} className="px-6 py-3 bg-emerald-600 rounded-xl font-bold shadow-lg hover:bg-emerald-500 transition-colors">
                            Pusulayı Aç
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative w-72 h-72 rounded-full border-4 border-slate-700 bg-slate-800 shadow-2xl flex items-center justify-center transition-transform duration-300 ease-out" style={{ transform: `rotate(${-heading}deg)` }}>
                            {/* Dial Marks */}
                            {[0, 90, 180, 270].map(deg => (
                                <div key={deg} className="absolute w-full h-full flex justify-center pt-2" style={{ transform: `rotate(${deg}deg)` }}>
                                    <span className="text-xs font-bold text-slate-500">{deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W'}</span>
                                </div>
                            ))}
                            
                            {/* Qibla Indicator */}
                            {qiblaBearing !== null && (
                                <div className="absolute w-full h-full flex justify-center items-start pt-4 transition-transform duration-500" style={{ transform: `rotate(${qiblaBearing}deg)` }}>
                                    <div className="flex flex-col items-center">
                                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                        <div className="w-12 h-12 mt-1 bg-black rounded-lg border-2 border-emerald-500 flex items-center justify-center">
                                            <div className="w-8 h-8 border border-white/20 rounded-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Center Dot */}
                            <div className="w-4 h-4 bg-white rounded-full z-10 shadow-sm"></div>
                        </div>
                        
                        <div className="mt-12 text-center">
                            <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Kıble Açısı</p>
                            <p className="text-4xl font-mono font-bold text-emerald-400">{qiblaBearing ? `${qiblaBearing}°` : '--'}</p>
                            {Math.abs(rotateDegree) < 5 && qiblaBearing && (
                                <div className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full inline-flex items-center gap-2 animate-bounce">
                                    <CheckCircle2 size={16}/> Doğru Yöndesin
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const QuizView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);
        if (index === QUIZ_QUESTIONS[currentQuestion].correct) {
            setScore(score + 1);
        }
        
        setTimeout(() => {
            if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                setShowScore(true);
            }
        }, 1500);
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowScore(false);
        setSelectedOption(null);
        setIsAnswered(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 pt-6 px-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bilgi Testi</h2>
                    <p className="text-xs text-gray-500">İlmihalini tazele</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center pb-24">
                {showScore ? (
                    <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100 animate-in zoom-in duration-300">
                        <Award size={64} className="mx-auto text-yellow-500 mb-4"/>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Tebrikler!</h3>
                        <p className="text-gray-500 mb-6">Toplam {QUIZ_QUESTIONS.length} sorudan</p>
                        <div className="text-5xl font-black text-primary-600 mb-8">{score} <span className="text-xl text-gray-400 font-medium">Doğru</span></div>
                        <button onClick={resetQuiz} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                            <RotateCcw size={18}/> Tekrar Dene
                        </button>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold text-gray-400 uppercase">Soru {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}></div>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-8 leading-relaxed">
                            {QUIZ_QUESTIONS[currentQuestion].question}
                        </h3>

                        <div className="space-y-3">
                            {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = QUIZ_QUESTIONS[currentQuestion].correct === idx;
                                let btnClass = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                                
                                if (isAnswered) {
                                    if (isCorrect) btnClass = "bg-green-100 border-green-300 text-green-800";
                                    else if (isSelected && !isCorrect) btnClass = "bg-red-100 border-red-300 text-red-800";
                                    else btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                                }

                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={isAnswered}
                                        className={`w-full text-left p-4 rounded-xl border font-medium transition-all ${btnClass} flex justify-between items-center`}
                                    >
                                        {option}
                                        {isAnswered && isCorrect && <CheckCircle2 size={18} className="text-green-600"/>}
                                        {isAnswered && isSelected && !isCorrect && <XCircle size={18} className="text-red-600"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const SpiritualCorner: React.FC = () => {
    const [activeView, setActiveView] = useState<ViewState>('MENU');
    const [lastDhikr, setLastDhikr] = useState<{name: string, count: number, target: number} | null>(null);
    const [randomSadaka, setRandomSadaka] = useState('');

    // Derived Data for Daily Esma
    const todayDateObj = new Date();
    const dayOfYear = Math.floor((todayDateObj.getTime() - new Date(todayDateObj.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const dailyEsma = useMemo(() => esmaulHusna[dayOfYear % esmaulHusna.length], [dayOfYear]);

    useEffect(() => {
        // Load Last Dhikr Info
        try {
            const progressStr = localStorage.getItem('dhikr_progress');
            const listStr = localStorage.getItem('dhikr_list');
            
            if (progressStr) {
                const { dhikrId, count } = JSON.parse(progressStr);
                const defaultNames: Record<string, {text: string, target: number}> = {
                    'subhanallah': {text: 'Sübhanallah', target: 33},
                    'alhamdulillah': {text: 'Elhamdülillah', target: 33},
                    'allahuakbar': {text: 'Allahu Ekber', target: 33},
                    'lailahaillallah': {text: 'La ilahe illallah', target: 100},
                    'salawat': {text: 'Salavat-ı Şerife', target: 100}
                };
                
                let found = defaultNames[dhikrId];
                if (!found && listStr) {
                    const list = JSON.parse(listStr);
                    const custom = list.find((d: any) => d.id === dhikrId);
                    if (custom) found = { text: custom.text, target: custom.target };
                }

                if (found) {
                    setLastDhikr({ name: found.text, count, target: found.target });
                }
            }
        } catch(e) {}

        // Set Random Sadaka
        setRandomSadaka(SADAKA_SUGGESTIONS[Math.floor(Math.random() * SADAKA_SUGGESTIONS.length)]);
    }, [activeView]);

    const handleBack = () => {
        setActiveView('MENU');
    };

    const renderMenu = () => (
        <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar">
            
            {/* Header Area */}
            <div className="relative bg-white pb-6 rounded-b-[2rem] shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
                <div className="absolute top-20 left-0 w-40 h-40 bg-teal-50 rounded-full blur-3xl -ml-20 opacity-60 pointer-events-none"></div>

                <div className="px-6 pt-8 relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <MoonStar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Maneviyat Bahçesi</h1>
                            <p className="text-xs text-gray-500 font-medium">Ruhunu besle, kalbini arındır.</p>
                        </div>
                    </div>

                    {/* === MAIN MODULES GRID === */}
                    <div className="grid grid-cols-2 gap-3">
                        
                        {/* 1. Zikirmatik (Large) */}
                        <button 
                            onClick={() => setActiveView('DHIKR')}
                            className="col-span-2 bg-gradient-to-r from-primary-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-primary-200 relative overflow-hidden group text-left transition-transform active:scale-[0.98]"
                        >
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                                <HandHeart size={100} />
                            </div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-90">
                                        <Activity size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Zikirmatik</span>
                                    </div>
                                    <h3 className="text-xl font-bold font-serif mb-1 line-clamp-1">{lastDhikr ? lastDhikr.name : "Tesbihat Başlat"}</h3>
                                    <p className="text-xs opacity-80">{lastDhikr ? `${lastDhikr.count} / ${lastDhikr.target} tamamlandı` : "Ruhunu dinlendir"}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                                    <Play size={20} fill="currentColor" className="ml-1"/>
                                </div>
                            </div>
                            {lastDhikr && (
                                <div className="w-full bg-black/20 h-1 mt-4 rounded-full overflow-hidden">
                                    <div className="bg-white h-full transition-all duration-1000" style={{ width: `${(lastDhikr.count / lastDhikr.target) * 100}%` }}></div>
                                </div>
                            )}
                        </button>

                        {/* 2. Dua Library */}
                        <button 
                            onClick={() => setActiveView('DUA')}
                            className="bg-white p-4 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <HelpingHand size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Dualar</h4>
                            <p className="text-xs text-gray-500 mt-1">Her an için sığınak</p>
                        </button>

                        {/* 3. Esma-ul Husna */}
                        <button 
                            onClick={() => setActiveView('ESMA')}
                            className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Gem size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Esmalar</h4>
                            <p className="text-xs text-gray-500 mt-1">Bugün: {dailyEsma.name}</p>
                        </button>

                        {/* 4. Quran Advice (Replaces Hadith) */}
                        <button 
                            onClick={() => setActiveView('QURAN_ADVICE')}
                            className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <BookOpen size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Kur'an Öğütleri</h4>
                            <p className="text-xs text-gray-500 mt-1">İlahi rehberlik</p>
                        </button>

                        {/* 5. Religious Calendar */}
                        <button 
                            onClick={() => setActiveView('CALENDAR')}
                            className="bg-white p-4 rounded-3xl border border-violet-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <CalendarDays size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Takvim</h4>
                            <p className="text-xs text-gray-500 mt-1">Dini günler</p>
                        </button>

                        {/* 6. Wisdom (Hikmetler) */}
                        <button 
                            onClick={() => setActiveView('WISDOM')}
                            className="bg-white p-4 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Lightbulb size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Hikmetler</h4>
                            <p className="text-xs text-gray-500 mt-1">Gönül sözleri</p>
                        </button>

                        {/* 7. Qibla Finder */}
                        <button 
                            onClick={() => setActiveView('QIBLA')}
                            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Compass size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Kıble</h4>
                            <p className="text-xs text-gray-500 mt-1">Yönünü bul</p>
                        </button>

                        {/* 8. Quiz (İlmihal) */}
                        <button 
                            onClick={() => setActiveView('QUIZ')}
                            className="bg-white p-4 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <BookCheck size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">İlmihal</h4>
                            <p className="text-xs text-gray-500 mt-1">Bilgini ölç</p>
                        </button>

                    </div>
                </div>
            </div>

            {/* Content Area: Widgets */}
            <div className="flex-1 px-6 py-6 space-y-6">
                
                {/* Sadaka Taşı Widget */}
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-3xl border border-rose-100 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500 animate-pulse">
                            <HeartHandshake size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-2">
                                Sadaka Taşı <span className="text-[10px] font-normal text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Günün İyiliği</span>
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">"{randomSadaka}"</p>
                        </div>
                    </div>
                    <Gift size={80} className="absolute -bottom-4 -right-4 text-rose-200 opacity-50 rotate-12"/>
                </div>

                <div className="pb-20"></div>
            </div>
        </div>
    );

    switch (activeView) {
        case 'DHIKR':
            return <DhikrCounter onBack={handleBack} />;
        case 'DUA':
            return <DuaLibrary onBack={handleBack} />;
        case 'ESMA':
            return <EsmaulHusna onBack={handleBack} />;
        case 'QURAN_ADVICE':
            return <QuranAdviceView onBack={handleBack} />;
        case 'CALENDAR':
            return <CalendarView onBack={handleBack} />;
        case 'QIBLA':
            return <QiblaView onBack={handleBack} />;
        case 'QUIZ':
            return <QuizView onBack={handleBack} />;
        case 'WISDOM':
            return <WisdomView onBack={handleBack} />;
        default:
            return renderMenu();
    }
};

export default SpiritualCorner;
