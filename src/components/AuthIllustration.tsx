import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Users, ShieldAlert } from 'lucide-react';

export const AuthIllustration = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => {
  return (
    <div className="hidden md:flex md:w-1/2 relative overflow-hidden flat-illustration border-l border-orange-100 items-center justify-center p-12">
      <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-yellow-100/60 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-green-100/60 rounded-full blur-3xl"></div>
      
      <div className="h-full w-full flex flex-col items-center justify-center p-16 relative">
        <div className="w-full max-w-lg space-y-12 z-10">
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-xl border-2 border-orange-100"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="text-primary w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2 font-display">Cộng đồng vui vẻ</h3>
              <p className="text-sm text-slate-500">Gặp gỡ những người bạn cùng phòng tuyệt vời nhất.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20, rotate: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-2xl shadow-xl translate-y-8 border-2 border-green-100"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="text-secondary w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2 font-display">An tâm tuyệt đối</h3>
              <p className="text-sm text-slate-500">Thông tin minh bạch, bảo mật và luôn được xác thực.</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-8 rounded-2xl shadow-xl border-2 border-yellow-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full"></div>
            <div className="relative flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
                  <Icon className="text-accent w-8 h-8" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3 font-display">{title}</h2>
                <p className="text-slate-600 text-lg leading-relaxed">{description}</p>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-200"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-green-200"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-yellow-200"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">+1k</div>
              </div>
              <span className="text-sm font-bold text-slate-500 self-center">Hơn 1000+ người đã tham gia cộng đồng</span>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-12 h-12 bg-primary rounded-lg rotate-12 opacity-20"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-secondary rounded-full opacity-20"></div>
        <div className="absolute top-1/2 right-10 w-8 h-8 bg-accent rotate-45 opacity-20"></div>
      </div>
    </div>
  );
};
