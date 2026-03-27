import React from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  ExternalLink,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ContactPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
}

export const ContactPage = ({ onNavigate, user, onLogout }: ContactPageProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="contact" />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 space-y-16 flex-1">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 font-display"
          >
            Liên hệ với chúng tôi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-slate-500 text-lg leading-relaxed font-medium"
          >
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn tìm kiếm căn trọ ưng ý nhất. Hãy để lại lời nhắn cho Trọ Pro nhé!
          </motion.p>
        </section>

        {/* Contact Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-all group cursor-pointer hover:border-primary/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:-translate-y-1 transition-transform">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 font-display">Địa chỉ</h3>
              <p className="text-slate-500 font-medium">123 Đường ABC, Quận 1, TP.HCM</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-all group cursor-pointer hover:border-primary/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:-translate-y-1 transition-transform">
              <Phone className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 font-display">Điện thoại</h3>
              <p className="text-slate-500 font-medium whitespace-pre-line">
                1900 1234 (Tổng đài)
                0901 234 567 (Hotline)
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-all group cursor-pointer hover:border-primary/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:-translate-y-1 transition-transform">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 font-display">Email</h3>
              <p className="text-slate-500 font-medium">contact@tropro.vn</p>
            </div>
          </motion.div>
        </section>

        {/* Contact Form & Map Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Send Message Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-primary/5 border border-slate-100"
          >
            <h2 className="text-2xl font-bold mb-8 text-slate-900 font-display">Gửi tin nhắn cho chúng tôi</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Họ tên <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700" 
                    placeholder="Nguyễn Văn A" 
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700" 
                    placeholder="example@gmail.com" 
                    type="email"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                  <input 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700" 
                    placeholder="0901234567" 
                    type="tel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Chủ đề</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer">
                      <option>Hỗ trợ tìm trọ</option>
                      <option>Báo cáo sự cố</option>
                      <option>Thắc mắc thanh toán</option>
                      <option>Góp ý dịch vụ</option>
                      <option>Hợp tác kinh doanh</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nội dung tin nhắn <span className="text-red-500">*</span></label>
                <textarea 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 resize-none" 
                  placeholder="Nhập tin nhắn của bạn tại đây..." 
                  rows={5}
                  required
                ></textarea>
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 uppercase tracking-widest" 
                type="submit"
              >
                <Send className="w-5 h-5" />
                Gửi tin nhắn
              </button>
            </form>
          </motion.div>

          {/* Map Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="h-full min-h-[500px] lg:min-h-full rounded-3xl overflow-hidden shadow-md border border-slate-200 relative group"
          >
            <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center -z-10">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            {/* Fake Map Image - In real app, replace with Google Maps iframe */}
            <img 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
              alt="Map Location"
              referrerPolicy="no-referrer"
            />
            {/* Map Pin Hover Overlay */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>

            <div className="absolute bottom-6 left-6 right-6 sm:right-auto bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50 sm:max-w-xs group-hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 font-display">Văn phòng Trọ Pro</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
                    Tầng 4, Tòa nhà Beta, 123 Đường ABC, Quận 1, TP.HCM
                  </p>
                  <button className="text-primary text-sm font-bold mt-3 flex items-center gap-1.5 hover:text-primary-hover hover:gap-2 transition-all">
                    Chỉ đường bản đồ <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
