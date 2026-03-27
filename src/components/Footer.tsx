import React from 'react';
import { Home, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto pt-16 pb-8 w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-primary">
                <Home className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-primary font-display">Trọ Pro</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Kênh thông tin tìm kiếm phòng trọ, căn hộ, nhà nguyên căn hàng đầu Việt Nam. Giúp bạn tìm được không gian sống lý tưởng một cách nhanh chóng và an toàn.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-6 font-display">Liên kết nhanh</h3>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="#">Về chúng tôi</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Hướng dẫn đăng tin</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Bảng giá dịch vụ</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Liên hệ hỗ trợ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-6 font-display">Hỗ trợ khách hàng</h3>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a className="hover:text-primary transition-colors" href="#">Quy định đăng tin</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Giải quyết khiếu nại</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-6 font-display">Thông tin liên hệ</h3>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary w-5 h-5 flex-shrink-0" />
                <span>100 Âu Cơ, Thành Phố Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary w-5 h-5 flex-shrink-0" />
                <span>0362796857</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary w-5 h-5 flex-shrink-0" />
                <span>TroPro@gmail.com</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm" href="https://www.facebook.com/nguyen.trung.ky.682419">
                <Facebook className="w-4 h-4" />
              </a>
              <a className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm" href="https://www.facebook.com/nguyen.trung.ky.682419">
                <Instagram className="w-4 h-4" />
              </a>
              <a className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm" href="https://www.facebook.com/nguyen.trung.ky.682419">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-8 text-center text-slate-500 text-xs">
          <p>© 2026 TroProVN.</p>
        </div>
      </div>
    </footer>
  );
};
