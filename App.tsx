import React, { useState, useEffect, createContext } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import BottomNav from './components/BottomNav';
import PrayerTracker from './components/PrayerTracker';
import Journal from './components/Journal';
import AIGuide from './components/AIGuide';
import Home from './components/Home';
import Profile from './components/Profile';
import Quran from './components/Quran';
import AudioPlayer from './components/AudioPlayer';
import QuietCorner from './components/QuietCorner';
import SpiritualCorner from './components/SpiritualCorner';
import LocationSelector from './components/LocationSelector';
import { Tab, PrayerTimes, AudioPlayerContextType, LocationConfig } from './types';
import { getPrayerTimes, getPrayerTimesByCity } from './services/prayerTimeService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Loader2 } from 'lucide-react';

export const AppContext = createContext<AudioPlayerContextType | null>(null);

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationConfig, setLocationConfig] = useState<LocationConfig | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    // Initial Load: Check saved location preference
    const savedConfig = localStorage.getItem('location_config');
    if (savedConfig) {
      try {
        setLocationConfig(JSON.parse(savedConfig));
      } catch (e) {
        // Fallback if corrupted
        setLocationConfig(null);
      }
    } else {
      // If no config, try GPS automatically once
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const config: LocationConfig = {
              type: 'GPS',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            handleUpdateLocation(config);
          },
          () => {
            // If GPS denied, do nothing, let user see error or use manual selector
            setShowLocationSelector(true);
          }
        );
      }
    }
  }, []);

  useEffect(() => {
    const fetchTimes = async () => {
      if (!locationConfig) return;

      const today = new Date().toISOString().split('T')[0];
      let times: PrayerTimes | null = null;

      if (locationConfig.type === 'GPS' && locationConfig.latitude && locationConfig.longitude) {
        times = await getPrayerTimes(locationConfig.latitude, locationConfig.longitude, today);
      } else if (locationConfig.type === 'MANUAL' && locationConfig.city && locationConfig.country) {
        times = await getPrayerTimesByCity(locationConfig.city, locationConfig.country, today);
      }

      if (times) {
        setPrayerTimes(times);
        setLocationError(null);
      } else {
        setLocationError("Namaz vakitleri alınamadı.");
      }
    };

    fetchTimes();
  }, [locationConfig]);

  const handleUpdateLocation = (config: LocationConfig) => {
    setLocationConfig(config);
    localStorage.setItem('location_config', JSON.stringify(config));
    setShowLocationSelector(false);
  };

  const handleClearAllData = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      logout();
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-sand-50">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    switch (activeTab) {
      case Tab.HOME:
        return (
          <Home 
            profile={user} 
            changeTab={setActiveTab} 
            prayerTimes={prayerTimes} 
            locationError={locationError} 
            locationConfig={locationConfig}
            onOpenLocationSelector={() => setShowLocationSelector(true)}
          />
        );
      case Tab.PRAYER:
        return (
          <div className="pt-6 h-full flex flex-col">
             <div className="px-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">İbadet Takibi</h2>
                <p className="text-sm text-gray-500">Düzenli ibadet, huzurlu kalp.</p>
             </div>
             <PrayerTracker date={todayStr} prayerTimes={prayerTimes} onChangeTab={setActiveTab} />
          </div>
        );
       case Tab.SPIRITUAL:
        return <SpiritualCorner />;
      case Tab.JOURNAL:
        return (
          <div className="pt-6 h-full">
            <Journal />
          </div>
        );
       case Tab.QURAN:
        return (
          <div className="pt-6 h-full">
            <Quran />
          </div>
        );
      case Tab.GUIDE:
        return <AIGuide userProfile={user} />;
      case Tab.QUIET:
        return <QuietCorner />;
      case Tab.PROFILE:
        return <Profile profile={user} onUpdateProfile={(name) => updateUser({ name })} onClearAllData={handleClearAllData} />;
      default:
        return (
          <Home 
            profile={user} 
            changeTab={setActiveTab} 
            prayerTimes={prayerTimes} 
            locationError={locationError} 
            locationConfig={locationConfig}
            onOpenLocationSelector={() => setShowLocationSelector(true)}
          />
        );
    }
  };

  return (
    <AppContext.Provider value={audioPlayer}>
      <div className="h-screen w-screen font-sans text-gray-900 flex flex-col bg-sand-50 relative overflow-hidden">
        
        {/* Modern Organic Background Mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-200/30 rounded-full blur-[80px] mix-blend-multiply animate-float"></div>
            <div className="absolute top-[20%] right-[-15%] w-[400px] h-[400px] bg-sand-300/40 rounded-full blur-[80px] mix-blend-multiply animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-[100px] mix-blend-multiply animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        {showLocationSelector && (
          <LocationSelector 
            onSelect={handleUpdateLocation} 
            onClose={() => setShowLocationSelector(false)}
            currentConfig={locationConfig || undefined}
          />
        )}

        <main className="flex-1 overflow-y-auto relative z-10">
          {renderContent()}
        </main>
        
        <AudioPlayer />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;