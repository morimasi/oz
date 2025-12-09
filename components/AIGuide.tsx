
import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, Bookmark, AIPersonality, UserProfile } from '../types';
import { Send, Sparkles, User, Loader2, Mic, MicOff, Search, X, Bookmark as BookmarkIcon, Trash2, ChevronDown, RefreshCw, ArrowRight, Heart, GraduationCap, Star, CloudRain, Sun, HelpCircle, Lock } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import PaywallModal from './PaywallModal';

interface AIGuideProps {
    userProfile: UserProfile | null;
}

type GuideMode = 'FRIEND' | 'TEACHER' | 'SAGE';

const MODES: Record<GuideMode, { label: string, icon: React.ElementType, desc: string, color: string, traits: AIPersonality }> = {
    FRIEND: {
        label: 'Yol Arkadaşı',
        icon: Heart,
        desc: 'Seni yargılamadan dinleyen, şefkatli bir dost.',
        color: 'text-rose-500 bg-rose-50 border-rose-200',
        traits: { compassionate: true, empathetic: true, reassuring: true, humanistic: true }
    },
    TEACHER: {
        label: 'İlim Hocası',
        icon: GraduationCap,
        desc: 'Ayet ve hadislerle öğreten, rehberlik eden.',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        traits: { wise: true, inquisitive: true, solutionOriented: true, calm: true }
    },
    SAGE: {
        label: 'Bilge Hakim',
        icon: Star,
        desc: 'Az ve öz konuşan, derin hikmet sahibi.',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        traits: { wise: true, calm: true, reassuring: true }
    }
};

const MOOD_STARTERS = [
    { id: 'distress', label: 'Kalbim Daralıyor', icon: CloudRain, prompt: 'İçimde tarifsiz bir sıkıntı var, sanki dünya üzerime geliyor. Kur\'an bana bu halde ne söyler?' },
    { id: 'gratitude', label: 'Şükür Doluyum', icon: Sun, prompt: 'Bugün çok güzel bir haber aldım, Rabbime nasıl en güzel şekilde şükredebilirim?' },
    { id: 'confusion', label: 'Kafam Karışık', icon: HelpCircle, prompt: 'Doğru ile yanlışı ayırt etmekte zorlanıyorum, bir konuda kararsızım. Bana bir yol gösterir misin?' },
    { id: 'advice', label: 'Tavsiye İstiyorum', icon: Sparkles, prompt: 'Maneviyatımı güçlendirmek için bugün yapabileceğim küçük ama etkili bir tavsiye verir misin?' },
];

const FOLLOW_UP_SUGGESTIONS = [
    "Bununla ilgili bir dua var mı?",
    "Hangi sureyi okumamı önerirsin?",
    "Bunu hayatıma nasıl uygularım?",
    "Peygamberimiz ne yapardı?",
    "Bu konuda başka bir bakış açısı var mı?"
];

// SaaS Limit Config
const FREE_MESSAGE_LIMIT = 5;

const AIGuide: React.FC<AIGuideProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GuideMode>('FRIEND');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // UI State
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Refs
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    try {
        const savedMessages = localStorage.getItem('ai_guide_history');
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        
        const savedBookmarks = localStorage.getItem('guide_bookmarks');
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    } catch(e) { console.error("Load error", e); }

    // Init Speech
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true; 
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
      chatSession.current = createChatSession(MODES[selectedMode].traits);
  }, [selectedMode]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (messages.length > 0) localStorage.setItem('ai_guide_history', JSON.stringify(messages));
  }, [messages]);

  // Check Daily Limit
  const checkLimit = () => {
      if (userProfile?.subscriptionTier === 'PREMIUM') return true;

      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('ai_usage_date');
      let count = parseInt(localStorage.getItem('ai_usage_count') || '0');

      if (savedDate !== today) {
          count = 0;
          localStorage.setItem('ai_usage_date', today);
      }

      if (count >= FREE_MESSAGE_LIMIT) {
          setShowPaywall(true);
          return false;
      }

      localStorage.setItem('ai_usage_count', (count + 1).toString());
      return true;
  };

  const handleSend = async (textOverride?: string) => {
      const textToSend = textOverride || input;
      if (!textToSend.trim()) return;

      if (!checkLimit()) return;

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: textToSend,
          timestamp: new Date().toISOString(),
          status: 'sent'
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      setSuggestions([]); 

      try {
          let messagePayload = textToSend;
          if (messages.length === 0 && userProfile?.name) {
              messagePayload = `(Kullanıcı Adı: ${userProfile.name}) ${textToSend}`;
          }

          const result = await chatSession.current?.sendMessage({ message: messagePayload });
          const responseText = (result as GenerateContentResponse).text;
          
          const modelMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: responseText || "Şu an cevap veremiyorum.",
              timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, modelMsg]);
          
          const shuffled = [...FOLLOW_UP_SUGGESTIONS].sort(() => 0.5 - Math.random());
          setSuggestions(shuffled.slice(0, 2));

      } catch (error) {
          console.error("Chat Error", error);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: "Bağlantıda bir sorun oluştu. Lütfen tekrar dene.",
              timestamp: new Date().toISOString()
          }]);
      } finally {
          setIsTyping(false);
      }
  };

  const handleClearHistory = () => {
      if(confirm('Sohbet geçmişi silinsin mi?')) {
          setMessages([]);
          localStorage.removeItem('ai_guide_history');
          chatSession.current = createChatSession(MODES[selectedMode].traits);
      }
  };

  const toggleBookmark = (msg: ChatMessage) => {
      const exists = bookmarks.find(b => b.id === msg.id);
      let newBookmarks;
      if(exists) {
          newBookmarks = bookmarks.filter(b => b.id !== msg.id);
      } else {
          newBookmarks = [{ id: msg.id, text: msg.text, date: new Date().toISOString(), source: 'Rehber Sohbeti' }, ...bookmarks];
      }
      setBookmarks(newBookmarks);
      localStorage.setItem('guide_bookmarks', JSON.stringify(newBookmarks));
  };

  const toggleListening = () => {
      if(!recognitionRef.current) return alert("Sesli giriş desteklenmiyor.");
      if(isListening) {
          recognitionRef.current.stop();
      } else {
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const renderMessageContent = (text: string) => {
      const parts = text.split(/(\([\w\sğüşöçıİĞÜŞÖÇ]+,\s*\d+\))/g);
      return parts.map((part, i) => {
          if (part.match(/\([\w\sğüşöçıİĞÜŞÖÇ]+,\s*\d+\)/)) {
              return <span key={i} className="font-bold text-primary-700 bg-primary-50 px-1 rounded">{part}</span>;
          }
          return part;
      });
  };

  const isPremium = userProfile?.subscriptionTier === 'PREMIUM';
  const remainingFree = FREE_MESSAGE_LIMIT - parseInt(localStorage.getItem('ai_usage_count') || '0');

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
        {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} featureName="Sınırsız Yapay Zeka Rehber" />}

        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shadow-sm">
            <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setShowModeSelector(!showModeSelector)}
            >
                <div className={`p-2 rounded-xl transition-colors ${MODES[selectedMode].color}`}>
                    {React.createElement(MODES[selectedMode].icon, { size: 18 })}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        {MODES[selectedMode].label} <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600"/>
                    </h2>
                    <p className="text-[10px] text-gray-500">Hüseyin Atay Meali</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {!isPremium && (
                    <div className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500 flex items-center gap-1">
                        <Lock size={10}/> {Math.max(0, remainingFree)} Hak
                    </div>
                )}
                <button onClick={() => setShowBookmarks(!showBookmarks)} className={`p-2 rounded-full transition-colors ${showBookmarks ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <BookmarkIcon size={20} />
                </button>
                <button onClick={handleClearHistory} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        {/* MODE SELECTOR */}
        {showModeSelector && (
            <div className="absolute top-[60px] left-4 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-64 animate-in slide-in-from-top-2 fade-in duration-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Rehber Modu Seç</h3>
                {Object.keys(MODES).map((key) => {
                    const modeKey = key as GuideMode;
                    const mode = MODES[modeKey];
                    const isSelected = selectedMode === modeKey;
                    return (
                        <button 
                            key={modeKey}
                            onClick={() => { setSelectedMode(modeKey); setShowModeSelector(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                        >
                            <div className={`p-2 rounded-full ${mode.color} bg-opacity-20`}>
                                <mode.icon size={16} />
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{mode.label}</h4>
                                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{mode.desc}</p>
                            </div>
                            {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"/>}
                        </button>
                    )
                })}
            </div>
        )}

        {/* BOOKMARKS */}
        {showBookmarks && (
            <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><BookmarkIcon size={20} className="text-yellow-500"/> Kaydedilenler</h3>
                    <button onClick={() => setShowBookmarks(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {bookmarks.length === 0 ? <p className="text-center text-gray-400 text-sm mt-10">Henüz kaydedilmiş mesaj yok.</p> : bookmarks.map(b => (
                        <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-600 mb-2 line-clamp-4 font-serif leading-relaxed">{b.text}</p>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>{new Date(b.date).toLocaleDateString('tr-TR')}</span>
                                <button onClick={() => {
                                    const newB = bookmarks.filter(x => x.id !== b.id);
                                    setBookmarks(newB);
                                    localStorage.setItem('guide_bookmarks', JSON.stringify(newB));
                                }} className="text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={12}/> Sil</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* MAIN CHAT */}
        <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 space-y-6">
            
            {messages.length === 0 && (
                <div className="animate-in slide-in-from-bottom-5 duration-700 mt-4 pb-20">
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse ${MODES[selectedMode].color.split(' ')[1]}`}>
                            {React.createElement(MODES[selectedMode].icon, { size: 40, className: MODES[selectedMode].color.split(' ')[0] })}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamun Aleyküm, {userProfile?.name || 'Can'}</h1>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            Ben senin <strong>{MODES[selectedMode].label}</strong>ınım. Bugün kalbin nasıl?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {MOOD_STARTERS.map(starter => (
                            <button 
                                key={starter.id}
                                onClick={() => handleSend(starter.prompt)}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-left group"
                            >
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 mb-3 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                    <starter.icon size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm mb-1">{starter.label}</h3>
                                <p className="text-[10px] text-gray-400 group-hover:text-gray-500">Başlamak için dokun</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isBookmarked = bookmarks.some(b => b.id === msg.id);
                
                return (
                    <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${isUser ? 'bg-gray-800 text-white' : 'bg-white border border-gray-100 text-primary-600'}`}>
                                {isUser ? <User size={14} /> : React.createElement(MODES[selectedMode].icon, { size: 14 })}
                            </div>

                            <div className={`relative group p-4 rounded-2xl shadow-sm ${
                                isUser 
                                ? 'bg-gray-800 text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-serif text-lg leading-relaxed'
                            }`}>
                                {isUser ? msg.text : renderMessageContent(msg.text)}
                                
                                {!isUser && (
                                    <div className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                        <button onClick={() => toggleBookmark(msg)} className={`p-2 rounded-full shadow-sm bg-white ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}>
                                            <BookmarkIcon size={16} fill={isBookmarked ? 'currentColor' : 'none'}/>
                                        </button>
                                    </div>
                                )}
                                <p className={`text-[10px] mt-2 text-right opacity-50 ${isUser ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {isTyping && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm ml-11">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}

            {!isTyping && suggestions.length > 0 && messages.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-11 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {suggestions.map((sug, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSend(sug)}
                            className="text-xs bg-white border border-primary-200 text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-50 active:scale-95 transition-all shadow-sm flex items-center gap-1"
                        >
                            {sug} <ArrowRight size={10} />
                        </button>
                    ))}
                </div>
            )}

            <div ref={messagesEndRef} className="h-20" /> 
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
            {isListening && (
                <div className="absolute -top-12 left-0 right-0 flex justify-center gap-1 h-8 items-end pb-2">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-1 bg-red-500 rounded-full animate-[bounce_0.5s_infinite]" style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
            )}

            <div className="relative flex items-end gap-2 bg-gray-100 rounded-3xl p-2 transition-all focus-within:ring-2 focus-within:ring-primary-100 focus-within:bg-white focus-within:shadow-md">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Kalbinden geçeni yaz..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 p-3 max-h-32 min-h-[44px] resize-none text-sm placeholder-gray-400"
                    rows={1}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <div className="flex items-center gap-1 pb-1">
                    <button 
                        onClick={toggleListening}
                        className={`p-2.5 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                    >
                        {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
                    </button>
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="p-2.5 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-200 disabled:opacity-50 disabled:shadow-none active:scale-90 transition-all hover:bg-primary-700"
                    >
                        {isTyping ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} className="ml-0.5"/>}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AIGuide;
