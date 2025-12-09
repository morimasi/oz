import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, name: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'facebook' | 'x' | 'instagram') => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking session from "Cloud" (localStorage in this mock)
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      const savedUser = localStorage.getItem('saas_user_session');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const createSession = (newUser: UserProfile) => {
      // Check if we have existing data to migrate (for UX)
      const oldProfile = localStorage.getItem('user_profile');
      if (oldProfile) {
          try {
            const parsed = JSON.parse(oldProfile);
            // Only migrate if names are generic
            if(newUser.name.includes('Kullanıcısı')) {
                 newUser.name = parsed.name || newUser.name;
            }
            newUser.joinDate = parsed.joinDate || newUser.joinDate;
          } catch(e) {}
      }

      setUser(newUser);
      localStorage.setItem('saas_user_session', JSON.stringify(newUser));
      setIsLoading(false);
  };

  const login = async (email: string, name: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email,
      name,
      joinDate: new Date().toISOString(),
      subscriptionTier: 'FREE',
      stats: { streak: 0, totalPrayers: 0, xp: 0 }
    };
    
    createSession(newUser);
  };

  const loginWithSocial = async (provider: 'google' | 'facebook' | 'x' | 'instagram') => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate OAuth popup/redirect delay

      const providerData = {
          google: { name: 'Google Kullanıcısı', email: 'user@gmail.com' },
          facebook: { name: 'Facebook Kullanıcısı', email: 'user@facebook.com' },
          x: { name: 'X Kullanıcısı', email: 'user@x.com' },
          instagram: { name: 'Instagram Kullanıcısı', email: 'user@instagram.com' }
      };

      const data = providerData[provider];

      const newUser: UserProfile = {
        id: `user_${provider}_${Date.now()}`,
        email: data.email,
        name: data.name,
        joinDate: new Date().toISOString(),
        subscriptionTier: 'FREE',
        stats: { streak: 0, totalPrayers: 0, xp: 0 }
      };

      createSession(newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saas_user_session');
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('saas_user_session', JSON.stringify(updatedUser));
  };

  const upgradeToPremium = () => {
      if(!user) return;
      const updatedUser: UserProfile = { ...user, subscriptionTier: 'PREMIUM' };
      setUser(updatedUser);
      localStorage.setItem('saas_user_session', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, logout, updateUser, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};