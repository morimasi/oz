
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
import { Tab, PrayerTimes, AudioPlayerContextType } from './types';
import { getPrayerTimes } from './services/prayerTimeService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Loader2 } from 'lucide-react';

export const AppContext = createContext<AudioPlayerContextType | null>(null);

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    // Fetch location and prayer times on initial load if user is logged in
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const today = new Date().toISOString().split('T')[0];
          const times = await getPrayerTimes(latitude, longitude, today);
          if (times) {
            setPrayerTimes(times);
            setLocationError(null);
          } else {
            setLocationError("Namaz vakitleri alınamadı. Lütfen internet bağlantınızı kontrol edin.");
          }
        },
        (error) => {
          // Handle specific errors...
          setLocationError("Konum servisi uyarısı: " + error.message);
        }
      );
    }
  }, [user]);

  const handleClearAllData = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      logout();
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
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
        return <Home profile={user} changeTab={setActiveTab} prayerTimes={prayerTimes} locationError={locationError} />;
      case Tab.PRAYER:
        return (
          <div className="pt-6">
             <div className="px-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">İbadet Takibi</h2>
             </div>
             <PrayerTracker date={todayStr} prayerTimes={prayerTimes} />
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
        return <Home profile={user} changeTab={setActiveTab} prayerTimes={prayerTimes} locationError={locationError} />;
    }
  };

  return (
    <AppContext.Provider value={audioPlayer}>
      <div className="h-screen w-screen bg-inherit font-sans text-gray-900 flex flex-col">
        <main className="flex-1 overflow-y-auto">
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
