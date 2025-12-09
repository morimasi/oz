
import React, { useState } from 'react';
import { esmaulHusna } from '../services/esmaulhusnaData';
import { Esma } from '../types';
import { Search, ChevronDown, ChevronUp, Gem, ArrowLeft } from 'lucide-react';

interface EsmaulHusnaProps {
    onBack?: () => void;
}

const EsmaulHusna: React.FC<EsmaulHusnaProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredEsma = esmaulHusna.filter(
    (esma) =>
      esma.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      esma.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      esma.name.includes(searchQuery)
  );
  
  const handleToggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="px-4 h-full flex flex-col pt-6">
      <div className="pb-4">
        <div className="flex items-center gap-3">
            {onBack && (
               <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                   <ArrowLeft size={24} />
               </button>
             )}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <Gem size={24} />
                </div>
                <div>
                     <h2 className="text-2xl font-bold text-gray-800">Esma-ül Hüsna</h2>
                     <p className="text-sm text-gray-500">Allah'ın 99 Güzel İsmi</p>
                </div>
            </div>
        </div>
        <div className="relative mt-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim veya anlam ara..."
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>
      <div className="overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {filteredEsma.map((esma, index) => (
          <div
            key={esma.id}
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          >
            <button 
              onClick={() => handleToggleExpand(esma.id)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={expandedId === esma.id}
              aria-controls={`esma-description-${esma.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-primary-700 font-bold">
                  {esma.id}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{esma.transliteration}</h3>
                  <p className="text-sm text-gray-500">{esma.meaning}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-serif text-3xl text-primary-800">{esma.name}</p>
                 {expandedId === esma.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>
            {expandedId === esma.id && (
              <div 
                id={`esma-description-${esma.id}`}
                className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-500"
              >
                <p className="text-gray-600 leading-relaxed">{esma.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EsmaulHusna;
