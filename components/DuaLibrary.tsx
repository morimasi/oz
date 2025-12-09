
import React, { useState, useEffect, useMemo } from 'react';
import { DuaCategory, Dua } from '../types';
import { duaCategories } from '../services/duaData';
import { Search, ChevronDown, ChevronUp, Heart, HelpingHand, Star, Copy, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';

interface DuaLibraryProps {
    onBack?: () => void;
}

const DuaLibrary: React.FC<DuaLibraryProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(null);
  const [favoriteDuaIds, setFavoriteDuaIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('dua_favorites');
      if (savedFavorites) {
        setFavoriteDuaIds(JSON.parse(savedFavorites));
      }
    } catch(e) { console.error("Failed to parse dua favorites.", e); }
  }, []);

  useEffect(() => {
      if (showToast.visible) {
          const timer = setTimeout(() => setShowToast({ ...showToast, visible: false }), 2000);
          return () => clearTimeout(timer);
      }
  }, [showToast]);

  const toggleFavorite = (duaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favoriteDuaIds.includes(duaId)
      ? favoriteDuaIds.filter(id => id !== duaId)
      : [...favoriteDuaIds, duaId];
    setFavoriteDuaIds(newFavorites);
    localStorage.setItem('dua_favorites', JSON.stringify(newFavorites));
  };

  const handleCopy = (dua: Dua) => {
      const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\nAnlamı: ${dua.meaning}\n\n(Öz'e Yolculuk Uygulaması)`;
      navigator.clipboard.writeText(text).then(() => {
          setShowToast({ message: 'Dua kopyalandı', visible: true });
      }).catch(err => console.error('Copy failed', err));
  };

  const handleShare = (dua: Dua) => {
      const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\nAnlamı: ${dua.meaning}\n\n(Öz'e Yolculuk Uygulaması)`;
      if (navigator.share) {
          navigator.share({
              title: dua.title,
              text: text,
          }).catch(err => console.error('Share failed', err));
      } else {
          handleCopy(dua);
      }
  };

  const allDuaList = useMemo(() => duaCategories.flatMap(cat => cat.duas), []);

  const favoriteDuasCategory: DuaCategory | null = useMemo(() => {
    if (favoriteDuaIds.length === 0) return null;
    const favoriteDuas = allDuaList.filter(dua => favoriteDuaIds.includes(dua.id));
    return {
      id: 'favorites',
      name: 'Favorilerim',
      duas: favoriteDuas
    };
  }, [favoriteDuaIds, allDuaList]);
  
  const categoriesToDisplay = useMemo(() => {
    const filterDua = (dua: Dua) => 
        dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dua.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dua.transliteration.toLowerCase().includes(searchQuery.toLowerCase());

    const filteredCategories = duaCategories.map(category => ({
      ...category,
      duas: category.duas.filter(filterDua)
    })).filter(category => category.duas.length > 0);
    
    if (favoriteDuasCategory) {
        const filteredFavorites = {
            ...favoriteDuasCategory,
            duas: favoriteDuasCategory.duas.filter(filterDua)
        };
        if (filteredFavorites.duas.length > 0) {
            return [filteredFavorites, ...filteredCategories];
        }
    }
    
    return filteredCategories;

  }, [searchQuery, favoriteDuasCategory]);


  const DuaItem: React.FC<{ dua: Dua }> = ({ dua }) => {
    const isExpanded = expandedDuaId === dua.id;
    const isFavorite = favoriteDuaIds.includes(dua.id);

    return (
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div 
          onClick={() => setExpandedDuaId(isExpanded ? null : dua.id)}
          className="flex items-start justify-between cursor-pointer"
        >
          <div className="flex-1 pr-4">
              <h3 className="font-bold text-gray-800">{dua.title}</h3>
              {!isExpanded && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{dua.meaning}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => toggleFavorite(dua.id, e)} className="p-2 -m-2 text-gray-300 hover:text-red-500">
              <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} className={isFavorite ? 'text-red-500' : ''} />
            </button>
            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-500">
            <div>
              <h4 className="font-semibold text-primary-800 mb-2 text-xl font-serif text-right leading-relaxed">{dua.arabic}</h4>
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Okunuşu</h5>
              <p className="text-gray-600 italic leading-relaxed">{dua.transliteration}</p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Anlamı</h5>
              <p className="text-gray-800 leading-relaxed">{dua.meaning}</p>
            </div>
            {dua.virtue && (
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                <h5 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Fazileti</h5>
                <p className="text-sm text-teal-900/80 leading-relaxed">{dua.virtue}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
                <button onClick={() => handleCopy(dua)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
                    <Copy size={16} /> Kopyala
                </button>
                <button onClick={() => handleShare(dua)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors">
                    <Share2 size={16} /> Paylaş
                </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 h-full flex flex-col pt-6 relative">
      <div className="pb-4">
        <div className="flex items-center gap-3">
             {onBack && (
               <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                   <ArrowLeft size={24} />
               </button>
             )}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-md">
                    <HelpingHand size={24} />
                </div>
                <div>
                     <h2 className="text-2xl font-bold text-gray-800">Dua Kütüphanesi</h2>
                     <p className="text-sm text-gray-500">Manevi sığınağınız</p>
                </div>
            </div>
        </div>
        <div className="relative mt-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dua ara (örn: şifa, sabah...)"
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto space-y-6 pb-24 no-scrollbar">
        {categoriesToDisplay.length > 0 ? categoriesToDisplay.map((category, index) => (
          <div 
            key={category.id}
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            className="animate-in fade-in duration-500"
          >
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-50 py-2 z-10">
              {category.id === 'favorites' ? <Star size={16} className="text-yellow-500"/> : <div className="w-1 h-4 bg-primary-500 rounded-full"/>}
              <h3 className={`text-base font-bold ${category.id === 'favorites' ? 'text-yellow-600' : 'text-gray-700'}`}>{category.name}</h3>
            </div>
            <div className="space-y-3">
              {category.duas.map((dua) => (
                <DuaItem key={dua.id} dua={dua} />
              ))}
            </div>
          </div>
        )) : (
            <div className="text-center py-12 text-gray-400">
                <HelpingHand size={48} className="mx-auto mb-3 opacity-20"/>
                <p>Aradığınız dua bulunamadı.</p>
            </div>
        )}
      </div>

       {/* Toast Notification */}
       {showToast.visible && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white text-sm font-medium px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400"/>
              {showToast.message}
          </div>
      )}
    </div>
  );
};

export default DuaLibrary;
