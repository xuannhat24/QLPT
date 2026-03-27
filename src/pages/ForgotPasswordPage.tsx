import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Mail, 
  ArrowLeft,
  ShieldAlert,
  Send
} from 'lucide-react';
import { AuthIllustration } from '../components/AuthIllustration';
import { supabase } from '../lib/supabase';

export const ForgotPasswordPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi gửi yêu cầu');
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
          <div className="mb-10 text-center">
            <h1 className="text-slate-900 text-3xl font-bold leading-tight mb-3 font-display">Quên mật khẩu?</h1>
            <p className="text-slate-500 text-lg font-medium">Nhập email của bạn để nhận liên kết khôi phục mật khẩu.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm font-medium">
              Yêu cầu đã được gửi! Vui lòng kiểm tra email của bạn.
            </div>
          )}

          <form className="space-y-6" onSubmit={handleResetPassword}>
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

            <button 
              disabled={loading || success}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</span>
              {!loading && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="text-center">
              <button 
                type="button"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-2 text-secondary font-bold hover:underline transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Quay lại Đăng nhập
              </button>
            </div>
          </form>
        </motion.div>

        <div className="absolute bottom-8 text-slate-400 text-sm w-full text-center font-medium">
          © 2024 Trọ Pro • Hệ thống Quản lý Phòng trọ Thông minh
        </div>
      </div>

      <AuthIllustration 
        title="Bảo mật là ưu tiên!"
        description="Chúng tôi giúp bạn lấy lại quyền truy cập tài khoản một cách an toàn và nhanh chóng nhất."
        icon={ShieldAlert}
      />
    </div>
  );
};
