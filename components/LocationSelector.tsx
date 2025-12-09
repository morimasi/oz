import React, { useState } from 'react';
import { LocationConfig } from '../types';
import { MapPin, Navigation, Search, Check } from 'lucide-react';

interface LocationSelectorProps {
  onSelect: (config: LocationConfig) => void;
  onClose: () => void;
  currentConfig?: LocationConfig;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelect, onClose, currentConfig }) => {
  const [mode, setMode] = useState<'GPS' | 'MANUAL'>(currentConfig?.type || 'GPS');
  const [city, setCity] = useState(currentConfig?.city || '');
  const [country, setCountry] = useState(currentConfig?.country || 'Turkey');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGPS = () => {
    setIsLoadingGPS(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Tarayıcınız konum servisini desteklemiyor.");
      setIsLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSelect({
          type: 'GPS',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLoadingGPS(false);
      },
      (err) => {
        console.error(err);
        setError("Konum alınamadı. Lütfen GPS iznini kontrol edin veya manuel şehir seçin.");
        setIsLoadingGPS(false);
      }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim()) {
      setError("Lütfen şehir ve ülke giriniz.");
      return;
    }
    onSelect({
      type: 'MANUAL',
      city: city.trim(),
      country: country.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Konum Ayarları</h2>
          <p className="text-sm text-gray-500 mb-6">Namaz vakitleri için konumunuzu belirleyin.</p>

          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('GPS')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'GPS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Navigation size={14} /> Otomatik (GPS)
            </button>
            <button 
              onClick={() => setMode('MANUAL')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Search size={14} /> Şehir Seç
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {mode === 'GPS' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <Navigation size={32} className={isLoadingGPS ? "animate-pulse" : ""} />
              </div>
              <p className="text-sm text-gray-600 mb-6 px-4">
                En doğru namaz vakitleri için cihazınızın GPS konumunu kullanın.
              </p>
              <button 
                onClick={handleGPS}
                disabled={isLoadingGPS}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-70"
              >
                {isLoadingGPS ? "Konum Alınıyor..." : "Konumumu Bul"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Şehir</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Örn: Istanbul"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Ülke</label>
                <input 
                  type="text" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Örn: Turkey"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all mt-2"
              >
                Kaydet
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;