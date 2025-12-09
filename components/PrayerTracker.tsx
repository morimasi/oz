
import React, { useState, useEffect, useMemo } from 'react';
import { PrayerStatus, PRAYER_NAMES, PrayerTimes, Tab } from '../types';
import { Check, Sun, Clock, Bell, CalendarDays, History, RotateCcw, ChevronRight, HandHeart, Plus, Minus, CheckCircle2 } from 'lucide-react';
import Card from './Card';

interface PrayerTrackerProps {
  date: string;
  prayerTimes: PrayerTimes | null;
  onChangeTab?: (tab: Tab) => void;
}

type TrackerView = 'TODAY' | 'WEEKLY' | 'KAZA';

const PrayerTracker: React.FC<PrayerTrackerProps> = ({ date, prayerTimes, onChangeTab }) => {
  const [activeView, setActiveView] = useState<TrackerView>('TODAY');
  const [prayers, setPrayers] = useState<PrayerStatus[]>([]);
  const [nextPrayerReminder, setNextPrayerReminder] = useState<{ name: string; minutesLeft: number } | null>(null);
  const [qadaCounts, setQadaCounts] = useState<Record<string, number>>({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 });
  
  // Load Prayers for Today
  useEffect(() => {
    const storageKey = `prayers-${date}`;
    const saved = localStorage.getItem(storageKey);

    const initializePrayers = () => {
        const initial: PrayerStatus[] = PRAYER_NAMES.map(p => ({
            id: p.id,
            name: p.name,
            completed: false,
            isSunnah: p.sunnah
        }));
        setPrayers(initial);
    };
    
    if (saved) {
      try {
        setPrayers(JSON.parse(saved));
      } catch (error) {
        initializePrayers();
      }
    } else {
      initializePrayers();
    }
  }, [date]);

  // Load Kaza Counts
  useEffect(() => {
      try {
          const savedQada = localStorage.getItem('qada_counts');
          if (savedQada) {
              setQadaCounts(JSON.parse(savedQada));
          }
      } catch (e) { console.error(e); }
  }, []);

  // Check Next Prayer Time Logic
  useEffect(() => {
    if (!prayerTimes) return;

    const checkTime = () => {
        const now = new Date();
        const prayerOrder: (keyof PrayerTimes)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const trNames: {[key: string]: string} = { Fajr: 'Sabah', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' };

        let foundNext = false;

        for (const prayerKey of prayerOrder) {
            const timeStr = prayerTimes[prayerKey];
            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);

            if (prayerDate > now) {
                const diffMs = prayerDate.getTime() - now.getTime();
                const diffMins = Math.floor(diffMs / 60000);

                if (diffMins < 60) {
                    setNextPrayerReminder({ name: trNames[prayerKey], minutesLeft: diffMins });
                } else {
                    setNextPrayerReminder(null);
                }
                foundNext = true;
                break;
            }
        }
        if (!foundNext) setNextPrayerReminder(null);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const togglePrayer = (id: string) => {
    const newPrayers = prayers.map(p => 
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    setPrayers(newPrayers);
    localStorage.setItem(`prayers-${date}`, JSON.stringify(newPrayers));
  };

  const updateQada = (id: string, delta: number) => {
      const newCounts = { ...qadaCounts, [id]: Math.max(0, (qadaCounts[id] || 0) + delta) };
      setQadaCounts(newCounts);
      localStorage.setItem('qada_counts', JSON.stringify(newCounts));
  };
  
  const handleGoToDhikr = () => {
      // If parent provided tab changer, use it. But simple routing hack for now if needed.
      // Assuming App passes a handler or we use window event.
      // For this implementation, we rely on user manually going to Spiritual tab unless prop is passed.
      if (onChangeTab) onChangeTab(Tab.SPIRITUAL);
  };
  
  const getWeeklyData = useMemo(() => {
      const history = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const saved = localStorage.getItem(`prayers-${dateStr}`);
          let count = 0;
          if (saved) {
              const p: PrayerStatus[] = JSON.parse(saved);
              count = p.filter(x => x.completed).length;
          }
          history.push({ date: d, count, full: count === 5 });
      }
      return history;
  }, [prayers]); // Re-calc when today changes

  const prayerIdToTimeKey: { [key: string]: keyof PrayerTimes } = {
      fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
  };

  const completionRate = Math.round((prayers.filter(p => p.completed).length / prayers.length) * 100) || 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* TABS HEADER */}
      <div className="bg-white px-4 pb-4 pt-2 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => setActiveView('TODAY')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'TODAY' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Bugün
              </button>
              <button 
                onClick={() => setActiveView('WEEKLY')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'WEEKLY' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Haftalık
              </button>
              <button 
                onClick={() => setActiveView('KAZA')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'KAZA' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Kaza Takibi
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24 no-scrollbar">
        
        {/* VIEW 1: TODAY */}
        {activeView === 'TODAY' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Upcoming Alert */}
                {nextPrayerReminder && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-pulse">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-orange-800 text-sm">Vakit Yaklaşıyor</h3>
                            <p className="text-xs text-orange-700/80">
                                {nextPrayerReminder.name} namazına <span className="font-bold">{nextPrayerReminder.minutesLeft} dk</span> kaldı.
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress Card */}
                <div className="bg-gradient-to-br from-primary-700 to-teal-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-lg font-serif font-bold">Bugünkü İbadetlerin</h2>
                                <p className="text-primary-100 text-xs opacity-80">{new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center text-sm font-bold">
                                %{completionRate}
                            </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-white/90 transition-all duration-700 ease-out" style={{ width: `${completionRate}%` }} />
                        </div>
                    </div>
                </div>

                {/* Prayer List */}
                <div className="space-y-3">
                    {prayers.map((prayer, index) => (
                    <div key={prayer.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button
                            onClick={() => togglePrayer(prayer.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                            prayer.completed 
                                ? 'bg-primary-50/50 border-primary-200 shadow-sm' 
                                : 'bg-white border-gray-100 shadow-sm hover:border-primary-200 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                    prayer.completed 
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 scale-100 rotate-0' 
                                    : 'bg-gray-100 text-gray-400 scale-95 group-hover:scale-100'
                                }`}>
                                    {prayer.completed ? <Check size={24} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold text-lg ${prayer.completed ? 'text-primary-900' : 'text-gray-700'}`}>
                                    {prayer.name}
                                    </h3>
                                    {prayerTimes && (
                                    <span className={`text-xs flex items-center gap-1 mt-0.5 ${prayer.completed ? 'text-primary-600/70' : 'text-gray-400'}`}>
                                        <Clock size={12} />
                                        {prayerTimes[prayerIdToTimeKey[prayer.id]]}
                                    </span>
                                    )}
                                </div>
                            </div>
                        </button>
                        
                        {/* Inline Tesbihat Suggestion */}
                        {prayer.completed && (
                            <div className="mt-2 ml-16 animate-in slide-in-from-top-2 fade-in duration-300">
                                <button 
                                    onClick={handleGoToDhikr}
                                    className="flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 hover:bg-primary-100 transition-colors"
                                >
                                    <HandHeart size={14} />
                                    {prayer.name} Tesbihatını Yap
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* VIEW 2: WEEKLY HISTORY */}
        {activeView === 'WEEKLY' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CalendarDays size={20}/></div>
                        <h2 className="font-bold text-gray-800">Haftalık Performans</h2>
                    </div>
                    
                    <div className="flex justify-between items-end h-32 px-2 gap-2">
                        {getWeeklyData.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center">
                                    <div 
                                        className={`w-full max-w-[24px] rounded-t-lg transition-all duration-700 ${day.full ? 'bg-primary-500' : day.count > 0 ? 'bg-primary-300' : 'bg-gray-100'}`}
                                        style={{ height: `${Math.max(10, day.count * 20)}px` }}
                                    ></div>
                                    {day.count > 0 && (
                                        <div className="absolute -top-6 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white border px-1.5 rounded shadow-sm">
                                            {day.count}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold ${day.date.getDate() === new Date().getDate() ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {day.date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </p>
                                    <p className="text-[9px] text-gray-300">{day.date.getDate()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Card className="flex flex-col items-center justify-center py-6">
                        <CheckCircle2 size={32} className="text-green-500 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{getWeeklyData.filter(d => d.full).length}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase mt-1">Tam Gün</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-6">
                        <History size={32} className="text-blue-500 mb-2"/>
                        <span className="text-2xl font-black text-gray-800">{getWeeklyData.reduce((acc, curr) => acc + curr.count, 0)}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase mt-1">Toplam Vakit</span>
                    </Card>
                </div>
            </div>
        )}

        {/* VIEW 3: KAZA TRACKER */}
        {activeView === 'KAZA' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-3 text-yellow-800 text-sm mb-4">
                    <RotateCcw className="flex-shrink-0" size={20}/>
                    <p>Geçmişte kılamadığın namazları buradan takip edebilirsin. Kıldıkça düşmeyi unutma.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { id: 'fajr', label: 'Sabah Namazı' },
                        { id: 'dhuhr', label: 'Öğle Namazı' },
                        { id: 'asr', label: 'İkindi Namazı' },
                        { id: 'maghrib', label: 'Akşam Namazı' },
                        { id: 'isha', label: 'Yatsı Namazı' },
                        { id: 'witr', label: 'Vitir Namazı' },
                    ].map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-700">{item.label}</h3>
                                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Kaza</div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                                <button 
                                    onClick={() => updateQada(item.id, -1)}
                                    className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-95 transition-all"
                                    title="Kıldım, Düş"
                                >
                                    <Minus size={20} />
                                </button>
                                
                                <span className="text-2xl font-mono font-bold text-gray-800">
                                    {qadaCounts[item.id] || 0}
                                </span>
                                
                                <button 
                                    onClick={() => updateQada(item.id, 1)}
                                    className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                                    title="Kaçırdım, Ekle"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            
                            <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                <span>Kıldım</span>
                                <span>Ekle</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PrayerTracker;
