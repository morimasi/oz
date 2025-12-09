import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, Loader2, Sparkles, Moon, Lock } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const { login, loginWithSocial } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(false); // Toggle between Login/Register
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setIsSubmitting(true);
    await login(email, name);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'x' | 'instagram') => {
      setSocialLoading(provider);
      await loginWithSocial(provider);
      // Component unmounts on success
  };

  // SVG Icons for Brands
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.73 1.379-2.73 2.83v1.141h4.188l-.571 3.667h-3.617v7.98C19.61 22.202 23 17.552 23 12c0-6.075-4.925-11-11-11S1 5.925 1 12c0 5.552 3.39 10.202 8.101 11.691z"/>
    </svg>
  );

  const XIcon = () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const InstagramIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary-50 to-transparent -z-10"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-40"></div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary-200 mx-auto mb-6 transform rotate-3">
             <Moon size={40} className="fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Öz'e Yolculuk</h1>
          <p className="text-gray-500">Ruhunuzu besleyen, manevi rehberiniz.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex justify-center mb-6 bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                >
                    Kayıt Ol
                </button>
                <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                >
                    Giriş Yap
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">İsim</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adınız"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">E-Posta</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting || socialLoading !== null}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                        <>
                            {isLogin ? 'Giriş Yap' : 'Yolculuğa Başla'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400 text-xs font-medium">veya şununla devam et</span>
                </div>
            </div>

            {/* Social Login Grid */}
            <div className="space-y-3">
                <button 
                    onClick={() => handleSocialLogin('google')}
                    disabled={socialLoading !== null}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                    {socialLoading === 'google' ? <Loader2 className="animate-spin" size={20}/> : <GoogleIcon />}
                    <span>Google ile Giriş Yap</span>
                </button>

                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={socialLoading !== null}
                        className="flex items-center justify-center py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166fe5] transition-all active:scale-[0.98]"
                    >
                        {socialLoading === 'facebook' ? <Loader2 className="animate-spin text-white" size={20}/> : <FacebookIcon />}
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('x')}
                        disabled={socialLoading !== null}
                        className="flex items-center justify-center py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all active:scale-[0.98]"
                    >
                        {socialLoading === 'x' ? <Loader2 className="animate-spin text-white" size={20}/> : <XIcon />}
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('instagram')}
                        disabled={socialLoading !== null}
                        className="flex items-center justify-center py-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
                    >
                        {socialLoading === 'instagram' ? <Loader2 className="animate-spin text-white" size={20}/> : <InstagramIcon />}
                    </button>
                </div>
            </div>

            <div className="mt-6 text-center">
                 <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Lock size={12}/> Verileriniz güvende ve şifrelidir.
                 </p>
            </div>
        </div>
        
        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2"><Sparkles size={18}/></div>
                <span className="text-[10px] font-bold text-gray-500">Yapay Zeka Rehber</span>
            </div>
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mb-2"><Moon size={18}/></div>
                <span className="text-[10px] font-bold text-gray-500">İbadet Takibi</span>
            </div>
            <div className="flex flex-col items-center">
                 <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-2"><Lock size={18}/></div>
                <span className="text-[10px] font-bold text-gray-500">Kişisel Günlük</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;