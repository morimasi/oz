
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, Loader2, Sparkles, Moon, Lock } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(false); // Toggle between Login/Register
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setIsSubmitting(true);
    await login(email, name);
    // Loading state is handled by AuthContext, component will unmount when user is set
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary-50 to-transparent -z-10"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-40"></div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo / Header */}
        <div className="text-center mb-10">
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
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                        <>
                            {isLogin ? 'Giriş Yap' : 'Yolculuğa Başla'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

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
