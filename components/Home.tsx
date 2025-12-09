
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getDailyVerseOrHadith } from '../services/geminiService';
import { esmaulHusna } from '../services/esmaulhusnaData';
import { Tab, PrayerStatus, PrayerTimes, UserProfile, PRAYER_NAMES } from '../types';
import { Sun, Sunset, Moon, MessageSquare, CalendarRange, ChevronRight, Check, Share2, Bookmark, Flame, Wind, Heart, Smile, CloudRain, Zap, BookOpen, Star, Sparkles, Gem, HandHeart, Battery, ArrowRight, X, Copy, MoonStar, MessageSquareQuote, RefreshCw, Fingerprint, Activity, Compass, Settings2, ArrowUp, ArrowDown, Eye, EyeOff, Cloud } from 'lucide-react';

interface HomeProps {
  profile: UserProfile | null;
  changeTab: (tab: Tab) => void;
  prayerTimes: PrayerTimes | null;
  locationError: string | null;
}

interface SummaryData {
  completedPrayers: number;
  totalPrayers: number;
  currentStreak: number;
  completionRate: number;
}

interface TimeContext {
  nextPrayerName: string;
  nextPrayerTime: string;
  currentPrayerName: string | null;
  currentPrayerId: string | null;
  countdown: string;
  progressPercent: number;
  dayProgress: number; // 0-1 for day, -1 for night
}

interface MoodPrescription {
    mood: string;
    title: string;
    description: string;
    actionLabel: string;
    targetTab: Tab;
    color: string;
    icon: React.ElementType;
}

interface WidgetConfig {
    id: string;
    label: string;
    visible: boolean;
    colSpan: 'col-span-1' | 'col-span-2';
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'intention', label: 'Manevi Pusula', visible: true, colSpan: 'col-span-1' },
    { id: 'quickDhikr', label: 'Hızlı Zikir', visible: true, colSpan: 'col-span-1' },
    { id: 'breath', label: 'Anlık Huzur', visible: true, colSpan: 'col-span-2' },
];

const DAILY_MISSIONS = [
    "Bugün birine içtenlikle tebessüm et.",
    "Bir yakınını arayıp halini hatırını sor.",
    "Yerdeki engelleyici bir şeyi (taş, çöp) kenara çek.",
    "Yemeği bitirdikten sonra şükret.",
    "Bugün bir canlıya (kedi, köpek, kuş) su veya yemek ver.",
    "Öfkelendiğin an susmayı dene.",
    "Bugün en az 100 defa 'Estağfirullah' de.",
    "Bir yetime veya ihtiyaç sahibine sadaka ver (miktar önemsiz).",
    "Gece yatmadan önce günün muhasebesini yap.",
    "Ailene 'seni seviyorum' veya güzel bir söz söyle."
];

const INTENTIONS = [
    "Sabır", "Şükür", "Tevazu", "Cömertlik", "Sükunet", "Tefekkür", 
    "İhlas", "Tevekkül", "Merhamet", "Affedicilik", "Sıdk", "Vefa"
];

const getSkyGradient = (prayerId: string | null, dayProgress: number) => {
    // Night
    if (dayProgress < 0 || dayProgress > 1) return 'from-slate-900 via-indigo-950 to-black';
    
    // Dawn / Sunrise (0 - 0.1)
    if (dayProgress < 0.1) return 'from-indigo-800 via-purple-700 to-orange-400';
    
    // Morning (0.1 - 0.3)
    if (dayProgress < 0.3) return 'from-sky-400 via-blue-300 to-blue-200';
    
    // Noon (0.3 - 0.7)
    if (dayProgress < 0.7) return 'from-blue-500 via-sky-400 to-cyan-300';
    
    // Afternoon (0.7 - 0.9)
    if (dayProgress < 0.9) return 'from-blue-600 via-indigo-400 to-orange-200';
    
    // Sunset (0.9 - 1.0)
    if (dayProgress <= 1.0) return 'from-indigo-800 via-purple-600 to-orange-500';
    
    return 'from-primary-600 to-primary-800';
};

const Home: React.FC<HomeProps> = ({ profile, changeTab, prayerTimes, locationError }) => {
  const [dailyContent, setDailyContent] = useState<{ content: string; source: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({ completedPrayers: 0, totalPrayers: 5, currentStreak: 0, completionRate: 0 });
  const [timeContext, setTimeContext] = useState<TimeContext | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [isFriday, setIsFriday] = useState(false);
  const [currentPrayerCompleted, setCurrentPrayerCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Interactive States
  const [activeInfoTab, setActiveInfoTab] = useState<'AYET' | 'ESMA' | 'GOREV'>('AYET');
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [activePrescription, setActivePrescription] = useState<MoodPrescription | null>(null);

  // Widget States
  const [intention, setIntention] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [quickDhikrCount, setQuickDhikrCount] = useState(0);
  
  // Customization State
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  // Derived Data
  const todayDateObj = new Date();
  const dayOfYear = Math.floor((todayDateObj.getTime() - new Date(todayDateObj.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  
  const dailyEsma = useMemo(() => esmaulHusna[dayOfYear % esmaulHusna.length], [dayOfYear]);
  const dailyMission = useMemo(() => DAILY_MISSIONS[dayOfYear % DAILY_MISSIONS.length], [dayOfYear]);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      // Daily Content
      const content = await getDailyVerseOrHadith();
      setDailyContent(content);

      // Stats
      calculateStats(todayStr);

      // Hijri & Friday
      try {
          const date = new Date();
          setIsFriday(date.getDay() === 5);
          const hijri = new Intl.DateTimeFormat('tr-TR-u-ca-islamic', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
          }).format(date);
          setHijriDate(hijri);
      } catch (e) {
          console.error("Date error", e);
      }
      
      // Load Mission & Quick Dhikr Status
      const savedMission = localStorage.getItem(`mission_completed_${todayStr}`);
      if (savedMission === 'true') setMissionCompleted(true);
      
      const savedDhikr = localStorage.getItem(`quick_dhikr_${todayStr}`);
      if (savedDhikr) setQuickDhikrCount(parseInt(savedDhikr));
      
      const savedIntention = localStorage.getItem(`daily_intention_${todayStr}`);
      if (savedIntention) setIntention(savedIntention);
      
      // Load Widgets Config
      try {
          const savedWidgets = localStorage.getItem('home_widgets_config');
          if (savedWidgets) {
              setWidgets(JSON.parse(savedWidgets));
          }
      } catch(e) { console.error("Widget config load error", e); }

      setIsLoading(false);
    };

    fetchAllData();
  }, []);

  const calculateStats = (dateStr: string) => {
      try {
        const prayerDataRaw = localStorage.getItem(`prayers-${dateStr}`);
        let completed = 0;
        let total = 5;
        
        if (prayerDataRaw) {
          const prayers: PrayerStatus[] = JSON.parse(prayerDataRaw);
          completed = prayers.filter(p => p.completed).length;
          total = prayers.length;
        }

        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dKey = `prayers-${d.toISOString().split('T')[0]}`;
            const dData = localStorage.getItem(dKey);
            if (dData && JSON.parse(dData).some((p: any) => p.completed)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        setSummary({ completedPrayers: completed, totalPrayers: total, currentStreak: streak, completionRate: rate });
      } catch (error) {
        console.error("Stats calculation failed", error);
      }
  };

  useEffect(() => {
    if (!prayerTimes) return;

    const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const prayerIds = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const trNames: {[key: string]: string} = { Fajr: 'Sabah', Sunrise: 'Güneş', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' };

    const updateTime = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        let nextIdx = -1;
        for (let i = 0; i < prayerOrder.length; i++) {
            const pTime = new Date(`${todayStr}T${prayerTimes[prayerOrder[i] as keyof PrayerTimes]}`);
            if (pTime > now) {
                nextIdx = i;
                break;
            }
        }

        let nextName = '';
        let nextTimeStr = '';
        let targetDate: Date;
        let currentId: string | null = null;
        let currentName: string | null = null;

        if (nextIdx === -1) {
            nextName = 'Sabah';
            nextTimeStr = prayerTimes['Fajr'];
            targetDate = new Date(`${todayStr}T${prayerTimes['Fajr']}`);
            targetDate.setDate(targetDate.getDate() + 1);
            currentId = 'isha';
            currentName = 'Yatsı';
        } else {
            nextName = trNames[prayerOrder[nextIdx]];
            nextTimeStr = prayerTimes[prayerOrder[nextIdx] as keyof PrayerTimes];
            targetDate = new Date(`${todayStr}T${nextTimeStr}`);
            
            const currentIdx = nextIdx === 0 ? 5 : nextIdx - 1;
            if (nextIdx > 0) {
                currentId = prayerIds[currentIdx];
                currentName = trNames[prayerOrder[currentIdx]];
            } else {
                 currentId = 'isha';
                 currentName = 'Gece'; 
            }
        }

        let diff = targetDate.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let progress = 0;
        if (currentId && currentId !== 'sunrise' && currentName !== 'Gece') {
             progress = Math.max(0, Math.min(100, 100 - ((diff / (1000 * 60 * 60 * 4)) * 100)));
        }

        // Calculate Sun Position / Day Progress
        // Sunrise Time
        const sunriseTime = new Date(`${todayStr}T${prayerTimes.Sunrise}`);
        const sunsetTime = new Date(`${todayStr}T${prayerTimes.Maghrib}`);
        
        let dayProgressVal = -1; // Default night
        
        if (now >= sunriseTime && now <= sunsetTime) {
            const totalDay = sunsetTime.getTime() - sunriseTime.getTime();
            const elapsed = now.getTime() - sunriseTime.getTime();
            dayProgressVal = elapsed / totalDay; // 0 to 1
        }

        setTimeContext({
            nextPrayerName: nextName,
            nextPrayerTime: nextTimeStr,
            currentPrayerName: currentName,
            currentPrayerId: currentId,
            countdown: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            progressPercent: progress,
            dayProgress: dayProgressVal
        });
        
        if (currentId && currentId !== 'sunrise') {
             const prayerDataRaw = localStorage.getItem(`prayers-${todayStr}`);
             if (prayerDataRaw) {
                 const prayers: PrayerStatus[] = JSON.parse(prayerDataRaw);
                 const p = prayers.find(pr => pr.id === currentId);
                 setCurrentPrayerCompleted(!!p?.completed);
             } else {
                 setCurrentPrayerCompleted(false);
             }
        }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const handleToggleCurrentPrayer = () => {
      if (!timeContext?.currentPrayerId) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const storageKey = `prayers-${todayStr}`;
      let prayers: PrayerStatus[] = [];
      const saved = localStorage.getItem(storageKey);
      if (saved) {
          prayers = JSON.parse(saved);
      } else {
           prayers = PRAYER_NAMES.map(p => ({ id: p.id, name: p.name, completed: false, isSunnah: p.sunnah }));
      }
      const updated = prayers.map(p => 
          p.id === timeContext.currentPrayerId ? { ...p, completed: !p.completed } : p
      );
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setCurrentPrayerCompleted(prev => !prev);
      const completedCount = updated.filter(p => p.completed).length;
      const rate = Math.round((completedCount / prayers.length) * 100);
      setSummary(prev => ({ ...prev, completedPrayers: completedCount, completionRate: rate }));
  };
  
  const handleSaveContent = () => {
      if (!dailyContent) return;
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      try {
          const savedBookmarks = JSON.parse(localStorage.getItem('guide_bookmarks') || '[]');
          const newBookmark = { 
              id: Date.now().toString(), 
              text: dailyContent.content, 
              date: new Date().toISOString(), 
              source: dailyContent.source 
          };
          localStorage.setItem('guide_bookmarks', JSON.stringify([newBookmark, ...savedBookmarks]));
      } catch (e) { console.error(e); }
  };
  
  const handleShareContent = () => {
      if (!dailyContent) return;
      if (navigator.share) {
          navigator.share({
              title: 'Günün Sözü',
              text: `"${dailyContent.content}" - ${dailyContent.source}\n\n(Öz'e Yolculuk Uygulaması)`
          });
      } else {
          navigator.clipboard.writeText(`"${dailyContent.content}" - ${dailyContent.source}`);
          alert("Kopyalandı!");
      }
  };
  
  const handleMoodCheck = (mood: string) => {
      const prescriptions: {[key: string]: MoodPrescription} = {
          anxious: {
              mood: 'anxious',
              title: 'Kalbin Daralıyor mu?',
              description: 'Endişe şeytandandır, huzur Rahmandan. Seni ferahlatacak bir zikir önerim var.',
              actionLabel: 'Hemen Zikir Çek',
              targetTab: Tab.SPIRITUAL,
              color: 'bg-orange-50 border-orange-200 text-orange-800',
              icon: Zap
          },
          tired: {
              mood: 'tired',
              title: 'Ruhun mu Yoruldu?',
              description: 'Dünya gürültüsünü susturup, sadece nefes almaya ne dersin?',
              actionLabel: 'Sessizlik Köşesine Git',
              targetTab: Tab.QUIET,
              color: 'bg-blue-50 border-blue-200 text-blue-800',
              icon: Wind
          },
          sad: {
              mood: 'sad',
              title: 'Mahzun Olma',
              description: 'Allah sabredenlerle beraberdir. Senin için bir ayet seçtim.',
              actionLabel: 'Rehberle Konuş',
              targetTab: Tab.GUIDE,
              color: 'bg-slate-50 border-slate-200 text-slate-800',
              icon: CloudRain
          },
          happy: {
              mood: 'happy',
              title: 'Elhamdülillah',
              description: 'Bu neşeyi şükürle taçlandır. Şükür nimeti artırır.',
              actionLabel: 'Şükür Namazı Kıl',
              targetTab: Tab.PRAYER,
              color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              icon: Smile
          }
      };
      
      setActivePrescription(prescriptions[mood]);
  };
  
  const handlePrescriptionAction = () => {
      if (activePrescription) {
          changeTab(activePrescription.targetTab);
          setActivePrescription(null);
      }
  };

  const handleToggleMission = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newState = !missionCompleted;
      setMissionCompleted(newState);
      localStorage.setItem(`mission_completed_${todayStr}`, String(newState));
  };

  // Widget: Spin Intention
  const handleSpinIntention = () => {
      if (isSpinning) return;
      setIsSpinning(true);
      let i = 0;
      const interval = setInterval(() => {
          setIntention(INTENTIONS[Math.floor(Math.random() * INTENTIONS.length)]);
          i++;
          if (i > 15) {
              clearInterval(interval);
              const finalIntention = INTENTIONS[Math.floor(Math.random() * INTENTIONS.length)];
              setIntention(finalIntention);
              setIsSpinning(false);
              const todayStr = new Date().toISOString().split('T')[0];
              localStorage.setItem(`daily_intention_${todayStr}`, finalIntention);
          }
      }, 100);
  };

  // Widget: Quick Dhikr
  const handleQuickDhikr = () => {
      const newCount = quickDhikrCount + 1;
      setQuickDhikrCount(newCount);
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`quick_dhikr_${todayStr}`, String(newCount));
  };
  
  // Customization Functions
  const handleToggleWidget = (id: string) => {
      const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      setWidgets(updated);
      localStorage.setItem('home_widgets_config', JSON.stringify(updated));
  };
  
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
      const newWidgets = [...widgets];
      if (direction === 'up' && index > 0) {
          [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      } else if (direction === 'down' && index < newWidgets.length - 1) {
          [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      }
      setWidgets(newWidgets);
      localStorage.setItem('home_widgets_config', JSON.stringify(newWidgets));
  };


  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 7) return "Hayırlı Sabahlar";
      if (hour < 12) return "Günün Aydın Olsun";
      if (hour < 17) return "Hayırlı Günler";
      if (hour < 21) return "Hayırlı Akşamlar";
      return "Hayırlı Geceler";
  };
  
  const prayerIcons: {[key: string]: React.ReactNode} = {
      'Sabah': <Moon size={16} />,
      'Güneş': <Sun size={16} className="text-orange-500" />,
      'Öğle': <Sun size={16} />,
      'İkindi': <Sun size={16} className="rotate-45" />,
      'Akşam': <Sunset size={16} />,
      'Yatsı': <Moon size={16} />
  };
  
  const renderWidget = (widget: WidgetConfig) => {
      if (!widget.visible) return null;
      
      switch (widget.id) {
          case 'intention':
              return (
                 <div key={widget.id} className={`${widget.colSpan} bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden group`}>
                     <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/50 rounded-full -mr-10 -mt-10 blur-xl"></div>
                     <div className="relative z-10">
                         <div className="flex items-center gap-2 text-purple-800 mb-2">
                             <Compass size={18} />
                             <span className="text-xs font-bold uppercase tracking-wide">Manevi Pusula</span>
                         </div>
                         <div className="h-12 flex items-center justify-center mb-2">
                            <p className={`text-xl font-bold text-center text-gray-800 transition-all ${isSpinning ? 'blur-[1px] scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
                                {intention || "Niyetini Seç"}
                            </p>
                         </div>
                         <button 
                            onClick={handleSpinIntention}
                            disabled={isSpinning}
                            className="w-full py-2 bg-white text-purple-700 text-xs font-bold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                         >
                            {isSpinning ? "Seçiliyor..." : "Niyet Çek"}
                         </button>
                     </div>
                 </div>
              );
          case 'quickDhikr':
              return (
                 <div key={widget.id} className={`${widget.colSpan} bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-3xl border border-teal-100 shadow-sm relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 w-20 h-20 bg-teal-200/50 rounded-full -mr-10 -mt-10 blur-xl"></div>
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex items-center justify-between text-teal-800 mb-1">
                             <div className="flex items-center gap-2">
                                <Fingerprint size={18} />
                                <span className="text-xs font-bold uppercase tracking-wide">Hızlı Zikir</span>
                             </div>
                             <span className="text-[10px] opacity-70">Estağfirullah</span>
                         </div>
                         <div className="flex-1 flex items-center justify-center my-1">
                             <button 
                                onClick={handleQuickDhikr}
                                className="w-14 h-14 rounded-full bg-white border-4 border-teal-100 flex items-center justify-center shadow-sm text-xl font-bold text-teal-600 active:scale-90 active:border-teal-300 transition-all"
                             >
                                {quickDhikrCount}
                             </button>
                         </div>
                         <div className="w-full bg-teal-200/50 h-1 rounded-full overflow-hidden mt-1">
                             <div className="h-full bg-teal-500 transition-all" style={{ width: `${(quickDhikrCount % 100)}%` }}></div>
                         </div>
                     </div>
                 </div>
              );
          case 'breath':
              return (
                 <div key={widget.id} className={`${widget.colSpan} bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-3xl border border-blue-100 shadow-sm flex items-center justify-between relative overflow-hidden`}>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl animate-pulse"></div>
                      <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 animate-[pulse_4s_ease-in-out_infinite]">
                              <Wind size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-800 text-sm">Anlık Huzur</h4>
                              <p className="text-[10px] text-gray-500">4 sn al, 4 sn ver.</p>
                          </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-1">
                           <div className="w-2 h-2 bg-blue-300 rounded-full animate-[bounce_4s_infinite_0ms]"></div>
                           <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-[bounce_4s_infinite_200ms]"></div>
                           <div className="w-3 h-3 bg-blue-500 rounded-full animate-[bounce_4s_infinite_400ms]"></div>
                      </div>
                 </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 relative">
      {isFriday && (
          <div className="bg-teal-700 text-white text-xs font-bold py-1.5 text-center shadow-sm animate-in slide-in-from-top-full z-20">
              🌹 Hayırlı Cumalar! Bugün Kehf suresini okumayı unutma.
          </div>
      )}

      {/* Widget Settings Modal */}
      {showWidgetSettings && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
              <div className="w-full bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Ana Sayfa Düzeni</h3>
                      <button onClick={() => setShowWidgetSettings(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  <div className="space-y-3 mb-6">
                      {widgets.map((widget, index) => (
                          <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="font-medium text-gray-700">{widget.label}</span>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => handleMoveWidget(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowUp size={18}/></button>
                                  <button onClick={() => handleMoveWidget(index, 'down')} disabled={index === widgets.length - 1} className="p-1.5 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowDown size={18}/></button>
                                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  <button onClick={() => handleToggleWidget(widget.id)} className={`p-1.5 rounded-lg transition-colors ${widget.visible ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-400'}`}>
                                      {widget.visible ? <Eye size={18}/> : <EyeOff size={18}/>}
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowWidgetSettings(false)} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 active:scale-95 transition-transform">
                      Tamamla
                  </button>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 no-scrollbar">
        {/* Header Section */}
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 inline-flex">
                    <CalendarRange size={12}/>
                    <span>{hijriDate}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-none mt-2">{getGreeting()}, <br/><span className="text-primary-600">{profile?.name || 'Mümin'}</span></h1>
            </div>
            
            {/* Spiritual Battery / Streak */}
            <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
                     <Flame size={14} className="fill-orange-500 animate-pulse"/>
                     <span className="text-xs font-bold">{summary.currentStreak} Gün</span>
                 </div>
                 
                 {/* Battery Indicator */}
                 <div className="flex items-center gap-2">
                    <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full transition-all duration-700 rounded-full ${summary.completionRate === 100 ? 'bg-green-500' : 'bg-primary-500'}`} 
                            style={{width: `${summary.completionRate}%`}}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">%{summary.completionRate}</span>
                 </div>
            </div>
        </div>
        
        {/* Interactive Mood Prescription / Soul Check-in */}
        <div className="relative">
             {activePrescription ? (
                 <div className={`rounded-2xl p-5 border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative ${activePrescription.color}`}>
                     <button onClick={() => setActivePrescription(null)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors"><X size={16}/></button>
                     <div className="flex items-start gap-4">
                         <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                             <activePrescription.icon size={24} />
                         </div>
                         <div className="flex-1">
                             <h3 className="font-bold text-lg mb-1">{activePrescription.title}</h3>
                             <p className="text-sm opacity-90 mb-4 leading-relaxed">{activePrescription.description}</p>
                             <button 
                                onClick={handlePrescriptionAction}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all"
                             >
                                 {activePrescription.actionLabel} <ArrowRight size={16}/>
                             </button>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-800 mb-3">Bugün Ruh Halin Nasıl?</h3>
                     <div className="flex justify-between gap-2">
                         <button onClick={() => handleMoodCheck('happy')} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors active:scale-95">
                             <Smile size={24}/> <span className="text-[10px] font-medium">Huzurlu</span>
                         </button>
                         <button onClick={() => handleMoodCheck('tired')} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors active:scale-95">
                             <Wind size={24}/> <span className="text-[10px] font-medium">Yorgun</span>
                         </button>
                         <button onClick={() => handleMoodCheck('anxious')} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors active:scale-95">
                             <Zap size={24}/> <span className="text-[10px] font-medium">Kaygılı</span>
                         </button>
                         <button onClick={() => handleMoodCheck('sad')} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors active:scale-95">
                             <CloudRain size={24}/> <span className="text-[10px] font-medium">Üzgün</span>
                         </button>
                     </div>
                 </div>
             )}
        </div>

        {/* Main Prayer Card (Hero) with Scenic Animation */}
        <div className={`relative rounded-3xl text-white shadow-xl overflow-hidden bg-gradient-to-b transition-all duration-1000 ${getSkyGradient(timeContext?.currentPrayerId || null, timeContext?.dayProgress || -1)}`}>
            
            {/* SCENIC BACKGROUND ELEMENTS */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* 1. Sun/Moon Logic */}
                {timeContext && timeContext.dayProgress >= 0 && timeContext.dayProgress <= 1 ? (
                    // SUN (Daytime)
                    <div 
                        className="absolute w-16 h-16 bg-yellow-300 rounded-full shadow-[0_0_40px_10px_rgba(253,224,71,0.5)] transition-all duration-1000"
                        style={{ 
                            left: `${timeContext.dayProgress * 100}%`,
                            bottom: `${Math.sin(timeContext.dayProgress * Math.PI) * 70}%`, // Parabolic arc
                            transform: 'translate(-50%, 50%)'
                        }}
                    ></div>
                ) : (
                    // MOON (Nighttime)
                    <>
                        <div className="absolute top-10 left-10 text-yellow-100 opacity-80 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                            <Moon size={32} fill="currentColor" />
                        </div>
                        {/* Stars */}
                        <div className="absolute top-4 right-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div className="absolute top-12 right-20 w-1 h-1 bg-white rounded-full animate-[pulse_3s_infinite]"></div>
                        <div className="absolute top-20 right-6 w-1.5 h-1.5 bg-white rounded-full animate-[pulse_4s_infinite]"></div>
                    </>
                )}

                {/* 2. Clouds (Animation) */}
                <div className="absolute top-4 left-[-10%] opacity-40 animate-[drift_20s_linear_infinite] text-white">
                    <Cloud size={64} fill="currentColor" />
                </div>
                <div className="absolute top-12 right-[-20%] opacity-30 animate-[drift_25s_linear_infinite_reverse] text-white">
                    <Cloud size={48} fill="currentColor" />
                </div>

                {/* 3. Landscape Silhouette (Mosque/City) */}
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 text-black/40">
                     <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full fill-current">
                         <path d="M0,100 L0,80 Q20,60 40,80 T80,80 T120,60 L140,40 L160,60 Q180,40 200,60 L220,10 L240,60 Q260,40 280,60 T320,80 T360,60 L400,80 L500,80 L500,100 Z" />
                     </svg>
                </div>
            </div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-sm font-medium opacity-90 mb-1 flex items-center gap-2 drop-shadow-md">
                           {timeContext?.currentPrayerId ? (
                               <>
                                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                                 {timeContext.currentPrayerName} Vakti
                               </>
                           ) : 'Vakit Hesaplanıyor...'}
                        </p>
                        <div className="flex items-baseline gap-1 drop-shadow-md">
                             <span className="text-4xl font-bold tracking-tight font-mono">{timeContext?.countdown || '--:--:--'}</span>
                             <span className="text-sm opacity-80">kaldı</span>
                        </div>
                    </div>
                    
                    {timeContext?.currentPrayerId && timeContext.currentPrayerId !== 'sunrise' && (
                        <button 
                            onClick={handleToggleCurrentPrayer}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 ${currentPrayerCompleted ? 'bg-green-500/30 text-white border-green-400/50' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${currentPrayerCompleted ? 'bg-white border-white' : 'border-white/50'}`}>
                                {currentPrayerCompleted && <Check size={14} className="text-green-600" strokeWidth={3} />}
                            </div>
                            <span className="text-[9px] font-bold mt-1 shadow-sm">{currentPrayerCompleted ? 'Kılındı' : 'Kıl'}</span>
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
                    <div 
                        className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                        style={{ width: `${timeContext?.progressPercent || 0}%` }}
                    />
                </div>
                
                <div className="flex justify-between items-center text-xs font-medium opacity-90 drop-shadow-sm">
                     <span>Sıradaki: {timeContext?.nextPrayerName}</span>
                     <span>{timeContext?.nextPrayerTime}</span>
                </div>
            </div>
        </div>
        
        {/* Horizontal Prayer Timeline */}
        {prayerTimes && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((key) => {
                    const pName = { Fajr: 'Sabah', Sunrise: 'Güneş', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' }[key];
                    const pId = { Fajr: 'fajr', Sunrise: 'sunrise', Dhuhr: 'dhuhr', Asr: 'asr', Maghrib: 'maghrib', Isha: 'isha' }[key];
                    const time = prayerTimes[key as keyof PrayerTimes];
                    const isActive = timeContext?.currentPrayerId === pId;
                    const isNext = timeContext?.nextPrayerName === pName;
                    
                    return (
                        <div key={key} className={`snap-center flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] p-3 rounded-2xl border transition-all ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105' : isNext ? 'bg-white border-primary-200 text-primary-800' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <div className="mb-1">{prayerIcons[pName || '']}</div>
                            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{pName}</span>
                            <span className="text-sm font-bold">{time}</span>
                        </div>
                    );
                })}
            </div>
        )}

        {/* CUSTOMIZABLE WIDGETS SECTION */}
        <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Araçlar</h3>
            <button onClick={() => setShowWidgetSettings(true)} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors">
                <Settings2 size={14} /> Düzenle
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
             {widgets.map(widget => renderWidget(widget))}
        </div>

        {/* Info Tabs (Ayet / Esma / Görev) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="flex border-b border-gray-100">
                 <button onClick={() => setActiveInfoTab('AYET')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeInfoTab === 'AYET' ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-50'}`}>Günün Ayeti</button>
                 <button onClick={() => setActiveInfoTab('ESMA')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeInfoTab === 'ESMA' ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-50'}`}>Günün Esması</button>
                 <button onClick={() => setActiveInfoTab('GOREV')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeInfoTab === 'GOREV' ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-50'}`}>Günün Görevi</button>
             </div>
             
             <div className="p-6 min-h-[200px] flex flex-col justify-center">
                 {activeInfoTab === 'AYET' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                         {isLoading ? (
                             <div className="flex flex-col items-center gap-2 text-gray-400">
                                 <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                 <span className="text-xs">Yükleniyor...</span>
                             </div>
                         ) : dailyContent ? (
                             <>
                                <div className="mb-4">
                                    <MessageSquareQuote size={32} className="text-primary-200 mb-2"/>
                                    <p className="text-lg font-serif text-gray-800 leading-relaxed">"{dailyContent.content}"</p>
                                    <p className="text-sm text-primary-600 font-medium mt-3 text-right">— {dailyContent.source}</p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={handleSaveContent} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isSaved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {isSaved ? <Check size={14}/> : <Bookmark size={14}/>} {isSaved ? 'Kaydedildi' : 'Kaydet'}
                                    </button>
                                    <button onClick={handleShareContent} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                                        <Share2 size={14}/> Paylaş
                                    </button>
                                </div>
                             </>
                         ) : <p className="text-center text-gray-400">İçerik yüklenemedi.</p>}
                     </div>
                 )}
                 
                 {activeInfoTab === 'ESMA' && (
                     <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 rotate-3">
                             <Gem size={32}/>
                         </div>
                         <h3 className="text-3xl font-serif font-bold text-gray-800 mb-1">{dailyEsma.name}</h3>
                         <p className="text-lg font-bold text-yellow-600 mb-3">{dailyEsma.transliteration}</p>
                         <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{dailyEsma.meaning}</p>
                     </div>
                 )}
                 
                 {activeInfoTab === 'GOREV' && (
                     <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${missionCompleted ? 'bg-green-100 text-green-600 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                             {missionCompleted ? <Star size={32} fill="currentColor"/> : <HandHeart size={32}/>}
                         </div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">Günün İyilik Görevi</h3>
                         <p className="text-gray-600 mb-6 px-4">{dailyMission}</p>
                         <button 
                            onClick={handleToggleMission}
                            className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${missionCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-900 text-white shadow-lg'}`}
                         >
                             {missionCompleted ? 'Harikasın! Görev Tamamlandı' : 'Görevi Tamamladım'}
                         </button>
                     </div>
                 )}
             </div>
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-center gap-3">
             <CloudRain size={20}/>
             <p>{locationError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
