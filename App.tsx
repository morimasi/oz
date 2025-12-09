
import React, { useState, useEffect, createContext } from 'react';
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
import { Tab, PrayerTimes, UserProfile, AudioPlayerContextType } from './types';
import { getPrayerTimes } from './services/prayerTimeService';
import { useAudioPlayer } from './hooks/useAudioPlayer';

export const AppContext = createContext<AudioPlayerContextType | null>(null);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    // Load user profile
    try {
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        // Create a default profile if none exists for a better first-time experience
        const defaultProfile: UserProfile = {
            name: 'Kullanıcı',
            joinDate: new Date().toISOString()
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
      }
    } catch(error) {
      console.error("Failed to parse user profile, resetting.", error);
      localStorage.removeItem('user_profile');
    }

    // Fetch location and prayer times on initial load
    if (navigator.geolocation) {
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
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Namaz vakitleri için konum izni vermeniz gerekmektedir.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Konum bilgisi alınamıyor. Cihazınızın konum servisini kontrol edin.");
              break;
            case error.TIMEOUT:
              setLocationError("Konum bilgisi alırken zaman aşımı oldu.");
              break;
            default:
              setLocationError("Konum alınırken bir hata oluştu.");
              break;
          }
        }
      );
    } else {
      setLocationError("Tarayıcınız konum servisini desteklemiyor.");
    }
  }, []);
  
  const handleUpdateProfile = (name: string) => {
    const updatedProfile: UserProfile = {
      name,
      joinDate: userProfile?.joinDate || new Date().toISOString(),
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
  };

  const handleClearAllData = () => {
    if (window.confirm("Emin misiniz? Tüm verileriniz (namaz takibi, notlar, sohbet geçmişi vb.) kalıcı olarak silinecektir.")) {
      localStorage.clear();
      window.location.reload();
    }
  };


  const renderContent = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    switch (activeTab) {
      case Tab.HOME:
        return <Home profile={userProfile} changeTab={setActiveTab} prayerTimes={prayerTimes} locationError={locationError} />;
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
        return <AIGuide userProfile={userProfile} />;
      case Tab.QUIET:
        return <QuietCorner />;
      case Tab.PROFILE:
        return <Profile profile={userProfile} onUpdateProfile={handleUpdateProfile} onClearAllData={handleClearAllData} />;
      default:
        return <Home profile={userProfile} changeTab={setActiveTab} prayerTimes={prayerTimes} locationError={locationError} />;
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

export default App;
