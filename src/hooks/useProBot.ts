// ============================================================
// useProBot.ts — Logic Hook: Tất cả business logic của chatbot
// UI component chỉ gọi hook này, không chứa logic
// ============================================================

import { useState, useCallback } from 'react';
import { supabase, Listing } from '../lib/supabase';
import { detectIntent, extractSearchParams, SearchParams } from '../lib/ProBot';
import { searchKnowledge, normalizeText } from '../lib/knowledgeSearch';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  rooms?: Listing[];
  isError?: boolean;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: 'welcome',
  role: 'bot',
  text: 'Xin chào! Tôi là **ProBot** 🏠\n\nTôi có thể giúp bạn:\n- 🔍 **Tìm phòng** theo giá và khu vực\n- 💡 **Tư vấn** nên ở đường nào, khu nào phù hợp\n\nBạn đang cần gì?',
  timestamp: new Date(),
};

// Quick replies không cần gọi API
const QUICK_REPLIES: Array<{ pattern: RegExp; reply: string }> = [
  { pattern: /^(xin chào|chào|hi|hello|hey)\b/i, reply: 'Xin chào! 😊 Bạn cần **tìm phòng** hay **tư vấn khu vực**?' },
  { pattern: /^(cảm ơn|thanks|thank you|cám ơn)\b/i, reply: 'Không có gì! Nếu cần tìm phòng hoặc tư vấn thêm, cứ hỏi mình nhé 😊' },
  { pattern: /^(ok|oke|được|vâng|ừ|uh)\b/i, reply: 'Oke! Bạn muốn tìm phòng hay hỏi thêm điều gì không?' },
  { pattern: /^(bạn là ai|probot là gì|bot này làm gì)\b/i, reply: 'Mình là **ProBot** — trợ lý AI của Trọ Pro 🏠\nMình giúp bạn **tìm phòng trọ** và **tư vấn khu vực** phù hợp với nhu cầu!' },
];

// ─────────────────────────────────────────────────────────────
// DATABASE SEARCH
// ─────────────────────────────────────────────────────────────

async function searchRooms(params: SearchParams & { location?: string }): Promise<Listing[]> {
  if (!import.meta.env.VITE_SUPABASE_URL) return [];

  let query = supabase
    .from('listings')
    .select('id, title, price, area, type, location, street, image_url, images, amenities, is_active, created_at, owner_id')
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  if (params.street) {
    query = query.or(
      `street.ilike.%${params.street}%,title.ilike.%${params.street}%,description.ilike.%${params.street}%`
    );
  }
  
  if (params.location) {
    query = query.ilike('location', `%${params.location}%`);
  }

  if (params.maxPrice) query = query.lte('price', params.maxPrice);
  if (params.minPrice) query = query.gte('price', params.minPrice);
  if (params.minArea)  query = query.gte('area', params.minArea);
  if (params.roomType) query = query.ilike('type', `%${params.roomType}%`);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) { console.error('[ProBot DB]', error); return []; }
  return data || [];
}

async function savePreferences(params: SearchParams & { location?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Chỉ lưu với user đã đăng nhập

  const sessionId = Math.random().toString(36).substring(2, 15);

  const { error } = await supabase.from('user_preferences').upsert({
    user_id: user.id,
    session_id: sessionId,
    location: params.location,
    street: params.street,
    min_price: params.minPrice,
    max_price: params.maxPrice,
    min_area: params.minArea,
    room_type: params.roomType,
    is_active: true,
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('[ProBot DB] Failed to save preferences', error);
  } else {
    console.log('[ProBot] Auto-saved user preferences for', user.email);
    window.dispatchEvent(new Event('probot_preferences_updated'));
  }
}

// ─────────────────────────────────────────────────────────────
// RESPONSE FORMATTERS
// ─────────────────────────────────────────────────────────────

function formatFindRoomResponse(params: SearchParams, rooms: Listing[], location?: string): string {
  const parts: string[] = [];

  if (params.street)     parts.push(`ở đường **${params.street}**`);
  if (location)          parts.push(`khu **${location}**`);
  if (params.minPrice && params.maxPrice)
    parts.push(`giá **${(params.minPrice / 1e6).toFixed(1)}–${(params.maxPrice / 1e6).toFixed(1)} triệu**/tháng`);
  else if (params.maxPrice)
    parts.push(`dưới **${(params.maxPrice / 1e6).toFixed(1)} triệu**/tháng`);
  else if (params.minPrice)
    parts.push(`trên **${(params.minPrice / 1e6).toFixed(1)} triệu**/tháng`);
  if (params.minArea)    parts.push(`từ **${params.minArea}m²**`);
  if (params.roomType)   parts.push(`loại **${params.roomType}**`);

  const criteria = parts.length ? ' ' + parts.join(', ') : '';

  if (rooms.length === 0) {
    return `Mình đã tìm${criteria} nhưng **chưa có phòng phù hợp** trong hệ thống.\n\nBạn thử:\n- Điều chỉnh mức giá cao hơn một chút\n- Chọn khu vực rộng hơn\n- Hỏi mình tư vấn khu vực phù hợp 💡`;
  }

  return `Tìm được **${rooms.length} phòng**${criteria}:`;
}

// ─────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────

export function useProBot() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';


  const addBotMessage = useCallback((text: string, rooms?: Listing[], isError = false) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'bot',
      text,
      timestamp: new Date(),
      rooms: rooms?.length ? rooms : undefined,
      isError,
    }]);
  }, []);

  const handleSend = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // ── TIER 1: Local quick replies (0 API call) ──────────────────
      for (const { pattern, reply } of QUICK_REPLIES) {
        if (pattern.test(inputText.trim())) {
          addBotMessage(reply);
          return;
        }
      }

      const intent = detectIntent(inputText);

      // ── TIER 2A: Tìm phòng → Supabase (0 API call) ───────────────
      if (intent === 'FIND_ROOM') {
        const params = extractSearchParams(inputText);
        const knowledgeMatch = searchKnowledge(inputText);
        const location = knowledgeMatch?.district;

        const rooms = await searchRooms({ ...params, location });
        const text = formatFindRoomResponse(params, rooms, location);
        addBotMessage(text, rooms);

        // Tự động lưu preferences nếu có thông tin tìm kiếm
        if (params.minPrice || params.maxPrice || location || params.roomType) {
          void savePreferences({ ...params, location });
        }

        return;
      }


      // ── TIER 2B: Tư vấn khu vực → Knowledge Base (0 API call) ───
      if (intent === 'ADVICE') {
        const exactMatch = searchKnowledge(inputText);

        if (exactMatch) {
          // Có dữ liệu → trả lời thẳng từ knowledge base, KHÔNG gọi Gemini
          const streets = exactMatch.streets
            .map(s => [
              `**${s.name}** — ${s.price_range.min}–${s.price_range.max} triệu/tháng`,
              `> ${s.reason}`,
              `> 📍 ${s.amenities.slice(0, 3).join(' · ')}`,
              `> 👤 Phù hợp: ${s.target.join(', ')}`,
            ].join('\n'))
            .join('\n\n');

          const pros = exactMatch.pros.map(p => `✅ ${p}`).join('\n');
          const cons = exactMatch.cons.map(c => `⚠️ ${c}`).join('\n');

          // Phân tích xem user có nhắc đến trường ĐH nào không để tạo lời chào cá nhân hóa
          let matchedUni = '';
          if (exactMatch.universities) {
            const normalizedInput = normalizeText(inputText);
            // Lấy ra tên chính thức để chào (có chữ Đại học/FPT)
            const mainUnis = exactMatch.universities.filter(u => u.includes('Đại học') || u.includes('Cao đẳng') || u.includes('FPT'));
            
            for (const uni of mainUnis) {
              if (normalizedInput.includes(normalizeText(uni))) {
                matchedUni = uni;
                break;
              }
            }
            // Fallback nếu user dùng từ khóa lóng (VD: "bách khoa")
            if (!matchedUni) {
              for (const uni of exactMatch.universities) {
                if (!uni.includes('Đại học') && normalizedInput.includes(normalizeText(uni))) {
                  // Lấy tên chính thức tương ứng (ngay trước nó trong mảng)
                  matchedUni = mainUnis.find(m => normalizeText(m).includes(normalizeText(uni))) || uni;
                  break;
                }
              }
            }
          }

          let introText = `## Khu vực ${exactMatch.district} — ${exactMatch.city}\n\n`;
          if (matchedUni) {
            introText = `🎓 **Chào bạn! Học ở ${matchedUni} thì thuê trọ quanh khu vực ${exactMatch.district} là "chuẩn bài" luôn nhé!** Trọ ở đây tiện đi học lắm. Đây là thông tin chi tiết khu vực:\n\n`;
          } else {
            introText += `${exactMatch.overview}\n\n`;
          }

          addBotMessage(
            introText +
            `💰 **Giá thuê:** ${exactMatch.avg_price.min}–${exactMatch.avg_price.max} triệu/tháng\n` +
            `👥 **Phù hợp với:** ${exactMatch.target_audience.join(', ')}\n\n` +
            `### Ưu điểm\n${pros}\n\n` +
            `### Nhược điểm\n${cons}\n\n` +
            `### Các đường nên ở\n\n${streets}\n\n` +
            `---\n💡 *Muốn tìm phòng ở ${exactMatch.district}? Nhập: "tìm phòng [giá] ${exactMatch.district}"*`
          );
          return;
        }
        // Không match knowledge base → TIER 3
      }


      // ── TIER 3: Câu hỏi ngoài phạm vi → Từ chối khéo ────────────
      addBotMessage(
        `Mình chỉ hỗ trợ **tìm phòng trọ** và **tư vấn khu vực** thôi bạn ơi 😊\n\n` +
        `Bạn có thể hỏi mình:\n` +
        `- 🔍 **Tìm phòng:** "tìm phòng 3 triệu quận Hải Châu"\n` +
        `- 💡 **Tư vấn khu vực:** "Hải Châu nên ở đường nào?"\n` +
        `- 💰 **Theo giá:** "phòng dưới 2 triệu ở Liên Chiểu"\n` +
        `- 🏠 **Theo loại:** "tìm studio quận Thanh Khê"\n\n` +
        `Bạn muốn tìm phòng ở khu vực nào?`
      );

    } catch (error: any) {
      console.error('[useProBot]', error);
      const isLimit = String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED');
      addBotMessage(
        isLimit
          ? '⏳ AI đang bận, thử lại sau 1 phút nhé! Hoặc dùng: **"tìm phòng [giá] [khu vực]"**'
          : 'Xin lỗi, đã có lỗi. Vui lòng thử lại!',
        undefined, true
      );
    } finally {
      setIsLoading(false);
      setRetryCountdown(0);
    }
  }, [isLoading, apiKey, addBotMessage]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME]);
  }, []);

  return { messages, isLoading, retryCountdown, handleSend, clearChat };
}
