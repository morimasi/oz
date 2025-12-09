
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
    { id: Tab.SPIRITUAL, icon: MoonStar, label: 'Maneviyat' },
    { id: Tab.QURAN, icon: BookText, label: 'Kuran' },
    { id: Tab.JOURNAL, icon: BookOpen, label: 'Notlar' },
    { id: Tab.GUIDE, icon: Sparkles, label: 'Rehber' },
    { id: Tab.QUIET, icon: Wind, label: 'Sessizlik' },
    { id: Tab.PROFILE, icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-1 pb-4 shadow-[0_-4px_12px_-1px_theme(colors.primary.100)] z-50">
      <div className="flex justify-around items-start max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center transition-colors duration-200 h-12 w-12 ${
                isActive ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
              />
              <span className="text-[10px] font-medium hidden sm:block mt-1 text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
