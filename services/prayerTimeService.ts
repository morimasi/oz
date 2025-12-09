import { PrayerTimes } from '../types';

// Diyanet İşleri Başkanlığı'nın hesaplama metodunu kullanır (method=3)
const API_URL = 'https://api.aladhan.com/v1/timings';
const CITY_API_URL = 'https://api.aladhan.com/v1/timingsByCity';

export const getPrayerTimes = async (latitude: number, longitude: number, date: string): Promise<PrayerTimes | null> => {
  const [year, month, day] = date.split('-');
  const storageKey = `prayerTimes-${date}-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  
  // Check cache first
  const cachedData = localStorage.getItem(storageKey);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Failed to parse cached prayer times", e);
      localStorage.removeItem(storageKey);
    }
  }

  // Fetch from API
  try {
    const response = await fetch(`${API_URL}/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=3`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();

    if (data.code === 200 && data.data.timings) {
      const timings: PrayerTimes = {
        Fajr: data.data.timings.Fajr,
        Sunrise: data.data.timings.Sunrise,
        Dhuhr: data.data.timings.Dhuhr,
        Asr: data.data.timings.Asr,
        Maghrib: data.data.timings.Maghrib,
        Isha: data.data.timings.Isha,
      };
      
      // Save to cache
      localStorage.setItem(storageKey, JSON.stringify(timings));
      return timings;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch prayer times:", error);
    return null;
  }
};

export const getPrayerTimesByCity = async (city: string, country: string, date: string): Promise<PrayerTimes | null> => {
  const [year, month, day] = date.split('-');
  const storageKey = `prayerTimes-${date}-${city}-${country}`;

  // Check cache
  const cachedData = localStorage.getItem(storageKey);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      localStorage.removeItem(storageKey);
    }
  }

  try {
    const response = await fetch(`${CITY_API_URL}/${day}-${month}-${year}?city=${city}&country=${country}&method=3`);
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();

    if (data.code === 200 && data.data.timings) {
      const timings: PrayerTimes = {
        Fajr: data.data.timings.Fajr,
        Sunrise: data.data.timings.Sunrise,
        Dhuhr: data.data.timings.Dhuhr,
        Asr: data.data.timings.Asr,
        Maghrib: data.data.timings.Maghrib,
        Isha: data.data.timings.Isha,
      };
      localStorage.setItem(storageKey, JSON.stringify(timings));
      return timings;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch city prayer times", error);
    return null;
  }
};