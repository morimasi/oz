import React, { useEffect, useState, useMemo } from 'react';
import { getDailyVerseOrHadith } from '../services/geminiService';
import { esmaulHusna } from '../services/esmaulhusnaData';
import { Tab, PrayerStatus, PrayerTimes, UserProfile, PRAYER_NAMES, LocationConfig } from '../types';
import { Sun, Sunset, Moon, CalendarRange, Check, Share2, Bookmark, Flame, Wind, Smile, CloudRain, Zap, Star, HandHeart, ArrowRight, X, MessageSquareQuote, Fingerprint, Compass, Settings2, ArrowUp, ArrowDown, Eye, EyeOff, Cloud, MapPin } from 'lucide-react';

interface HomeProps {
  profile: UserProfile | null;
  changeTab: (tab: Tab) => void;
  prayerTimes: PrayerTimes | null;
  locationError: string | null;
  locationConfig: LocationConfig | null;
  onOpenLocationSelector: () => void;
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
    if (dayProgress < 0 || dayProgress > 1) return 'from-slate-900 via-slate-800 to-slate-900';
    
    // Dawn / Sunrise (0 - 0.1)
    if (dayProgress < 0.1) return 'from-indigo-600 via-purple-500 to-orange-400';
    
    // Morning (0.1 - 0.3)
    if (dayProgress < 0.3) return 'from-sky-400 via-blue-300 to-emerald-200';
    
    // Noon (0.3 - 0.7)
    if (dayProgress < 0.7) return 'from-blue-500 via-sky-400 to-cyan-300';
    
    // Afternoon (0.7 - 0.9)
    if (dayProgress < 0.9) return 'from-blue-600 via-indigo-400 to-amber-200';
    
    // Sunset (0.9 - 1.0)
    if (dayProgress <= 1.0) return 'from-indigo-800 via-purple-600 to-orange-500';
    
    return 'from-primary-600 to-primary-800';
};

const Home: React.FC<HomeProps> = ({ profile, changeTab, prayerTimes, locationError, locationConfig, onOpenLocationSelector }) => {
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

      const content = await getDailyVerseOrHadith();
      setDailyContent(content);

      calculateStats(todayStr);

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
      
      const savedMission = localStorage.getItem(`mission_completed_${todayStr}`);
      if (savedMission === 'true') setMissionCompleted(true);
      
      const savedDhikr = localStorage.getItem(`quick_dhikr_${todayStr}`);
      if (savedDhikr) setQuickDhikrCount(parseInt(savedDhikr));
      
      const savedIntention = localStorage.getItem(`daily_intention_${todayStr}`);
      if (savedIntention) setIntention(savedIntention);
      
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
              color: 'bg-orange-50/50 border-orange-100 text-orange-800',
              icon: Zap
          },
          tired: {
              mood: 'tired',
              title: 'Ruhun mu Yoruldu?',
              description: 'Dünya gürültüsünü susturup, sadece nefes almaya ne dersin?',
              actionLabel: 'Sessizlik Köşesine Git',
              targetTab: Tab.QUIET,
              color: 'bg-blue-50/50 border-blue-100 text-blue-800',
              icon: Wind
          },
          sad: {
              mood: 'sad',
              title: 'Mahzun Olma',
              description: 'Allah sabredenlerle beraberdir. Senin için bir ayet seçtim.',
              actionLabel: 'Rehberle Konuş',
              targetTab: Tab.GUIDE,
              color: 'bg-slate-50/50 border-slate-200 text-slate-800',
              icon: CloudRain
          },
          happy: {
              mood: 'happy',
              title: 'Elhamdülillah',
              description: 'Bu neşeyi şükürle taçlandır. Şükür nimeti artırır.',
              actionLabel: 'Şükür Namazı Kıl',
              targetTab: Tab.PRAYER,
              color: 'bg-yellow-50/50 border-yellow-200 text-yellow-800',
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
                 <div key={widget.id} className={`${widget.colSpan} glass-panel p-5 rounded-3xl relative overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] transition-all`}>
                     <div className="flex items-center gap-2 text-primary-800 mb-2">
                         <Compass size={18} className="text-primary-600"/>
                         <span className="text-xs font-bold uppercase tracking-widest text-primary-600">Manevi Pusula</span>
                     </div>
                     <div className="h-16 flex items-center justify-center mb-1">
                        <p className={`text-xl font-serif font-bold text-center text-gray-800 transition-all ${isSpinning ? 'blur-[1px] scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
                            {intention || "Niyetini Seç"}
                        </p>
                     </div>
                     <button 
                        onClick={handleSpinIntention}
                        disabled={isSpinning}
                        className="w-full py-2.5 bg-primary-50 text-primary-700 text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 border border-primary-100 hover:bg-primary-100"
                     >
                        {isSpinning ? "Seçiliyor..." : "Niyet Çek"}
                     </button>
                 </div>
              );
          case 'quickDhikr':
              return (
                 <div key={widget.id} className={`${widget.colSpan} glass-panel p-5 rounded-3xl relative overflow-hidden hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] transition-all`}>
                     <div className="flex flex-col h-full justify-between">
                         <div className="flex items-center justify-between text-teal-800 mb-1">
                             <div className="flex items-center gap-2">
                                <Fingerprint size={18} className="text-teal-600"/>
                                <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Zikir</span>
                             </div>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center my-1 gap-2">
                             <button 
                                onClick={handleQuickDhikr}
                                className="w-16 h-16 rounded-full bg-white border-4 border-teal-100 flex items-center justify-center shadow-sm text-2xl font-bold text-teal-600 active:scale-90 active:border-teal-300 transition-all"
                             >
                                {quickDhikrCount}
                             </button>
                             <span className="text-[10px] text-gray-400 font-medium">Estağfirullah</span>
                         </div>
                     </div>
                 </div>
              );
          case 'breath':
              return (
                 <div key={widget.id} className={`${widget.colSpan} glass-panel p-5 rounded-3xl flex items-center justify-between relative overflow-hidden hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] transition-all`}>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500 animate-[breath_6s_ease-in-out_infinite]">
                              <Wind size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-800 text-base">Anlık Huzur</h4>
                              <p className="text-xs text-gray-500 mt-0.5">4 saniye al, 4 saniye ver.</p>
                          </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-1.5">
                           <div className="w-2 h-2 bg-blue-300 rounded-full animate-[bounce_4s_infinite_0ms]"></div>
                           <div className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_4s_infinite_200ms]"></div>
                           <div className="w-2 h-2 bg-blue-500 rounded-full animate-[bounce_4s_infinite_400ms]"></div>
                      </div>
                 </div>
              );
          default:
              return null;
      }
  };

  const currentLocationLabel = useMemo(() => {
    if (!locationConfig) return "Konum Alınıyor...";
    if (locationConfig.type === 'GPS') return "GPS Konumu";
    if (locationConfig.type === 'MANUAL') return `${locationConfig.city}, ${locationConfig.country}`;
    return "Konum Seçin";
  }, [locationConfig]);

  return (
    <div className="flex flex-col h-full relative">
      {isFriday && (
          <div className="bg-primary-600 text-white text-xs font-bold py-2 text-center shadow-sm animate-in slide-in-from-top-full z-20">
              🌹 Hayırlı Cumalar!
          </div>
      )}

      {/* Widget Settings Modal */}
      {showWidgetSettings && (
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
              <div className="w-full bg-white rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold text-gray-800">Ana Sayfa Düzeni</h3>
                      <button onClick={() => setShowWidgetSettings(false)} className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100"><X size={20}/></button>
                  </div>
                  <div className="space-y-4 mb-8">
                      {widgets.map((widget, index) => (
                          <div key={widget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="font-semibold text-gray-700">{widget.label}</span>
                              <div className="flex items-center gap-3">
                                  <button onClick={() => handleMoveWidget(index, 'up')} disabled={index === 0} className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-30 hover:bg-white rounded-lg transition-colors"><ArrowUp size={18}/></button>
                                  <button onClick={() => handleMoveWidget(index, 'down')} disabled={index === widgets.length - 1} className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-30 hover:bg-white rounded-lg transition-colors"><ArrowDown size={18}/></button>
                                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                  <button onClick={() => handleToggleWidget(widget.id)} className={`p-2 rounded-lg transition-colors ${widget.visible ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-400'}`}>
                                      {widget.visible ? <Eye size={18}/> : <EyeOff size={18}/>}
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowWidgetSettings(false)} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-200 active:scale-95 transition-transform hover:bg-primary-700">
                      Tamamla
                  </button>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-32 space-y-8 no-scrollbar">
        {/* Header Section */}
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold glass px-3 py-1 rounded-full shadow-sm border-0 inline-flex">
                        <CalendarRange size={12}/>
                        <span>{hijriDate}</span>
                    </div>
                    
                    {/* Location Badge */}
                    <button 
                      onClick={onOpenLocationSelector}
                      className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-white/50 px-2 py-1 rounded-full border border-gray-200 hover:bg-white active:scale-95 transition-all"
                    >
                      <MapPin size={12}/>
                      <span className="max-w-[100px] truncate">{currentLocationLabel}</span>
                    </button>
                </div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight leading-none">
                    {getGreeting()}, <br/>
                    <span className="text-primary-600 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-emerald-500">{profile?.name || 'Mümin'}</span>
                </h1>
            </div>
            
            {/* Spiritual Battery / Streak */}
            <div className="flex flex-col items-end gap-2">
                 <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border-white/60">
                     <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse"/>
                     <span className="text-sm font-bold text-gray-700">{summary.currentStreak}</span>
                 </div>
            </div>
        </div>
        
        {/* Mood Check-in */}
        <div className="relative">
             {activePrescription ? (
                 <div className={`glass-panel rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative ${activePrescription.color}`}>
                     <button onClick={() => setActivePrescription(null)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 transition-colors"><X size={18}/></button>
                     <div className="flex items-start gap-5">
                         <div className="p-4 bg-white/80 rounded-2xl backdrop-blur-sm shadow-sm">
                             <activePrescription.icon size={28} />
                         </div>
                         <div className="flex-1 pt-1">
                             <h3 className="font-bold text-lg mb-1">{activePrescription.title}</h3>
                             <p className="text-sm opacity-90 mb-4 leading-relaxed">{activePrescription.description}</p>
                             <button 
                                onClick={handlePrescriptionAction}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/90 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-white"
                             >
                                 {activePrescription.actionLabel} <ArrowRight size={16}/>
                             </button>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="glass-panel rounded-3xl p-5">
                     <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Bugün Ruh Halin Nasıl?</h3>
                     <div className="flex justify-between gap-3">
                         <button onClick={() => handleMoodCheck('happy')} className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50/50 text-yellow-700 hover:shadow-md transition-all active:scale-95 border border-yellow-100/50">
                             <Smile size={28}/> <span className="text-[10px] font-bold mt-1">Huzurlu</span>
                         </button>
                         <button onClick={() => handleMoodCheck('tired')} className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 text-blue-700 hover:shadow-md transition-all active:scale-95 border border-blue-100/50">
                             <Wind size={28}/> <span className="text-[10px] font-bold mt-1">Yorgun</span>
                         </button>
                         <button onClick={() => handleMoodCheck('anxious')} className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50/50 text-orange-700 hover:shadow-md transition-all active:scale-95 border border-orange-100/50">
                             <Zap size={28}/> <span className="text-[10px] font-bold mt-1">Kaygılı</span>
                         </button>
                         <button onClick={() => handleMoodCheck('sad')} className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100/50 text-slate-700 hover:shadow-md transition-all active:scale-95 border border-slate-100/50">
                             <CloudRain size={28}/> <span className="text-[10px] font-bold mt-1">Üzgün</span>
                         </button>
                     </div>
                 </div>
             )}
        </div>

        {/* Hero Prayer Card */}
        <div className={`relative rounded-[2.5rem] text-white shadow-2xl shadow-primary-900/10 overflow-hidden bg-gradient-to-br transition-all duration-1000 ${getSkyGradient(timeContext?.currentPrayerId || null, timeContext?.dayProgress || -1)}`}>
            
            {/* SCENIC BACKGROUND ELEMENTS */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {timeContext && timeContext.dayProgress >= 0 && timeContext.dayProgress <= 1 ? (
                    <div 
                        className="absolute w-32 h-32 bg-yellow-300 rounded-full shadow-[0_0_80px_30px_rgba(253,224,71,0.5)] transition-all duration-1000 blur-sm mix-blend-screen"
                        style={{ 
                            left: `${timeContext.dayProgress * 100}%`,
                            bottom: `${Math.sin(timeContext.dayProgress * Math.PI) * 50}%`,
                            transform: 'translate(-50%, 50%)'
                        }}
                    ></div>
                ) : (
                    <>
                        <div className="absolute top-10 left-10 text-yellow-100 opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]">
                            <Moon size={48} fill="currentColor" />
                        </div>
                        <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                        <div className="absolute top-20 right-24 w-1 h-1 bg-white rounded-full animate-[pulse_4s_infinite] shadow-[0_0_5px_white]"></div>
                    </>
                )}

                <div className="absolute top-4 left-[-10%] opacity-20 animate-[drift_30s_linear_infinite] text-white">
                    <Cloud size={100} fill="currentColor" />
                </div>
                {/* Organic wave shape at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 text-black/30">
                     <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-current">
                         <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                     </svg>
                </div>
            </div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 p-8 flex flex-col h-full justify-between min-h-[220px]">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3">
                           {timeContext?.currentPrayerId ? (
                               <>
                                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]"></div>
                                 <span className="text-[10px] font-bold tracking-widest uppercase">{timeContext.currentPrayerName} Vakti</span>
                               </>
                           ) : <span className="text-xs">Hesaplanıyor...</span>}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                             <span className="text-6xl font-mono font-bold tracking-tighter drop-shadow-lg">{timeContext?.countdown || '--:--:--'}</span>
                        </div>
                        <p className="text-sm opacity-80 mt-1 font-medium ml-1">Sonraki vakte kalan süre</p>
                    </div>
                    
                    {timeContext?.currentPrayerId && timeContext.currentPrayerId !== 'sunrise' && (
                        <button 
                            onClick={handleToggleCurrentPrayer}
                            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl backdrop-blur-xl border shadow-lg transition-all active:scale-95 group ${currentPrayerCompleted ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                        >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mb-1 ${currentPrayerCompleted ? 'bg-white border-white' : 'border-white/60 group-hover:border-white'}`}>
                                {currentPrayerCompleted && <Check size={16} className="text-emerald-600" strokeWidth={4} />}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{currentPrayerCompleted ? 'Kılındı' : 'Kıl'}</span>
                        </button>
                    )}
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-end mb-2 text-xs font-medium opacity-90 px-1">
                        <span>Sıradaki: <span className="font-bold text-white text-base">{timeContext?.nextPrayerName}</span></span>
                        <span className="font-mono text-base">{timeContext?.nextPrayerTime}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                            style={{ width: `${timeContext?.progressPercent || 0}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Timeline */}
        {prayerTimes ? (
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x px-1">
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((key) => {
                    const pName = { Fajr: 'Sabah', Sunrise: 'Güneş', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' }[key];
                    const pId = { Fajr: 'fajr', Sunrise: 'sunrise', Dhuhr: 'dhuhr', Asr: 'asr', Maghrib: 'maghrib', Isha: 'isha' }[key];
                    const time = prayerTimes[key as keyof PrayerTimes];
                    const isActive = timeContext?.currentPrayerId === pId;
                    
                    return (
                        <div key={key} className={`snap-center flex-shrink-0 flex flex-col items-center justify-center min-w-[76px] py-4 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200 scale-105' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <div className={`mb-1.5 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{prayerIcons[pName || '']}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{pName}</span>
                            <span className="text-sm font-bold mt-0.5 font-mono">{time}</span>
                        </div>
                    );
                })}
            </div>
        ) : locationError ? (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl border border-red-100 flex items-center gap-3">
               <CloudRain size={18}/>
               <p>{locationError}</p>
            </div>
        ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Namaz vakitleri yükleniyor...</div>
        )}

        {/* Widgets Grid */}
        <div className="flex items-center justify-between mt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Araçlar</h3>
            <button onClick={() => setShowWidgetSettings(true)} className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                <Settings2 size={14} /> Düzenle
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             {widgets.map(widget => renderWidget(widget))}
        </div>

        {/* Daily Content Tabbed Card */}
        <div className="glass-panel rounded-3xl overflow-hidden mt-4 bg-white/60">
             <div className="flex border-b border-gray-100 p-1 gap-1 bg-white/50 backdrop-blur-sm">
                 <button onClick={() => setActiveInfoTab('AYET')} className={`flex-1 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${activeInfoTab === 'AYET' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Günün Ayeti</button>
                 <button onClick={() => setActiveInfoTab('ESMA')} className={`flex-1 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${activeInfoTab === 'ESMA' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Esma</button>
                 <button onClick={() => setActiveInfoTab('GOREV')} className={`flex-1 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${activeInfoTab === 'GOREV' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Görev</button>
             </div>
             
             <div className="p-8 min-h-[220px] flex flex-col justify-center">
                 {activeInfoTab === 'AYET' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                         {isLoading ? (
                             <div className="flex flex-col items-center gap-3 text-gray-400">
                                 <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                 <span className="text-xs font-medium">İçerik Yükleniyor...</span>
                             </div>
                         ) : dailyContent ? (
                             <>
                                <div className="mb-6 relative pl-6">
                                    <MessageSquareQuote size={32} className="text-primary-200 absolute -left-2 -top-2 opacity-50"/>
                                    <p className="text-xl font-serif text-gray-800 leading-relaxed italic">{dailyContent.content}</p>
                                    <div className="flex justify-end mt-4">
                                        <p className="text-xs text-primary-600 font-bold uppercase tracking-widest border-t border-primary-100 pt-2 inline-block">
                                            {dailyContent.source}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={handleSaveContent} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${isSaved ? 'bg-green-100 text-green-700' : 'bg-gray-50 border border-gray-100 text-gray-600 hover:bg-white'}`}>
                                        {isSaved ? <Check size={14}/> : <Bookmark size={14}/>} {isSaved ? 'Kaydedildi' : 'Kaydet'}
                                    </button>
                                    <button onClick={handleShareContent} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                                        <Share2 size={14}/> Paylaş
                                    </button>
                                </div>
                             </>
                         ) : <p className="text-center text-gray-400">İçerik yüklenemedi.</p>}
                     </div>
                 )}
                 
                 {activeInfoTab === 'ESMA' && (
                     <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-300 to-amber-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4 shadow-amber-200/50 rotate-3">
                             <Star size={40} fill="white"/>
                         </div>
                         <h3 className="text-4xl font-serif font-bold text-gray-900 mb-2">{dailyEsma.name}</h3>
                         <p className="text-sm font-bold text-amber-600 mb-3 uppercase tracking-wider">{dailyEsma.transliteration}</p>
                         <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto px-4">{dailyEsma.meaning}</p>
                     </div>
                 )}
                 
                 {activeInfoTab === 'GOREV' && (
                     <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${missionCompleted ? 'bg-green-100 text-green-600 scale-110 shadow-inner' : 'bg-gray-100 text-gray-400'}`}>
                             {missionCompleted ? <Star size={32} fill="currentColor"/> : <HandHeart size={32}/>}
                         </div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">Günün İyiliği</h3>
                         <p className="text-base text-gray-600 mb-8 px-4 leading-relaxed font-serif italic">"{dailyMission}"</p>
                         <button 
                            onClick={handleToggleMission}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg ${missionCompleted ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-900 text-white shadow-gray-300 hover:bg-gray-800'}`}
                         >
                             {missionCompleted ? 'Tamamlandı' : 'Görevi Tamamladım'}
                         </button>
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Home;