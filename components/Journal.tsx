
import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import { 
  Plus, Trash2, Calendar, Smile, BookHeart, CloudRain, Sun, 
  BookOpen, Eye, EyeOff, Search, Tag, X, Edit3, Sparkles, Filter,
  PieChart, BarChart2, Download, ChevronLeft, ChevronRight, Star, Check
} from 'lucide-react';

const MOODS = [
  { id: 'grateful', label: 'Müteşekkir', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  { id: 'peaceful', label: 'Huzurlu', icon: Smile, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' },
  { id: 'hopeful', label: 'Ümitvar', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'reflective', label: 'Tefekkürlü', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'repentant', label: 'Tövbekar', icon: CloudRain, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  { id: 'sad', label: 'Mahzun', icon: BookHeart, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
];

const TAGS = ['Dua', 'Rüya', 'Tefekkür', 'Anı', 'Şükür', 'Niyet', 'İlham', 'İmtihan', 'Hedef'];

const PROMPTS = [
  "Bugün Allah'ın sana verdiği en güzel nimet neydi?",
  "Şu anki ruh halini bir dua ile ifade etsen ne derdin?",
  "Bugün kime tebessüm ettin veya bir iyilik yaptın?",
  "Yarın için manevi bir hedefin var mı?",
  "Seni endişelendiren bir şeyi Allah'a havale ettin mi?",
  "Bugün sabrını zorlayan bir an oldu mu? Nasıl karşıladın?"
];

type ViewMode = 'LIST' | 'CALENDAR' | 'STATS';

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [isEditing, setIsEditing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string | null>(null);
  
  // Editor State
  const [editorId, setEditorId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('peaceful');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('journal_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse journal entries", error);
      }
    }
    setDailyPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const newEntry: JournalEntry = {
      id: editorId || Date.now().toString(),
      date: editorId ? (entries.find(e => e.id === editorId)?.date || new Date().toISOString()) : new Date().toISOString(),
      title,
      content,
      mood: selectedMood,
      tags: selectedTags,
      isFavorite
    };

    let updatedEntries;
    if (editorId) {
      updatedEntries = entries.map(e => e.id === editorId ? newEntry : e);
    } else {
      updatedEntries = [newEntry, ...entries];
    }

    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    resetEditor();
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("Bu notu silmek istediğine emin misin?")) {
      const updated = entries.filter(ent => ent.id !== id);
      setEntries(updated);
      localStorage.setItem('journal_entries', JSON.stringify(updated));
      if (editorId === id) resetEditor();
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditorId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedMood(entry.mood || 'peaceful');
    setSelectedTags(entry.tags || []);
    setIsFavorite(entry.isFavorite || false);
    setIsEditing(true);
  };

  const resetEditor = () => {
    setEditorId(null);
    setTitle('');
    setContent('');
    setSelectedMood('peaceful');
    setSelectedTags([]);
    setIsFavorite(false);
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleExport = () => {
      const dataStr = JSON.stringify(entries, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tefekkur_gunlugu_yedek_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            entry.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMood = filterMood ? entry.mood === filterMood : true;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, filterMood]);

  const getMoodConfig = (moodId?: string) => MOODS.find(m => m.id === moodId) || MOODS[4];

  // --- SUB-COMPONENTS ---

  const StatsView = () => {
      const moodCounts = entries.reduce((acc, curr) => {
          const m = curr.mood || 'peaceful';
          acc[m] = (acc[m] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      const totalWords = entries.reduce((acc, curr) => acc + curr.content.split(' ').length, 0);
      
      // Weekly Activity (Simulated for this month)
      const days = new Array(7).fill(0); // Sun-Sat
      entries.forEach(e => {
          const day = new Date(e.date).getDay();
          days[day]++;
      });
      const maxDay = Math.max(...days, 1);

      return (
          <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Not</p>
                      <p className="text-3xl font-black text-gray-800">{entries.length}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kelimeler</p>
                      <p className="text-3xl font-black text-gray-800">{totalWords}</p>
                  </div>
              </div>

              {/* Weekly Activity Chart */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                      <BarChart2 size={20} className="text-primary-500"/>
                      <h3 className="font-bold text-gray-800">Haftalık Aktivite</h3>
                  </div>
                  <div className="flex justify-between items-end h-32 gap-2">
                      {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, i) => (
                          <div key={day} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-full">
                                  <div 
                                    className="absolute bottom-0 left-0 right-0 bg-primary-500 transition-all duration-1000 rounded-t-lg"
                                    style={{ height: `${(days[i] / maxDay) * 100}%` }}
                                  ></div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">{day}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Mood Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                      <PieChart size={20} className="text-indigo-500"/>
                      <h3 className="font-bold text-gray-800">Duygu Haritası</h3>
                  </div>
                  <div className="space-y-3">
                      {MOODS.map(mood => {
                          const count = moodCounts[mood.id] || 0;
                          if (count === 0) return null;
                          const percent = Math.round((count / entries.length) * 100);
                          return (
                              <div key={mood.id}>
                                  <div className="flex justify-between items-center text-xs mb-1">
                                      <div className="flex items-center gap-2">
                                          <mood.icon size={14} className={mood.color}/>
                                          <span className="font-bold text-gray-700">{mood.label}</span>
                                      </div>
                                      <span className="text-gray-400 font-medium">{count} ({percent}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                      <div className={`h-full ${mood.bg.replace('bg-', 'bg-').replace('100', '500')}`} style={{ width: `${percent}%` }}></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Export */}
              <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                  <Download size={18}/> Verileri İndir (JSON)
              </button>
          </div>
      );
  };

  const CalendarView = () => {
      const today = new Date();
      const [currentDate, setCurrentDate] = useState(today);
      
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sun
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start if needed, keeping Sun for now

      const handleMonthChange = (dir: number) => {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
      };

      const getEntryForDay = (day: number) => {
          const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1).toISOString().split('T')[0]; // +1 for TZ adjust approx or strictly construct
          // Better: construct string manually to match saved format
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          const target = `${year}-${month}-${d}`;
          
          return entries.find(e => e.date.startsWith(target));
      };

      return (
          <div className="pb-24 animate-in fade-in slide-in-from-right duration-300">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-6">
                      <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                      <h3 className="font-bold text-lg text-gray-800">
                          {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                  </div>

                  {/* Days Header */}
                  <div className="grid grid-cols-7 text-center mb-2">
                      {['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map(d => (
                          <span key={d} className="text-xs font-bold text-gray-400 uppercase">{d}</span>
                      ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-1">
                      {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                      {Array(daysInMonth).fill(null).map((_, i) => {
                          const day = i + 1;
                          const entry = getEntryForDay(day);
                          const mood = entry ? getMoodConfig(entry.mood) : null;
                          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

                          return (
                              <div 
                                key={day} 
                                onClick={() => entry && handleEdit(entry)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all cursor-pointer relative group ${
                                    entry ? `${mood?.bg} ${mood?.color} font-bold border ${mood?.border}` : 'text-gray-400 hover:bg-gray-50'
                                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                              >
                                  {day}
                                  {entry && isFavorite && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>}
                              </div>
                          );
                      })}
                  </div>
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {MOODS.map(m => (
                      <div key={m.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${m.color.replace('text-', 'bg-')}`}></div>
                          <span className="text-[10px] text-gray-500">{m.label}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom-5 duration-300 relative z-50">
        <div className="bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <button onClick={resetEditor} className="text-gray-500 font-medium hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors">İptal</button>
          <div className="flex gap-2">
             <button onClick={() => setIsFavorite(!isFavorite)} className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-yellow-100 text-yellow-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <Star size={20} fill={isFavorite ? "currentColor" : "none"}/>
             </button>
             <button onClick={handleSave} className="flex items-center gap-1 text-white font-bold bg-primary-600 px-4 py-1.5 rounded-full hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95">
                 <Check size={16}/> Kaydet
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mood Selector */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Bugünkü Ruh Halin</label>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id as any)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all ${selectedMood === m.id ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-primary-100 scale-105` : 'bg-white border-gray-100 opacity-60 hover:opacity-100'}`}
                >
                  <m.icon size={24} className={m.color} />
                  <span className={`text-[10px] font-bold mt-2 ${selectedMood === m.id ? 'text-gray-800' : 'text-gray-400'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Başlık (Örn: Bugünün Şükrü)"
              className="w-full text-2xl font-serif font-bold text-gray-800 placeholder-gray-300 outline-none bg-transparent"
            />
            <div className="h-px w-full bg-gray-100"></div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="İçinden geçenleri, dualarını ve tefekkürlerini yaz..."
              className="w-full h-[40vh] text-lg text-gray-600 leading-relaxed placeholder-gray-300 outline-none resize-none bg-transparent font-serif"
            />
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-1"><Tag size={14}/> Etiketler</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedTags.includes(tag) ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {editorId && (
              <div className="pt-8 flex justify-center">
                  <button onClick={(e) => handleDelete(editorId, e)} className="text-red-400 flex items-center gap-2 text-sm font-medium hover:text-red-600 bg-red-50 px-4 py-2 rounded-xl transition-colors">
                      <Trash2 size={16}/> Notu Sil
                  </button>
              </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 h-full flex flex-col pt-4 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tefekkür Günlüğü</h2>
          <p className="text-xs text-gray-500">Manevi yolculuğunu kaydet</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPrivacyMode(!privacyMode)} 
            className={`p-2.5 rounded-xl transition-colors ${privacyMode ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-gray-200 text-gray-400'}`}
            title="Mahremiyet Modu"
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button 
            onClick={() => { resetEditor(); setIsEditing(true); }} 
            className="flex items-center gap-2 px-4 bg-primary-600 rounded-xl text-white font-bold shadow-lg shadow-primary-200 active:scale-95 transition-transform"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Yeni Yazı</span>
          </button>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex mb-6">
          <button onClick={() => setViewMode('LIST')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-gray-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}>Akış</button>
          <button onClick={() => setViewMode('CALENDAR')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'CALENDAR' ? 'bg-gray-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}>Takvim</button>
          <button onClick={() => setViewMode('STATS')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'STATS' ? 'bg-gray-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}>Analiz</button>
      </div>

      {/* VIEW CONTENT */}
      {viewMode === 'STATS' && <StatsView />}
      {viewMode === 'CALENDAR' && <CalendarView />}
      
      {viewMode === 'LIST' && (
          <div className="flex-1 flex flex-col overflow-hidden">
              {/* Daily Prompt */}
              {!searchQuery && (
                <div className="mb-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 p-[1px] rounded-2xl shadow-sm group hover:shadow-md transition-all cursor-pointer" onClick={() => { resetEditor(); setTitle('Günün Sorusu Cevabım'); setContent(`Soru: ${dailyPrompt}\n\nCevap: `); setIsEditing(true); }}>
                  <div className="bg-white p-4 rounded-[15px] relative overflow-hidden">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Sparkles size={18}/></div>
                        <div className="flex-1">
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1 block">Günün Sorusu</span>
                            <p className="text-gray-800 font-medium italic text-sm">"{dailyPrompt}"</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 mt-2"/>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Notlarında ara..." 
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm transition-shadow focus:shadow-md" 
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    onClick={() => setFilterMood(null)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!filterMood ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    Tümü
                  </button>
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterMood === m.id ? `${m.bg} ${m.color} ${m.border}` : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      <m.icon size={14} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entries List */}
              <div className="flex-1 overflow-y-auto pb-24 space-y-3 no-scrollbar">
                {filteredEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpen size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-medium">Henüz bir not bulunmuyor.</p>
                    <p className="text-xs mt-1 opacity-70">Kalbinden geçenleri yazmaya başla.</p>
                  </div>
                ) : (
                  filteredEntries.map((entry, index) => {
                    const mood = getMoodConfig(entry.mood);
                    return (
                      <div 
                        key={entry.id} 
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleEdit(entry)}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden"
                      >
                        {entry.isFavorite && <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-100 rounded-bl-2xl flex items-center justify-center"><Star size={12} className="text-yellow-600 fill-yellow-600"/></div>}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${mood.bg} ${mood.color} border ${mood.border}`}>
                            <mood.icon size={14} />
                            <span className="text-[10px] font-bold">{mood.label}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 pr-6">
                            {new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">{entry.title}</h3>
                        <p className={`text-sm text-gray-600 line-clamp-3 leading-relaxed font-serif ${privacyMode ? 'blur-sm select-none opacity-50' : ''}`}>
                          {entry.content}
                        </p>
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-50">
                            {entry.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1">
                                <Tag size={10} /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Journal;
