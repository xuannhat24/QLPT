import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  Home as HomeIcon, 
  UserCircle,
  Smartphone
} from 'lucide-react';
import { AuthIllustration } from '../components/AuthIllustration';
import { supabase } from '../lib/supabase';

export const RegisterPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [role, setRole] = useState<'landlord' | 'tenant'>('landlord');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      setSuccess(true);
      setTimeout(() => onNavigate('login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col p-8 md:p-16 lg:p-24 bg-white overflow-y-auto">
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-primary mb-8 cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl">
            <Home className="text-primary w-6 h-6" />
          </div>
          <h2 className="text-slate-900 text-2xl font-bold tracking-tight font-display">Trọ Pro</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(255,159,67,0.12)] p-8 md:p-10 border border-orange-50 ring-4 ring-orange-50/50"
        >
          <div className="mb-8">
            <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight mb-2 font-display">Tạo tài khoản mới</h1>
            <p className="text-slate-500 text-base font-normal">Vui lòng điền thông tin để bắt đầu quản lý phòng trọ của bạn</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm font-medium">
              Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-semibold">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input 
                  className="flex w-full rounded-lg border border-slate-300 bg-white h-12 pl-10 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="Nhập họ và tên của bạn" 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                  <input 
                    className="flex w-full rounded-lg border border-slate-300 bg-white h-12 pl-10 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="example@gmail.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                  <input 
                    className="flex w-full rounded-lg border border-slate-300 bg-white h-12 pl-10 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    placeholder="0901 234 567" 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-semibold">Vai trò của bạn</label>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setRole('landlord')}
                  className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${role === 'landlord' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                >
                  <HomeIcon className="mb-1 w-5 h-5" />
                  <span className="text-sm font-medium">Chủ trọ</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('tenant')}
                  className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${role === 'tenant' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                >
                  <UserCircle className="mb-1 w-5 h-5" />
                  <span className="text-sm font-medium">Người thuê</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-semibold">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input 
                  className="flex w-full rounded-lg border border-slate-300 bg-white h-12 pl-10 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-700 text-sm font-semibold">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input 
                  className="flex w-full rounded-lg border border-slate-300 bg-white h-12 pl-10 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="••••••••" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <button 
                disabled={loading || success}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Đang xử lý...' : 'Đăng ký ngay'}</span>
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-slate-500 text-sm">
                Đã có tài khoản? 
                <button 
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-secondary font-bold hover:underline ml-1"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        </motion.div>

        <div className="mt-auto pt-8 flex gap-6 text-slate-400 text-xs">
          <a className="hover:text-primary transition-colors" href="#">Điều khoản</a>
          <a className="hover:text-primary transition-colors" href="#">Bảo mật</a>
          <a className="hover:text-primary transition-colors" href="#">Liên hệ</a>
        </div>
      </div>

      <div className="hidden md:flex flex-1 relative flat-illustration border-l border-orange-100 overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-yellow-100/60 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-green-100/60 rounded-full blur-3xl"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center bg-white p-12 rounded-2xl shadow-xl border-2 border-yellow-100 max-w-lg"
        >
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-2xl">
            <Smartphone className="text-accent w-12 h-12" />
          </div>
          <h2 className="text-slate-900 text-4xl font-black mb-6 leading-tight font-display">Bắt đầu hành trình cùng Trọ Pro</h2>
          <p className="text-slate-600 text-lg mx-auto leading-relaxed">
            Đăng ký tài khoản để trải nghiệm dịch vụ quản lý thông minh và chuyên nghiệp nhất hiện nay.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
