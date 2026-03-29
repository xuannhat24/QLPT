// ============================================================
// useListingNotifications.ts
// Lắng nghe listing mới qua Supabase Realtime
// So khớp với nhu cầu người dùng đã lưu → gửi thông báo
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Listing } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface ListingNotification {
  id: string;
  listing: Listing;
  message: string;
  receivedAt: Date;
  read: boolean;
}

export interface SavedPreference {
  id: string;
  user_id?: string;
  session_id: string;
  location?: string;
  street?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  room_type?: string;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION MESSAGE TEMPLATES (không cần Gemini)
// ─────────────────────────────────────────────────────────────

type ListingTemplate = (l: Listing) => string;

const TEMPLATES: ListingTemplate[] = [
  (l) => `🏠 Có phòng mới ở **${l.street || l.location}** chỉ **${(l.price / 1e6).toFixed(1)}tr**/tháng — đúng ý bạn rồi!`,
  (l) => `✨ ProBot phát hiện phòng phù hợp tại **${l.location}**! Giá **${(l.price / 1e6).toFixed(1)}tr**, ${l.area ? l.area + 'm²' : ''} — xem ngay nhé!`,
  (l) => `🎉 Tin mừng! Có phòng mới ở **${l.street || l.location}** vừa đăng trong tầm giá của bạn!`,
  (l) => `👀 **${l.type || 'Phòng trọ'}** ${l.area ? l.area + 'm²' : ''} tại **${l.location}** giá **${(l.price / 1e6).toFixed(1)}tr**/tháng — còn trống đó!`,
  (l) => `🌟 ProBot tìm thấy một phòng xịn tại **${l.street || l.location}** phù hợp với nhu cầu của bạn!`,
];

function generateMessage(listing: Listing): string {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  return template(listing);
}

// ─────────────────────────────────────────────────────────────
// MATCH LOGIC
// ─────────────────────────────────────────────────────────────

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function matchesPreferences(listing: Listing, prefs: SavedPreference): boolean {
  console.log('[Matches] Checking listing:', listing.title, 'against prefs:', prefs);

  // Kiểm tra listing có hợp lệ không
  if (!listing.is_active) { console.log('[Matches] Failed: not active'); return false; }
  if (listing.approval_status && listing.approval_status !== 'approved') { console.log('[Matches] Failed: not approved'); return false; }

  // Kiểm tra giá
  if (prefs.max_price && listing.price > prefs.max_price) { console.log('[Matches] Failed: price too high'); return false; }
  if (prefs.min_price && listing.price < prefs.min_price) { console.log('[Matches] Failed: price too low'); return false; }

  // Kiểm tra khu vực (fuzzy)
  if (prefs.location && listing.location) {
    const loc = normalizeStr(listing.location);
    const pref = normalizeStr(prefs.location);
    if (!loc.includes(pref) && !pref.includes(loc)) { console.log('[Matches] Failed: location mismatch', loc, pref); return false; }
  }

  // Kiểm tra đường
  if (prefs.street && listing.street) {
    const st = normalizeStr(listing.street);
    const pref = normalizeStr(prefs.street);
    if (!st.includes(pref) && !pref.includes(st)) { console.log('[Matches] Failed: street mismatch'); return false; }
  }

  // Kiểm tra diện tích
  if (prefs.min_area && listing.area && listing.area < prefs.min_area) { console.log('[Matches] Failed: area too small'); return false; }

  // Kiểm tra loại phòng
  if (prefs.room_type && listing.type) {
    const type = normalizeStr(listing.type);
    const pref = normalizeStr(prefs.room_type);
    if (!type.includes(pref) && !pref.includes(type)) { console.log('[Matches] Failed: type mismatch'); return false; }
  }

  console.log('[Matches] SUCCESS!');
  return true;
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useListingNotifications() {
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const [preferences, setPreferences] = useState<SavedPreference | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  // Load preferences của user hiện tại từ DB
  const loadPreferences = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setPreferences(data as SavedPreference);
      console.log('[Notifications] Loaded preferences for', user.email);
    }
  }, []);

  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Setup Supabase Realtime listener
  useEffect(() => {
    loadPreferences();

    const handleUpdate = () => {
      console.log('[Notifications] Preferences updated event received, reloading...');
      loadPreferences();
    };
    window.addEventListener('probot_preferences_updated', handleUpdate);

    const channel = supabase
      .channel('probot_new_listings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings', filter: 'approval_status=eq.approved' },
        (payload) => {
          const listing = payload.new as Listing;
          const currentPrefs = preferencesRef.current;
          console.log('[Notifications] New listing detected:', listing.title, currentPrefs);

          if (notifiedIds.current.has(listing.id)) return;
          if (!currentPrefs) return;

          if (matchesPreferences(listing, currentPrefs)) {
            notifiedIds.current.add(listing.id);
            setNotifications(prev => [{
              id: `notif-${Date.now()}`,
              listing,
              message: generateMessage(listing),
              receivedAt: new Date(),
              read: false,
            }, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Realtime status:', status);
      });

    return () => {
      window.removeEventListener('probot_preferences_updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [loadPreferences]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    preferences,
    loadPreferences,
    markAllRead,
    dismissNotification,
    clearAll,
  };
}
