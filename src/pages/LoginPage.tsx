import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Smartphone
} from 'lucide-react';
import { AuthIllustration } from '../components/AuthIllustration';
import { supabase } from '../lib/supabase';

export const LoginPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 lg:p-16 justify-center items-center relative z-10 bg-white">
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-primary mb-8 absolute top-8 left-8 md:top-12 md:left-12 cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl">
            <Home className="text-primary w-6 h-6" />
          </div>
          <h2 className="text-slate-900 text-2xl font-bold tracking-tight font-display">Trọ Pro</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(255,159,67,0.12)] p-8 md:p-10 border border-orange-50 ring-4 ring-orange-50/50"
        >
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-slate-900 text-3xl font-bold leading-tight mb-3 font-display">Tổ ấm của bạn đang chờ!</h1>
            <p className="text-slate-500 text-lg font-medium">Kết nối, chia sẻ, và tìm kiếm dễ dàng</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-bold ml-1">Email của bạn</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input 
                  className="flex w-full rounded-xl border-2 border-slate-100 bg-slate-50 h-14 pl-12 pr-4 text-slate-900 focus:border-primary focus:ring-0 placeholder:text-slate-400 transition-all outline-none" 
                  placeholder="name@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 text-sm font-bold ml-1">Mật khẩu</label>
                <button 
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-primary text-sm font-bold hover:text-orange-600 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input 
                  className="flex w-full rounded-xl border-2 border-slate-100 bg-slate-50 h-14 pl-12 pr-12 text-slate-900 focus:border-primary focus:ring-0 placeholder:text-slate-400 transition-all outline-none" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input 
                className="w-5 h-5 rounded-md border-2 border-slate-200 text-primary focus:ring-primary focus:ring-offset-2 cursor-pointer" 
                id="remember" 
                type="checkbox"
              />
              <label className="text-sm font-medium text-slate-600 cursor-pointer select-none" htmlFor="remember">Ghi nhớ đăng nhập</label>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}</span>
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 font-medium">
              Bạn là thành viên mới? 
              <button 
                onClick={() => onNavigate('register')}
                className="text-secondary font-bold hover:underline ml-1"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </motion.div>

        <div className="absolute bottom-8 text-slate-400 text-sm w-full text-center font-medium">
          © 2024 Trọ Pro • Hệ thống Quản lý Phòng trọ Thông minh
        </div>
      </div>

      <AuthIllustration 
        title="Tìm trọ Pro, sống đúng gu!"
        description="Chúng tôi mang đến giải pháp quản lý và tìm kiếm phòng trọ hiện đại, thân thiện nhất cho sinh viên và người đi làm."
        icon={Smartphone}
      />
    </div>
  );
};
