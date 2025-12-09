
export enum Tab {
  HOME = 'HOME',
  PRAYER = 'PRAYER',
  SPIRITUAL = 'SPIRITUAL', // Unified tab for Dhikr, Dua, and Esma
  QURAN = 'QURAN',
  JOURNAL = 'JOURNAL',
  GUIDE = 'GUIDE',
  QUIET = 'QUIET',
  PROFILE = 'PROFILE'
}

export interface PrayerStatus {
  id: string;
  name: string;
  completed: boolean;
  isSunnah?: boolean;
}

export interface DailyRecord {
  date: string; // ISO Date string YYYY-MM-DD
  prayers: PrayerStatus[];
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: 'grateful' | 'repentant' | 'hopeful' | 'sad' | 'peaceful' | 'reflective' | 'struggling';
  tags?: string[];
  isFavorite?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isLoading?: boolean;
  timestamp: string;
  status?: 'sent' | 'read';
}

export interface Bookmark {
  id: string;
  text: string;
  date: string;
  source?: string; // Extracted source like "Bakara, 255"
  note?: string; // Kişisel notlar için
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface AIPersonality {
  // Kişilik Özellikleri
  wise?: boolean;
  compassionate?: boolean;
  calm?: boolean;
  reassuring?: boolean;
  humanistic?: boolean;
  // İletişim Tarzı
  inquisitive?: boolean;
  empathetic?: boolean;
  solutionOriented?: boolean;
}

// SAAS Updates: User & Subscription Types
export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  joinDate: string; // ISO Date string
  avatar?: string;
  subscriptionTier: SubscriptionTier;
  stats: {
    streak: number;
    totalPrayers: number;
    xp: number;
  }
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
}

// Quran Module Types
export interface Verse {
  id: string;
  number: number;
  text: string;
}

export interface Surah {
  id: number;
  name: string;
  revelationOrder: number;
  verses: Verse[];
  description?: string;
}

export interface QuranBookmark {
  id: string; // e.g., "96-1"
  surahName: string;
  verseNumber: number;
  text: string;
  note?: string;
  date: string;
}

export const PRAYER_NAMES = [
  { id: 'fajr', name: 'Sabah', sunnah: true },
  { id: 'dhuhr', name: 'Öğle', sunnah: true },
  { id: 'asr', name: 'İkindi', sunnah: true },
  { id: 'maghrib', name: 'Akşam', sunnah: true },
  { id: 'isha', name: 'Yatsı', sunnah: true },
];

// Audio Player Types
export interface AudioPlayerContextType {
  isPlaying: boolean;
  isLoading: boolean;
  currentSurah: Surah | null;
  currentVerse: Verse | null;
  playbackRate: number;
  // Timing info for Karaoke effect
  audioTiming: { startTime: number; duration: number }; 
  getCurrentTime: () => number; // Helper to get live context time
  setPlaybackRate: (rate: number) => void;
  playSurah: (surah: Surah, verseIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  playNextVerse: () => void;
  playPrevVerse: () => void;
  skipToNextSurah: () => void;
  skipToPrevSurah: () => void;
  stop: () => void;
}

// Esma-ül Hüsna Types
export interface Esma {
  id: number;
  name: string;
  transliteration: string;
  meaning: string;
  description: string;
}

// Dhikr/Tesbihat Types
export interface Dhikr {
  id: string;
  text: string;
  target: number;
  isCustom: boolean;
}

export interface DhikrProgress {
  dhikrId: string;
  count: number;
}

// Dua Library Types
export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  virtue?: string; // Fazileti
}

export interface DuaCategory {
  id: string;
  name: string;
  duas: Dua[];
}

// Location Types
export interface LocationConfig {
  type: 'GPS' | 'MANUAL';
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}