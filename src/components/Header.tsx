import React, { ReactNode } from 'react';
import { Home, User, LogOut } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type Page = 'home' | 'login' | 'register' | 'store' | 'manage' | 'contact' | 'search' | 'tenant' | 'admin' | 'listing-detail';

interface HeaderProps {
  user: SupabaseUser | null;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  activePath?: Page;
  children?: ReactNode;
}

export const Header = ({ user, onLogout, onNavigate, activePath, children }: HeaderProps) => {
  const [dbRole, setDbRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data, error }) => {
             if (!error && data) setDbRole(data.role);
          });
      });
    } else {
      setDbRole(null);
    }
  }, [user?.id]);

  const currentRole = dbRole || user?.user_metadata?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-10 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="text-primary">
              <Home className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary font-display">Trọ Pro</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a 
              className={`text-sm ${activePath === 'home' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
            >
              Trang chủ
            </a>
            <a 
              className={`text-sm ${activePath === 'store' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('store'); }}
            >
              Cửa hàng
            </a>
            <a 
              className={`text-sm ${activePath === 'contact' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
            >
              Liên hệ
            </a>
            {currentRole === 'landlord' && (
              <a 
                className={`text-sm ${activePath === 'manage' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigate('manage'); }}
              >
                Quản lý
              </a>
            )}
            {currentRole === 'tenant' && (
              <a 
                className={`text-sm ${activePath === 'tenant' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigate('tenant'); }}
              >
                Phòng của tôi
              </a>
            )}
            {currentRole === 'admin' && (
              <a 
                className={`text-sm ${activePath === 'admin' ? 'font-bold text-primary border-b-2 border-primary pb-1' : 'font-semibold text-slate-600 hover:text-primary transition-colors'}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigate('admin'); }}
              >
                Quản trị
              </a>
            )}
          </nav>
        </div>
        
        {children && (
          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            {children}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('login')} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Đăng nhập</button>
              <button onClick={() => onNavigate('register')} className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-md shadow-orange-100">Đăng ký</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
