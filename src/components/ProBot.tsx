import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase, Listing, UserPreference } from '../lib/supabase';
import { SYSTEM_INSTRUCTION, savePreferencesTool, INTENT_CLASSIFIER_INSTRUCTION } from '../lib/ProBot';
import { 
  Send, 
  User, 
  MapPin, 
  Bell,
  Loader2,
  X,
  Home
}  from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  rooms?: Listing[];
};

export default function ProBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: 'Xin chào! Tôi là ProBot - trợ lý AI của Trọ Pro. Bạn đang muốn tìm phòng ở khu vực nào và ngân sách khoảng bao nhiêu nhỉ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [preferences, setPreferences] = useState<Partial<UserPreference>>({});
  const [matchingRooms, setMatchingRooms] = useState<Listing[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [lastReadAt, setLastReadAt] = useState<Date>(new Date());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupabaseConfigured] = useState(
    () => !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef<(listing: Listing) => void>(() => {});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasPreferences = !!(preferences.location || preferences.max_price || preferences.min_price);

  const handleNewListingDetected = (listing: Listing) => {
    if (!hasPreferences) return;
    if (pendingListings.length > 0) return;

    const listingTime = new Date(listing.created_at);
    if (listingTime <= lastReadAt) return;

    const matches = (!preferences.max_price || listing.price <= preferences.max_price) &&
                    (!preferences.min_price || listing.price >= preferences.min_price) &&
                    (!preferences.location || listing.location?.toLowerCase().includes(preferences.location.toLowerCase())) &&
                    (!preferences.min_area || (listing.area || 0) >= preferences.min_area);

    if (matches) {
      setPendingListings([listing]);
    }
  };

  useEffect(() => {
    handlerRef.current = handleNewListingDetected;
  }, [handleNewListingDetected]);

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setPreferences(data[0]);
        fetchMatchingRooms(data[0]);
      }
    };
    fetchPrefs();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listings',
        },
        (payload: any) => {
          const newListing = payload.new as Listing;
          if (newListing.is_active) {
            handlerRef.current(newListing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isSupabaseConfigured]);

  const handleReadNotification = (listing: Listing) => {
    setMatchingRooms(prev => [listing, ...prev].slice(0, 5));
    setLastReadAt(new Date());
    setPendingListings([]);
    setIsNotificationOpen(false);
  };

  const fetchMatchingRooms = async (prefs: Partial<UserPreference> & { street?: string }) => {
    if (!isSupabaseConfigured) return [];
    
    setIsRoomsLoading(true);
    setDbError(null);
    try {
      let query = supabase.from('listings').select('*').eq('is_active', true);
      
      if (prefs.street) {
        query = query.or(`street.ilike.%${prefs.street}%,description.ilike.%${prefs.street}%,title.ilike.%${prefs.street}%`);
      } else if (prefs.location) {
        query = query.ilike('location', `%${prefs.location}%`);
      }
      
      if (prefs.max_price) query = query.lte('price', prefs.max_price);
      if (prefs.min_price) query = query.gte('price', prefs.min_price);
      if (prefs.room_type) query = query.ilike('type', `%${prefs.room_type}%`);

      const { data, error } = await query.order('created_at', { ascending: false }).limit(5);
      
      if (error) {
        setDbError(error.message);
        return [];
      } else {
        setMatchingRooms(data || []);
        return data || [];
      }
    } catch (err: any) {
      setDbError(err.message);
      return [];
    } finally {
      setIsRoomsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
      
      // Step 1: Classify Intent
      const classifierResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{ role: 'user', parts: [{ text: userMsg.text }] }],
        config: {
          systemInstruction: INTENT_CLASSIFIER_INSTRUCTION,
          temperature: 0,
        },
      });

      const intent = classifierResponse.text?.trim().toUpperCase() || 'CHAT';
      console.log("Detected Intent:", intent);

      const history = messages
        .slice(-10)
        .filter((m) => {
          if (messages.length > 0 && messages[0].role === 'bot' && m.id === messages[0].id) return false;
          return true;
        })
        .concat(userMsg)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      // Step 2: Execute with specific tool based on intent
      const tools: any[] = [];
      if (intent === 'SAVE') {
        tools.push({ functionDeclarations: [savePreferencesTool] });
      } else if (intent === 'SEARCH') {
        tools.push({ googleSearch: {} });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: history,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools.length > 0 ? tools : undefined,
        },
      });

      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error("No response or candidates from Gemini API");
      }

      // Lấy nội dung text từ các parts, tránh dùng response.text để không bị cảnh báo
      let text = "";
      try {
        const candidate = response.candidates?.[0];
        const parts = (candidate?.content?.parts || []) as any[];
        const textParts = parts
          .filter(p => p.text)
          .map(p => p.text as string);
        if (textParts.length > 0) {
          text = textParts.join("\n").trim();
        }
      } catch (e) {
        console.warn("Không thể parse text từ phản hồi Gemini:", e);
      }
      
      let suggestedRooms: Listing[] = [];

      // Parse function calls from Gemini structured response
      let functionCalls: any[] = [];
      try {
        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        for (const part of parts as any[]) {
          if (part.functionCall) {
            functionCalls.push(part.functionCall);
          }
        }
      } catch (e) {
        console.warn("Không thể parse functionCall từ phản hồi Gemini:", e);
      }

      if (functionCalls.length > 0) {
        console.log("⚠️ Received functionCalls from Gemini API:", JSON.stringify(functionCalls, null, 2));

        for (const call of functionCalls) {
          if (call.name === 'save_preferences') {
            const args = call.args as any;
            
            // Build a natural conversational response if text is empty
            if (!text) {
              const details: string[] = [];
              if (args.location || args.street) details.push(`khu vực ${(args.street ? args.street + ', ' : '')}${args.location || ''}`.trim().replace(/,$/, ''));
              if (args.min_price || args.max_price) {
                  if (args.min_price && args.max_price) details.push(`giá từ ${(args.min_price/1000000).toFixed(1)} - ${(args.max_price/1000000).toFixed(1)} triệu`);
                  else if (args.max_price) details.push(`giá dưới ${(args.max_price/1000000).toFixed(1)} triệu`);
                  else details.push(`giá trên ${(args.min_price/1000000).toFixed(1)} triệu`);
              }
              if (args.min_area) details.push(`diện tích từ ${args.min_area}m2`);
              if (args.room_type) details.push(`loại ${args.room_type}`);
              if (args.amenities) details.push(`có tiện ích: ${args.amenities}`);
              
              text = `Tôi đã ghi nhận yêu cầu tìm phòng của bạn${details.length > 0 ? ' (' + details.join(', ') + ')' : ''}. Đang tìm kiếm những phòng phù hợp nhất trong hệ thống...`;
            }

            const newPrefs = {
              session_id: sessionId,
              location: args.location || preferences.location,
              min_price: args.min_price || preferences.min_price,
              max_price: args.max_price || preferences.max_price,
              min_area: args.min_area || preferences.min_area,
              amenities: args.amenities || preferences.amenities,
              room_type: args.room_type || preferences.room_type,
            };
            
            await supabase.from('user_preferences').insert([newPrefs]);
            setPreferences(newPrefs);
            const rooms = await fetchMatchingRooms({ ...newPrefs, street: args.street });
            if (rooms) suggestedRooms = rooms;
          }
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: text.trim() || "Xin lỗi, tôi đã gặp sự cố nhỏ khi tạo câu trả lời, nhưng tôi vẫn đang cập nhật thông tin phòng cho bạn.",
        timestamp: new Date(),
        rooms: suggestedRooms.length > 0 ? suggestedRooms : undefined,
      };
      // If we got rooms back, append a natural transition if not already in text
      if (suggestedRooms.length > 0 && botMsg.text.indexOf("Dưới đây là") === -1 && botMsg.text.indexOf("Đây là") === -1) {
          botMsg.text += "\n\nDưới đây là một số phòng tôi tìm thấy phù hợp với yêu cầu của bạn:";
      }
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("AI Error Full:", error);
      const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;
      const errorMsg = error?.message || String(error);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: `**Lỗi hệ thống:**\n- Trạng thái API Key: ${hasKey ? 'Đã nhận' : 'CHƯA NHẬN VÀO VITE'}\n- Chi tiết lỗi: ${errorMsg}\n\n*(Xin thử f5 trang hoặc kiểm tra lại kết nối mạng)*`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF8A00] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-50 group"
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <Home className="w-8 h-8" />}
        {!isChatOpen && (
          <span className="absolute right-16 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100">
            Chat với ProBot tìm phòng
          </span>
        )}
      </button>

      {/* AI Chat Widget */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50"
          >
            {/* Chat Header */}
            <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-[#FF8A00] rounded-full flex items-center justify-center text-white">
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-bold text-sm">ProBot</h2>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Online • Sẵn sàng hỗ trợ</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={cn(
                      "p-2 rounded-full transition-all relative",
                      pendingListings.length > 0 ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <Bell className={cn("w-5 h-5", pendingListings.length > 0 && "animate-bounce")} />
                    {pendingListings.length > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {pendingListings.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Thông báo mới</h3>
                          <button onClick={() => setIsNotificationOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {pendingListings.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                              {pendingListings.map((listing) => (
                                <div 
                                  key={listing.id}
                                  className="p-4 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                  onClick={() => handleReadNotification(listing)}
                                >
                                  <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                      <img src={listing.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{listing.title}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{listing.location}</p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs font-bold text-emerald-600">{listing.price.toLocaleString()}đ</span>
                                        <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">Mới đăng</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell className="w-6 h-6 text-gray-300" />
                              </div>
                              <p className="text-sm text-gray-400 italic">Không có thông báo mới</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button onClick={() => setIsChatOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/30"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === 'user' ? "bg-gray-200" : "bg-[#FF8A00] text-white"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Home className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  )}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white">
                      <Markdown>{msg.text}</Markdown>
                    </div>

                    {msg.rooms && msg.rooms.length > 0 && (
                      <div className="mt-4 -mx-2">
                        <div className="flex gap-3 overflow-x-auto pb-2 px-2 no-scrollbar">
                          {msg.rooms.map(room => (
                            <div 
                              key={room.id} 
                              className="flex-shrink-0 w-40 bg-gray-50 border border-gray-100 rounded-xl p-2 hover:border-emerald-200 transition-all cursor-pointer group shadow-sm"
                            >
                              <div className="relative overflow-hidden rounded-lg mb-2">
                                <img 
                                  src={room.image_url || "https://picsum.photos/seed/room/400/300"} 
                                  alt="" 
                                  className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md text-white text-[7px] px-1.5 py-0.5 rounded-md font-bold">
                                  {room.type || 'Phòng'}
                                </div>
                              </div>
                              <h4 className="font-bold text-[10px] line-clamp-1 group-hover:text-emerald-600 transition-colors">{room.title}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[10px] text-gray-400">location_on</span>
                                <p className="text-[8px] text-gray-500 truncate">{room.location}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                                <span className="text-emerald-600 font-bold text-[9px]">{room.price.toLocaleString()}đ</span>
                                <span className="text-[7px] text-gray-400 font-medium">{room.area}m²</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "text-[9px] mt-2 opacity-50",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 mr-auto">
                  <div className="w-7 h-7 rounded-full bg-[#FF8A00] flex items-center justify-center text-white">
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="bg-white border border-gray-100 p-3 px-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi ProBot về phòng trọ..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/20 focus:border-[#FF8A00] transition-all pr-14"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    input.trim() && !isLoading 
                      ? "bg-[#FF8A00] text-white shadow-lg shadow-[#FF8A00]/20" 
                      : "bg-gray-100 text-gray-300"
                  )}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                ProBot có thể đưa ra thông tin chưa chính xác. Hãy kiểm tra lại nhé!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
