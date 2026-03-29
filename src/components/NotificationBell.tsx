import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Wrench, FileText, DollarSign, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: string;
  sender_id: string | null;
  receiver_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell = ({ user, onNavigate }: { user: User, onNavigate: (page: string, params?: any) => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user.id]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.is_read) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
  };

  const handleClickNotification = (notif: Notification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    
    // Handle routing logic based on action_url or type
    if (notif.action_url) {
      // Parse action_url like 'tenant?tab=overview' or 'manage?tab=contracts'
      const [page, search] = notif.action_url.split('?');
      if (page) {
        const params: any = {};
        if (search) {
          search.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[key] = value;
          });
        }
        onNavigate(page as any, params);
      }
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'system_alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'contract_invite': return <FileText className="w-5 h-5 text-primary" />;
      case 'contract_signed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'contract_rejected': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'invoice_alert': return <DollarSign className="w-5 h-5 text-orange-500" />;
      case 'maintenance_report': return <Wrench className="w-5 h-5 text-amber-600" />;
      case 'profile_update_request': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch(type) {
      case 'system_alert': return 'bg-red-50';
      case 'contract_invite': return 'bg-orange-50';
      case 'contract_signed': return 'bg-green-50';
      case 'contract_rejected': return 'bg-red-50';
      case 'invoice_alert': return 'bg-amber-50';
      case 'maintenance_report': return 'bg-yellow-50';
      case 'profile_update_request': return 'bg-amber-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_0_2px_#ffffff] animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 font-display">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                    <Bell className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Bạn chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleClickNotification(notif)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-4 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1 ${getBgColor(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm tracking-tight line-clamp-1 ${!notif.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className={`text-xs line-clamp-2 leading-relaxed mb-2 ${!notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">Xem tất cả thông báo</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
