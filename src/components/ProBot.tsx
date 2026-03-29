// ============================================================
// ProBot.tsx — UI Component Only (no business logic)
// All logic is in src/hooks/useProBot.ts
// ============================================================

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Send, X, Home, User, Loader2, RefreshCw, Trash2, ChevronRight, ChevronLeft, Bell } from 'lucide-react';
import { useProBot, Message } from '../hooks/useProBot';
import { useListingNotifications } from '../hooks/useListingNotifications';
import { Listing } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

export interface ProBotProps {
  onNavigate?: (page: string, params?: any) => void;
}

function RoomCard({ room, onNavigate }: { room: Listing, onNavigate?: (page: string, params?: any) => void }) {
  return (
    <div 
      onClick={() => onNavigate?.('listing-detail', { id: room.id })}
      className="flex-shrink-0 w-44 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 cursor-pointer group"
    >
      <div className="relative h-28 bg-gray-100 overflow-hidden">
        <img
          src={room.image_url || room.images?.[0] || `https://picsum.photos/seed/${room.id}/400/300`}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${room.id}/400/300`; }}
        />
        {room.type && (
          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full z-10">
            {room.type}
          </span>
        )}
      </div>
      
      <div className="p-2.5">
        <p className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight mb-1.5 group-hover:text-orange-500 transition-colors">
          {room.title}
        </p>
        {(room.street || room.location) && (
          <p className="text-[9px] text-gray-400 truncate mb-2">
            📍 {room.street ? `${room.street}, ` : ''}{room.location}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[12px] font-bold text-orange-500">
            {(room.price / 1_000_000).toFixed(1)}tr
            <span className="text-[9px] font-normal text-gray-400">/tháng</span>
          </span>
          {room.area && (
            <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              {room.area}m²
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 mr-auto">
      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
        <Home className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

function RetryBanner({ seconds }: { seconds: number }) {
  return (
    <div className="mx-4 mb-3 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2">
      <Loader2 className="w-4 h-4 text-orange-400 animate-spin flex-shrink-0" />
      <p className="text-xs text-orange-600 font-medium">
        AI đang bận — tự động thử lại sau <strong>{seconds}s</strong>...
      </p>
    </div>
  );
}
function ChatMessage({ msg, onNavigate }: { msg: Message, onNavigate?: (page: string, params?: any) => void }) {
  const isUser = msg.role === 'user';
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const isLong = !isUser && msg.text.length > 400; // Text dài hơn 400 ký tự sẽ bị collapse

  const handlePrevRoom = () => {
    if (!msg.rooms) return;
    setCurrentRoomIndex((prev) => (prev > 0 ? prev - 1 : msg.rooms!.length - 1));
  };
  
  const handleNextRoom = () => {
    if (!msg.rooms) return;
    setCurrentRoomIndex((prev) => (prev < msg.rooms!.length - 1 ? prev + 1 : 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse ml-auto max-w-[85%]' : 'mr-auto max-w-[92%]'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? 'bg-gray-200' : 'bg-orange-500'}`}>
        {isUser ? <User className="w-4 h-4 text-gray-500" /> : <Home className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={`rounded-2xl text-[13px] leading-relaxed shadow-sm min-w-0 ${
        isUser
          ? 'bg-orange-500 text-white px-4 py-2.5 rounded-tr-none'
          : `bg-white border px-4 py-3 rounded-tl-none ${msg.isError ? 'border-red-100 bg-red-50/40' : 'border-gray-100'}`
      }`}>
        {isUser ? (
          <p>{msg.text}</p>
        ) : (
          <div className="flex flex-col">
            <div className={`prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900 prose-headings:text-gray-900 relative transition-all duration-300 ${isLong && !isExpanded ? 'max-h-[220px] overflow-hidden' : ''}`}>
              <Markdown>{msg.text}</Markdown>
              {isLong && !isExpanded && (
                <div className={`absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t ${msg.isError ? 'from-red-50' : 'from-white'} to-transparent pointer-events-none`} />
              )}
            </div>
            
            {isLong && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-orange-500 font-semibold text-[11px] hover:text-orange-600 transition-colors uppercase tracking-wider flex justify-center py-1.5 border-t border-gray-100/50"
              >
                {isExpanded ? '↑ Thu gọn' : '↓ Xem đầy đủ'}
              </button>
            )}
          </div>
        )}

        {/* Room cards Carousel (Single Item) */}
        {msg.rooms && msg.rooms.length > 0 && (
          <div className="mt-4 flex flex-col items-center w-full">
            <div className="flex items-center justify-center gap-3 w-full">
              {/* Nút lùi */}
              {msg.rooms.length > 1 && (
                <button 
                  onClick={handlePrevRoom}
                  className="w-7 h-7 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Card Phòng ở giữa */}
              <div className="flex justify-center">
                <RoomCard key={msg.rooms[currentRoomIndex].id} room={msg.rooms[currentRoomIndex]} onNavigate={onNavigate} />
              </div>

              {/* Nút tới */}
              {msg.rooms.length > 1 && (
                <button 
                  onClick={handleNextRoom}
                  className="w-7 h-7 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chỉ báo số trang */}
            {msg.rooms.length > 1 && (
              <p className="text-[10px] text-gray-400 text-center mt-2.5 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Phòng {currentRoomIndex + 1} / {msg.rooms.length}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[9px] mt-1.5 ${isUser ? 'text-orange-200 text-right' : 'text-gray-300'}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// QUICK SUGGESTION CHIPS
// ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Tìm phòng 3 triệu Hải Châu',
  'Hải Châu nên ở đâu?',
  'Tìm studio dưới 5 triệu',
  'Gò Vấp có phòng nào phù hợp sinh viên?',
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ProBot({ onNavigate }: ProBotProps) {
  const { messages, isLoading, retryCountdown, handleSend, clearChat } = useProBot();
  const { notifications, unreadCount, markAllRead, dismissNotification } = useListingNotifications();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lấy notification mới nhất chưa đọc để hiện toast khi đóng chat
  const latestNotification = notifications.find(n => !n.read);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (unreadCount > 0) markAllRead();
    }
  }, [isOpen, unreadCount, markAllRead]);

  const submit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    handleSend(text);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        id="probot-toggle"
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all duration-200 z-50 group"
        aria-label="Mở ProBot"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.span>
            : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Home className="w-7 h-7" />
              </motion.span>
          }
        </AnimatePresence>

        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg z-10 border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}

        {!isOpen && (
          <span className="absolute right-16 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Chat với ProBot tìm phòng 🏠
          </span>
        )}
      </button>

      {/* ── Toast Notification (Khi chat đóng) ── */}
      <AnimatePresence>
        {!isOpen && latestNotification && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-orange-100 p-3 z-40 cursor-pointer overflow-hidden group hover:border-orange-300 transition-colors"
            onClick={() => {
              markAllRead();
              setIsOpen(false);
              onNavigate?.('listing-detail', { id: latestNotification.listing.id });
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
            <button
              onClick={(e) => { e.stopPropagation(); dismissNotification(latestNotification.id); }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-1 leading-tight">Phòng mới phù hợp!</p>
                <div className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed">
                  <Markdown>{latestNotification.message}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Widget ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 w-[400px] h-[620px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-gray-900">ProBot</h2>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Online · Tìm phòng & Tư vấn</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  title="Xóa lịch sử"
                  className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50/40 scrollbar-hide flex flex-col"
            >
              {/* Tin nhắn thông báo phòng mới */}
              {notifications.map(notif => (
                <ChatMessage 
                  key={notif.id} 
                  msg={{
                    id: notif.id,
                    role: 'bot',
                    text: `🔔 **Tin vui!**\n\n${notif.message}`,
                    timestamp: notif.receivedAt,
                    rooms: [notif.listing]
                  }}
                  onNavigate={onNavigate}
                />
              ))}

              {/* Lịch sử chat thông thường */}
              {messages.map(msg => (
                <ChatMessage key={msg.id} msg={msg} onNavigate={onNavigate} />
              ))}

              {/* Loading indicator */}
              {isLoading && <TypingIndicator />}
            </div>

            {/* Retry Banner */}
            {retryCountdown > 0 && <RetryBanner seconds={retryCountdown} />}

            {/* Suggestion Chips */}
            {showSuggestions && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wider">Thử hỏi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-[11px] text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors font-medium flex items-center gap-1"
                    >
                      {s}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition-all">
                <input
                  ref={inputRef}
                  id="probot-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Tìm phòng hoặc hỏi tư vấn..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  id="probot-send"
                  onClick={submit}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 active:scale-90 transition-all flex-shrink-0"
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                ProBot có thể mắc lỗi. Kiểm tra lại thông tin quan trọng nhé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
