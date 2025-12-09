
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Achievement, PrayerStatus } from '../types';
import { 
  User, Calendar, Award, BookText, Edit, Save, X, 
  AlertTriangle, ShieldCheck, Star, Bookmark, Smile, 
  Sun, CloudRain, BookHeart, CheckCircle, BrainCircuit, 
  Target, TrendingUp, Zap, Settings, LogOut, Trash2, 
  Activity, HandHeart, History, ChevronRight, Crown, Flame
} from 'lucide-react';
import Card from './Card';

interface ProfileProps {
  profile: UserProfile | null;
  onUpdateProfile: (name: string) => void;
  onClearAllData: () => void;
}

// Level System Configuration
const LEVELS = [
  { threshold: 0, title: "Yolcu", color: "text-gray-500" },
  { threshold: 500, title: "Talip", color: "text-teal-500" },
  { threshold: 1500, title: "Müdavim", color: "text-blue-500" },
  { threshold: 3000, title: "Abid", color: "text-indigo-500" },
  { threshold: 5000, title: "Zahid", color: "text-purple-500" },
  { threshold: 8000, title: "Arif", color: "text-yellow-600" },
  { threshold: 12000, title: "Veli", color: "text-yellow-500" },
];

const ALL_ACHIEVEMENTS: Omit<Achievement, 'isUnlocked'>[] = [
  { id: 'first_step', name: 'Bismillah', description: 'Uygulamayı kullanmaya başladın.' },
  { id: 'perfect_day', name: 'Tam Teslimiyet', description: 'Bir günde 5 vakit namazı kıldın.' },
  { id: 'hatim_start', name: 'Kuran Talebesi', description: 'İlk sureyi tamamladın.' },
  { id: 'dhikr_master', name: 'Zikir Ehli', description: 'Toplam 1000 zikir çektin.' },
  { id: 'week_streak', name: 'İstikrar Abidesi', description: '7 gün üst üste namazlarını aksatmadın.' },
  { id: 'journal_keeper', name: 'İçsel Yolculuk', description: '5 farklı günde manevi günlük yazdın.' },
  { id: 'scholar', name: 'İlim Aşığı', description: 'Rehberden 10 farklı bilgi kaydettin.' },
];

const Profile: React.FC<ProfileProps> = ({ profile, onUpdateProfile, onClearAllData }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || 'Kullanıcı');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ACHIEVEMENTS' | 'SETTINGS'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);

  // Aggregated Data State
  const [stats, setStats] = useState({
    totalPrayers: 0,
    totalDhikr: 0,
    totalSurahs: 0,
    totalJournals: 0,
    totalBookmarks: 0,
    xp: 0,
    streak: 0,
    perfectDays: 0,
    moodDistribution: {} as Record<string, number>
  });

  const [heatmapData, setHeatmapData] = useState<{date: string, count: number}[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate Level based on XP
  const currentLevel = useMemo(() => {
    return LEVELS.slice().reverse().find(l => stats.xp >= l.threshold) || LEVELS[0];
  }, [stats.xp]);

  const nextLevel = useMemo(() => {
    return LEVELS.find(l => l.threshold > stats.xp);
  }, [stats.xp]);

  const levelProgress = useMemo(() => {
    if (!nextLevel) return 100;
    const prevThreshold = LEVELS[LEVELS.indexOf(nextLevel) - 1]?.threshold || 0;
    const range = nextLevel.threshold - prevThreshold;
    const current = stats.xp - prevThreshold;
    return Math.min(100, Math.max(0, (current / range) * 100));
  }, [stats.xp, nextLevel]);

  useEffect(() => {
    // --- DEEP DATA ANALYSIS ---
    let totalP = 0;
    let totalD = 0;
    let totalS = 0;
    let totalJ = 0;
    let totalB = 0;
    let calculatedXP = 0;
    let pDays = 0;
    const moodCounts: Record<string, number> = { happy: 0, peaceful: 0, reflective: 0, sad: 0, anxious: 0, tired: 0 };
    
    const prayerHeatmap: {date: string, count: number}[] = [];
    const today = new Date();

    // 1. Analyze Prayers & Heatmap (Last 30 days)
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const key = `prayers-${dateStr}`;
        const dataStr = localStorage.getItem(key);
        
        let dailyCount = 0;
        if (dataStr) {
            const prayers: PrayerStatus[] = JSON.parse(dataStr);
            dailyCount = prayers.filter(p => p.completed).length;
        }

        prayerHeatmap.push({ date: dateStr, count: dailyCount });
        totalP += dailyCount;
        if (dailyCount === 5) pDays++;
        
        // XP Rule: 10 XP per prayer
        calculatedXP += (dailyCount * 10);
        // XP Rule: Bonus 50 XP for perfect day
        if (dailyCount === 5) calculatedXP += 50;
    }

    // 2. Analyze Dhikr
    try {
        const dhikrProgressStr = localStorage.getItem('dhikr_progress'); // This stores only current active. Needs better tracking in future.
        // For now, let's look at all keys or simulate based on a hypothetical history if we had one.
        // Since we don't have a full dhikr history log in the current architecture, 
        // we will simulate XP based on available 'dhikr_list' targets or saved progress if possible.
        // *Correction*: The app currently doesn't log history of dhikr sessions, only current state.
        // To make this robust, I'd usually check a 'dhikr_history' key. Assuming we add that later.
        // For now, we'll give a base XP for using the feature if 'dhikr_list' exists.
        const dl = localStorage.getItem('dhikr_list');
        if (dl) calculatedXP += 50; // One-time bonus for setting up custom dhikrs
    } catch(e) {}

    // 3. Analyze Quran
    try {
        const completedSurahsStr = localStorage.getItem('quran_completed_surahs');
        if (completedSurahsStr) {
            const ids: number[] = JSON.parse(completedSurahsStr);
            totalS = ids.length;
            // XP Rule: 100 XP per Surah
            calculatedXP += (totalS * 100);
        }
    } catch(e){}

    // 4. Analyze Journal & Moods
    try {
        const journalStr = localStorage.getItem('journal_entries');
        if (journalStr) {
            const entries: any[] = JSON.parse(journalStr);
            totalJ = entries.length;
            entries.forEach(e => {
                if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
            });
            // XP Rule: 30 XP per journal entry
            calculatedXP += (totalJ * 30);
        }
    } catch(e){}

    // 5. Analyze Bookmarks
    try {
        const bmStr = localStorage.getItem('guide_bookmarks');
        if (bmStr) {
            const bms: any[] = JSON.parse(bmStr);
            totalB = bms.length;
            // XP Rule: 15 XP per bookmark
            calculatedXP += (totalB * 15);
        }
    } catch(e){}

    // 6. Calculate Streak
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = `prayers-${d.toISOString().split('T')[0]}`;
        const data = localStorage.getItem(key);
        if (data && JSON.parse(data).some((p: any) => p.completed)) {
            currentStreak++;
        } else if (i > 0) {
            break; 
        }
    }

    setStats({
        totalPrayers: totalP,
        totalDhikr: totalD, // Placeholder until deeper tracking
        totalSurahs: totalS,
        totalJournals: totalJ,
        totalBookmarks: totalB,
        xp: calculatedXP,
        streak: currentStreak,
        perfectDays: pDays,
        moodDistribution: moodCounts
    });
    setHeatmapData(prayerHeatmap);

    // 7. Check Achievements
    const unlocked = ALL_ACHIEVEMENTS.map(ach => {
        let isUnlocked = false;
        if (ach.id === 'first_step') isUnlocked = true; // Always unlocked if here
        if (ach.id === 'perfect_day' && pDays > 0) isUnlocked = true;
        if (ach.id === 'hatim_start' && totalS > 0) isUnlocked = true;
        if (ach.id === 'week_streak' && currentStreak >= 7) isUnlocked = true;
        if (ach.id === 'journal_keeper' && totalJ >= 5) isUnlocked = true;
        if (ach.id === 'scholar' && totalB >= 10) isUnlocked = true;
        // Dhikr master logic would need real counts
        return { ...ach, isUnlocked };
    });
    setAchievements(unlocked);

    setIsLoading(false);
  }, [profile]); // Re-run if profile changes

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateProfile(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const getHeatmapColor = (count: number) => {
      if (count === 0) return 'bg-gray-100';
      if (count <= 2) return 'bg-teal-200';
      if (count <= 4) return 'bg-teal-400';
      return 'bg-teal-600'; // 5 prayers
  };

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      {/* HEADER SECTION: User Identity & Level */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
            {/* Avatar & Rank */}
            <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 p-1 shadow-xl">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                        <User size={48} className="text-teal-700 opacity-80" />
                    </div>
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-white shadow-md border border-gray-100 flex items-center gap-1 ${currentLevel.color}`}>
                   <Crown size={12} fill="currentColor"/> {currentLevel.title}
                </div>
            </div>

            {/* Name Editor */}
            {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="text-xl font-bold text-center bg-gray-100 rounded-lg p-1 outline-none w-48" autoFocus />
                    <button onClick={handleSaveName} className="p-1.5 bg-teal-500 text-white rounded-full"><Save size={14}/></button>
                </div>
            ) : (
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">{profile?.name}</h1>
                    <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-teal-600"><Edit size={14} /></button>
                </div>
            )}
            <p className="text-xs text-gray-500 mb-6">Katılım: {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('tr-TR') : '-'}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
                    <span>XP: {stats.xp}</span>
                    <span>Sonraki: {nextLevel ? nextLevel.threshold : 'Maks.'}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-1000 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                    {nextLevel ? `${nextLevel.title} seviyesine ${nextLevel.threshold - stats.xp} XP kaldı.` : 'Zirvedesin!'}
                </p>
            </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex justify-center -mt-6 relative z-20 px-4">
         <div className="bg-white rounded-full p-1.5 shadow-lg border border-gray-100 flex gap-1">
             <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Genel Bakış</button>
             <button onClick={() => setActiveTab('ACHIEVEMENTS')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'ACHIEVEMENTS' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Rozetler</button>
             <button onClick={() => setActiveTab('SETTINGS')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'SETTINGS' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Ayarlar</button>
         </div>
      </div>

      <div className="px-4 mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* === TAB: OVERVIEW === */}
        {activeTab === 'OVERVIEW' && (
            <>
                {/* 1. Heatmap Card */}
                <Card className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 text-gray-700">
                        <Activity size={18} className="text-teal-500"/>
                        <h3 className="font-bold text-sm uppercase tracking-wide">İbadet İstikrarı (Son 30 Gün)</h3>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-center sm:justify-start">
                        {heatmapData.map((day, i) => (
                            <div key={i} className={`w-2.5 h-8 rounded-full ${getHeatmapColor(day.count)} transition-all hover:scale-125 hover:opacity-80`} title={`${day.date}: ${day.count} vakit`}></div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 text-xs text-gray-400 font-medium">
                        <span>30 Gün Önce</span>
                        <span>Bugün</span>
                    </div>
                </Card>

                {/* 2. Main Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="flex flex-col items-center justify-center py-6 border-l-4 border-l-teal-500">
                        <Target size={24} className="text-teal-600 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{stats.totalPrayers}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase mt-1">Toplam Namaz</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-6 border-l-4 border-l-orange-500">
                        <Flame size={24} className="text-orange-600 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{stats.streak} Gün</span>
                        <span className="text-xs text-gray-400 font-medium uppercase mt-1">Mevcut Seri</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-6 border-l-4 border-l-indigo-500">
                        <BookText size={24} className="text-indigo-600 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{stats.totalSurahs}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase mt-1">Hatim (Sure)</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-6 border-l-4 border-l-pink-500">
                        <BookHeart size={24} className="text-pink-600 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{stats.totalJournals}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase mt-1">Günlük Notu</span>
                    </Card>
                </div>
                
                {/* 3. Holistic Summary */}
                <Card>
                    <div className="flex items-center gap-2 mb-4 text-gray-700">
                        <BrainCircuit size={18} className="text-blue-500"/>
                        <h3 className="font-bold text-sm uppercase tracking-wide">Manevi Analiz</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Rehber Kayıtları</span>
                            <span className="font-bold text-gray-800">{stats.totalBookmarks} bilgi</span>
                        </div>
                        <div className="w-full bg-gray-100 h-px"></div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Kusursuz Günler (5 Vakit)</span>
                            <span className="font-bold text-teal-600">{stats.perfectDays} gün</span>
                        </div>
                         <div className="w-full bg-gray-100 h-px"></div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Manevi Seviye</span>
                            <span className={`font-bold ${currentLevel.color}`}>{currentLevel.title}</span>
                        </div>
                    </div>
                </Card>
            </>
        )}

        {/* === TAB: ACHIEVEMENTS === */}
        {activeTab === 'ACHIEVEMENTS' && (
            <div className="grid grid-cols-1 gap-3">
                 {achievements.map(ach => (
                     <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${ach.isUnlocked ? 'bg-white border-teal-100 shadow-sm' : 'bg-gray-100 border-transparent opacity-60 grayscale'}`}>
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${ach.isUnlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>
                             <Award size={24} />
                         </div>
                         <div>
                             <h4 className={`font-bold text-sm ${ach.isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>{ach.name}</h4>
                             <p className="text-xs text-gray-500 mt-1">{ach.description}</p>
                             {ach.isUnlocked && <span className="inline-block mt-2 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Kazanıldı</span>}
                         </div>
                     </div>
                 ))}
            </div>
        )}

        {/* === TAB: SETTINGS === */}
        {activeTab === 'SETTINGS' && (
             <div className="space-y-4">
                 <Card>
                     <h3 className="font-bold text-sm text-gray-700 mb-4">Veri ve Gizlilik</h3>
                     <div className="space-y-3">
                         <button onClick={onClearAllData} className="w-full flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors">
                             <div className="flex items-center gap-2"><Trash2 size={18}/> <span className="text-sm font-semibold">Tüm Verileri Sıfırla</span></div>
                             <ChevronRight size={16}/>
                         </button>
                         <div className="text-xs text-gray-400 px-2 leading-relaxed">
                             Dikkat: Bu işlem geri alınamaz. Namaz takibi, zikir sayıları, günlük notları ve sohbet geçmişi dahil tüm yerel veriler silinir.
                         </div>
                     </div>
                 </Card>
                 
                 <div className="text-center pt-8">
                     <p className="text-xs text-gray-300">Öz'e Yolculuk v1.2.0</p>
                     <p className="text-[10px] text-gray-300 mt-1">Made with Spiritual Intent</p>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
