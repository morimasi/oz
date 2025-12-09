
import React, { useState } from 'react';
import { X, Check, Star, Zap, Crown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PaywallModalProps {
  onClose: () => void;
  featureName?: string;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, featureName }) => {
  const { upgradeToPremium } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    upgradeToPremium();
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full z-10 transition-colors"
        >
            <X size={20} className="text-gray-600"/>
        </button>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg rotate-3">
                    <Crown size={32} className="text-yellow-300 fill-yellow-300"/>
                </div>
                <h2 className="text-2xl font-bold mb-2">Premium'a Geç</h2>
                <p className="text-white/80 text-sm">
                    {featureName ? `${featureName} ve daha fazlasına eriş.` : "Sınırları kaldır, ruhunu özgürleştir."}
                </p>
            </div>
        </div>

        {/* Features List */}
        <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Zap size={20} /></div>
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">Sınırsız Yapay Zeka</h4>
                    <p className="text-xs text-gray-500">Rehber ile dilediğin kadar sohbet et.</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-teal-50 rounded-xl">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><ShieldCheck size={20} /></div>
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">Bulut Yedekleme</h4>
                    <p className="text-xs text-gray-500">Verilerin asla kaybolmaz, her yerden eriş.</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Star size={20} /></div>
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">Detaylı Analizler</h4>
                    <p className="text-xs text-gray-500">Manevi gelişimini grafiklerle takip et.</p>
                </div>
            </div>
        </div>

        {/* Pricing & CTA */}
        <div className="p-6 pt-0">
            <div className="text-center mb-6">
                <span className="text-3xl font-black text-gray-900">₺49.99</span>
                <span className="text-gray-500 text-sm"> / ay</span>
                <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">İlk 7 gün ücretsiz dene</p>
            </div>

            <button 
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? "İşleniyor..." : "Premium Başlat"}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-4">İstediğin zaman iptal edebilirsin.</p>
        </div>

      </div>
    </div>
  );
};

export default PaywallModal;
