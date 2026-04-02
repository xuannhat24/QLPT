import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ManagePage } from './pages/ManagePage';
import { StorePage } from './pages/StorePage';
import { SearchPage } from './pages/SearchPage';
import { ContactPage } from './pages/ContactPage';
import { TenantPage } from './pages/TenantPage';
import { AdminPage } from './pages/AdminPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyStorePage } from './pages/MyStorePage';
import { useToast } from './context/ToastContext';
import ProBot from './components/ProBot';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

type Page = 'home' | 'login' | 'register' | 'forgot-password' | 'manage' | 'store' | 'search' | 'contact' | 'tenant' | 'admin' | 'listing-detail' | 'payment-result' | 'store-detail' | 'checkout' | 'my-store';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Hỗ trợ redirect trực tiếp cho return URL của VNPAY
    const path = window.location.pathname.replace('/', '');
    if (path === 'payment-result') return 'payment-result';
    return 'home';
  });
  const [session, setSession] = useState<Session | null>(null);
  const [searchParams, setSearchParams] = useState<any>(null);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRole = (userId?: string) => {
      if (userId) {
        supabase.from('profiles').select('role').eq('id', userId).single()
          .then(({ data }) => {
             if (data) setDbRole(data.role);
          });
      } else {
        setDbRole(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchRole(session?.user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentRole = dbRole || session?.user?.user_metadata?.role;

  // Protect Routes
  useEffect(() => {
    // Chỉ kiểm tra khi đã load xong role & user
    if (!session?.user) return; 
    
    if (currentPage === 'admin' && currentRole !== 'admin') {
      showToast('Quyền truy cập bị từ chối! Trang này chỉ dành cho Quản trị viên.', 'error');
      setCurrentPage('home');
    }
    if (currentPage === 'manage' && currentRole !== 'landlord' && currentRole !== 'admin') {
      showToast('Bạn không có quyền truy cập trang quản lý này.', 'warning');
      setCurrentPage('home');
    }
    if (currentPage === 'tenant' && currentRole !== 'tenant' && currentRole !== 'admin') {
      showToast('Trang này chỉ dành cho Người thuê phòng.', 'warning');
      setCurrentPage('home');
    }
  }, [currentPage, currentRole, session]);

  const handleNavigate = (page: string, params?: any) => {
    setSearchParams(params || null);
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('home');
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
           key={currentPage}
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -10 }}
           transition={{ duration: 0.3 }}
           className="min-h-screen"
        >
          {currentPage === 'home' && (
            <HomePage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
            />
          )}
          {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
          {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} />}
          {currentPage === 'forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
          {currentPage === 'store' && (
            <StorePage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
            />
          )}
          {currentPage === 'manage' && (
            <ManagePage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
              initialParams={searchParams}
            />
          )}
          {currentPage === 'search' && (
            <SearchPage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
              initialParams={searchParams}
            />
          )}
          {currentPage === 'contact' && (
            <ContactPage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
            />
          )}
          {currentPage === 'tenant' && (
            <TenantPage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
              initialParams={searchParams}
            />
          )}
          {currentPage === 'admin' && (
            <AdminPage 
              onNavigate={handleNavigate} 
              user={session?.user || null} 
              onLogout={handleLogout} 
            />
          )}
          {currentPage === 'listing-detail' && (
            <ListingDetailPage 
              onNavigate={handleNavigate} 
              user={session?.user || null}
              onLogout={handleLogout}
              params={searchParams}
            />
          )}
          {currentPage === 'payment-result' && (
            <PaymentResultPage 
              onNavigate={handleNavigate} 
              params={searchParams}
            />
          )}
          {currentPage === 'store-detail' && (
            <StoreDetailPage 
              onNavigate={handleNavigate} 
              user={session?.user || null}
              onLogout={handleLogout}
              params={searchParams}
            />
          )}
          {currentPage === 'checkout' && (
            <CheckoutPage 
              onNavigate={handleNavigate} 
              user={session?.user || null}
              onLogout={handleLogout}
              params={searchParams}
            />
          )}
          {currentPage === 'my-store' && (
            <MyStorePage 
              onNavigate={handleNavigate} 
              user={session?.user || null}
              onLogout={handleLogout}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {/* ProBot chỉ hiện ở những trang không phải cửa hàng, quản lý mua bán và thanh toán */}
      {currentPage !== 'store' && currentPage !== 'store-detail' && currentPage !== 'my-store' && currentPage !== 'checkout' && (
        <ProBot onNavigate={handleNavigate} />
      )}
    </>
  );
}
