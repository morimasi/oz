import React from 'react';
import { Home, CheckSquare, BookText, BookOpen, Sparkles, User, Wind, MoonStar } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: Tab.HOME, icon: Home, label: 'Ana Sayfa' },
    { id: Tab.PRAYER, icon: CheckSquare, label: 'Takip' },
    { id: Tab.SPIRITUAL, icon: MoonStar, label: 'Manevi' },
    { id: Tab.QURAN, icon: BookText, label: 'Kuran' },
    { id: Tab.JOURNAL, icon: BookOpen, label: 'Notlar' },
    { id: Tab.GUIDE, icon: Sparkles, label: 'Rehber' },
    { id: Tab.QUIET, icon: Wind, label: 'Huzur' },
    { id: Tab.PROFILE, icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[92%] max-w-lg">
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-full px-2 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-white/50">
        <div className="flex justify-between items-center relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center w-full h-10 transition-all duration-500 group`}
              >
                <div className={`absolute inset-0 m-auto w-10 h-10 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-primary-500 scale-100 opacity-100 shadow-lg shadow-primary-500/30' : 'scale-0 opacity-0'
                }`}></div>
                
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`relative z-10 transition-all duration-300 ${
                    isActive 
                      ? 'text-white scale-110' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                
                {/* Active Indicator Dot removed for cleaner pill look, changed to text hide */}
                <span className={`absolute -bottom-8 text-[9px] font-bold bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;