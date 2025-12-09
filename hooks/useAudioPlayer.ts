
import { useState, useRef, useCallback, useEffect } from 'react';
import { Surah, Verse } from '../types';
import { surahs as allSurahs } from '../services/quranData';
import { generateVerseSpeech } from '../services/geminiService';

// Audio Context Singleton
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

// Helper: LRU Cache Class to prevent memory leaks
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

// Helper: Decode functions
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodePcmData(data: Uint8Array): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = audioContext.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Timing state for UI highlighting
  const [audioTiming, setAudioTiming] = useState<{ startTime: number; duration: number }>({ startTime: 0, duration: 0 });

  // Use LRU Cache limit to ~50 verses to save memory
  const audioCache = useRef<LRUCache<string, AudioBuffer>>(new LRUCache(50));
  const activeSource = useRef<AudioBufferSourceNode | null>(null);
  
  // Track the current playback session to handle race conditions (rapid clicks)
  const sessionCounter = useRef(0);
  // Track requests in flight to prevent duplicate fetches
  const fetchPromises = useRef<Map<string, Promise<AudioBuffer | null>>>(new Map());

  // Update active source rate whenever state changes
  useEffect(() => {
    if (activeSource.current) {
        try {
            activeSource.current.playbackRate.value = playbackRate;
        } catch (e) {
            console.error("Failed to update playback rate", e);
        }
    }
  }, [playbackRate]);

  const getVerseLocation = (surahId: number, verseId: string) => {
    const surahIndex = allSurahs.findIndex(s => s.id === surahId);
    if (surahIndex === -1) return null;
    const verseIndex = allSurahs[surahIndex].verses.findIndex(v => v.id === verseId);
    return { surahIndex, verseIndex, surah: allSurahs[surahIndex] };
  };

  const getRelativeVerse = (surahId: number, verseId: string, offset: number) => {
    const loc = getVerseLocation(surahId, verseId);
    if (!loc) return null;
    let { surahIndex, verseIndex } = loc;
    
    // Simple logic for next/prev verse within the same surah or crossing boundary
    // For simplicity, flattening the Quran structure logically
    // Moving forward
    while (offset > 0) {
        if (verseIndex + 1 < allSurahs[surahIndex].verses.length) {
            verseIndex++;
            offset--;
        } else if (surahIndex + 1 < allSurahs.length) {
            surahIndex++;
            verseIndex = 0;
            offset--;
        } else {
            return null; // End of Quran
        }
    }
    // Moving backward (not implemented fully for prefetching, usually we prefetch forward)
    
    return { 
        surah: allSurahs[surahIndex], 
        verse: allSurahs[surahIndex].verses[verseIndex] 
    };
  };

  const fetchAudioWithRetry = async (text: string, retries = 2): Promise<AudioBuffer | null> => {
    for (let i = 0; i <= retries; i++) {
        try {
            const base64Audio = await generateVerseSpeech(text);
            if (base64Audio) {
                return await decodePcmData(decodeBase64(base64Audio));
            }
        } catch (err) {
            console.warn(`Attempt ${i + 1} failed for TTS generation`, err);
            if (i === retries) return null;
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
        }
    }
    return null;
  };

  const getOrFetchAudio = async (verse: Verse): Promise<AudioBuffer | null> => {
    if (audioCache.current.has(verse.id)) {
        return audioCache.current.get(verse.id)!;
    }

    if (fetchPromises.current.has(verse.id)) {
        return fetchPromises.current.get(verse.id)!;
    }

    const promise = fetchAudioWithRetry(verse.text).then(buffer => {
        fetchPromises.current.delete(verse.id);
        if (buffer) {
            audioCache.current.set(verse.id, buffer);
        }
        return buffer;
    });

    fetchPromises.current.set(verse.id, promise);
    return promise;
  };

  // Prefetch the next 2 verses to ensure gapless playback
  const prefetchUpcoming = (surahId: number, verseId: string) => {
     for (let i = 1; i <= 2; i++) {
         const next = getRelativeVerse(surahId, verseId, i);
         if (next) {
             getOrFetchAudio(next.verse);
         }
     }
  };

  const stop = useCallback(() => {
    sessionCounter.current++; // Invalidate current session
    if (activeSource.current) {
        try {
            activeSource.current.stop();
            activeSource.current.disconnect();
        } catch (e) { /* ignore */ }
        activeSource.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setAudioTiming({ startTime: 0, duration: 0 });
  }, []);

  const playVerse = useCallback(async (surah: Surah, verse: Verse) => {
    // 1. Setup session
    const currentSessionId = ++sessionCounter.current;
    
    // 2. Update UI State immediately
    setCurrentSurah(surah);
    setCurrentVerse(verse);
    setIsLoading(true);
    setIsPlaying(false);
    setAudioTiming({ startTime: 0, duration: 0 }); // Reset timing

    // 3. Ensure AudioContext is running (fix for Autoplay Policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    // 4. Stop previous audio
    if (activeSource.current) {
        try { activeSource.current.stop(); } catch(e){}
        activeSource.current = null;
    }

    // 5. Start fetching (or get from cache)
    // Trigger prefetch for next ones in parallel
    prefetchUpcoming(surah.id, verse.id);

    const buffer = await getOrFetchAudio(verse);

    // 6. Check if session is still valid (user hasn't clicked something else)
    if (currentSessionId !== sessionCounter.current) return;

    if (!buffer) {
        // Handle error (maybe skip to next or stop)
        console.error("Failed to load audio for verse");
        setIsLoading(false);
        // Optional: Auto-skip or show error
        return;
    }

    // 7. Play Audio
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    // Set initial playback rate
    source.playbackRate.value = playbackRate; 
    source.connect(audioContext.destination);
    
    source.onended = () => {
        if (currentSessionId === sessionCounter.current) {
            // Auto-play next
            const next = getRelativeVerse(surah.id, verse.id, 1);
            if (next) {
                playVerse(next.surah, next.verse);
            } else {
                stop(); // End of Quran
            }
        }
    };

    source.start();
    activeSource.current = source;
    
    // Set Timing info for UI Highlighting
    setAudioTiming({ 
        startTime: audioContext.currentTime, 
        duration: buffer.duration 
    });

    setIsLoading(false);
    setIsPlaying(true);

  }, [stop, playbackRate]); 

  const playSurah = (surah: Surah, verseIndex: number = 0) => {
      if (surah.verses[verseIndex]) {
          playVerse(surah, surah.verses[verseIndex]);
      }
  };

  const pause = () => {
      if (audioContext.state === 'running') {
          audioContext.suspend();
          setIsPlaying(false);
      }
  };

  const resume = () => {
      if (audioContext.state === 'suspended') {
          audioContext.resume();
          setIsPlaying(true);
      }
  };

  const playNextVerse = () => {
      if (currentSurah && currentVerse) {
          const next = getRelativeVerse(currentSurah.id, currentVerse.id, 1);
          if (next) playVerse(next.surah, next.verse);
      }
  };

  const playPrevVerse = () => {
      if (currentSurah && currentVerse) {
          const loc = getVerseLocation(currentSurah.id, currentVerse.id);
          if (loc) {
              if (loc.verseIndex > 0) {
                  playVerse(loc.surah, loc.surah.verses[loc.verseIndex - 1]);
              } else if (loc.surahIndex > 0) {
                  const prevSurah = allSurahs[loc.surahIndex - 1];
                  playVerse(prevSurah, prevSurah.verses[prevSurah.verses.length - 1]);
              }
          }
      }
  };

  const skipToNextSurah = () => {
      if (currentSurah) {
          const loc = getVerseLocation(currentSurah.id, currentSurah.verses[0].id);
          if (loc && loc.surahIndex + 1 < allSurahs.length) {
              playSurah(allSurahs[loc.surahIndex + 1]);
          }
      }
  };

  const skipToPrevSurah = () => {
      if (currentSurah) {
          const loc = getVerseLocation(currentSurah.id, currentSurah.verses[0].id);
          if (loc && loc.surahIndex > 0) {
              playSurah(allSurahs[loc.surahIndex - 1]);
          }
      }
  };
  
  const getCurrentTime = () => audioContext.currentTime;

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (activeSource.current) {
              try { activeSource.current.stop(); } catch(e){}
          }
      };
  }, []);

  return { 
      isPlaying, 
      isLoading, 
      currentSurah, 
      currentVerse,
      playbackRate,
      audioTiming, // Export timing
      getCurrentTime,
      setPlaybackRate,
      playSurah, 
      pause, 
      resume, 
      playNextVerse, 
      playPrevVerse, 
      skipToNextSurah, 
      skipToPrevSurah, 
      stop 
  };
};
