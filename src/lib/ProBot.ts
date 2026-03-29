// ============================================================
// ProBot.ts — Core Logic: System Instruction, Intent Detection,
//              Search Params Extraction, Gemini API wrapper
// ============================================================

import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTIONS
// ─────────────────────────────────────────────────────────────

export const ADVISOR_SYSTEM_INSTRUCTION = `
Bạn là ProBot - trợ lý tư vấn phòng trọ của nền tảng Trọ Pro.
Phong cách: Ngắn gọn, thân thiện, thực tế. Luôn trả lời bằng tiếng Việt.

Vai trò của bạn:
1. Tư vấn người thuê về khu vực, đường phố phù hợp với nhu cầu của họ
2. Phân tích ưu/nhược điểm khu vực, tiện ích xung quanh, mức giá phù hợp
3. Đặt câu hỏi để hiểu rõ nhu cầu nếu thông tin chưa đủ

Quy tắc bắt buộc:
- Nếu có "DỮ LIỆU KHU VỰC" bên dưới, ưu tiên dùng dữ liệu đó để trả lời chính xác
- KHÔNG bịa thông tin. Nếu không có dữ liệu, nói thẳng "Mình chưa có dữ liệu khu vực này"
- KHÔNG dẫn link hoặc nguồn tham khảo bên ngoài
- Câu trả lời ngắn gọn, có cấu trúc rõ ràng (dùng bullet points khi cần)
`;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface SearchParams {
  location?: string;
  street?: string;
  minPrice?: number; // VNĐ
  maxPrice?: number; // VNĐ
  minArea?: number;  // m²
  roomType?: string;
}

export type Intent = 'FIND_ROOM' | 'ADVICE' | 'CHAT';

// ─────────────────────────────────────────────────────────────
// INTENT DETECTION (client-side, 0 API call)
// ─────────────────────────────────────────────────────────────

const FIND_KEYWORDS = [
  'tìm', 'thuê', 'kiếm', 'cho thuê', 'có phòng', 'phòng trống',
  'muốn thuê', 'cần thuê', 'tìm phòng', 'tìm trọ', 'phòng nào',
];

const ADVICE_KEYWORDS = [
  'nên ở', 'nên thuê', 'đường nào', 'khu nào', 'ở đâu', 'khu vực nào',
  'tiện ích', 'gần trường', 'gần chợ', 'ưu điểm', 'nhược điểm',
  'so sánh', 'tốt không', 'an ninh', 'an toàn', 'yên tĩnh',
];

export function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();

  const hasFindKeyword = FIND_KEYWORDS.some(k => lower.includes(k));
  const hasPrice = /\d+\s*(?:triệu|tr)/.test(lower);

  if (hasFindKeyword || hasPrice) return 'FIND_ROOM';

  const hasAdviceKeyword = ADVICE_KEYWORDS.some(k => lower.includes(k));
  if (hasAdviceKeyword) return 'ADVICE';

  return 'CHAT';
}

// ─────────────────────────────────────────────────────────────
// SEARCH PARAMS EXTRACTION (regex, 0 API call)
// ─────────────────────────────────────────────────────────────

export function extractSearchParams(text: string): SearchParams {
  const params: SearchParams = {};
  const lower = text.toLowerCase();

  // Price range: "2-4 triệu", "từ 2 đến 4 triệu"
  const rangeMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*[-–đến tới]+\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/);
  if (rangeMatch) {
    params.minPrice = parseFloat(rangeMatch[1].replace(',', '.')) * 1_000_000;
    params.maxPrice = parseFloat(rangeMatch[2].replace(',', '.')) * 1_000_000;
  }

  // Max price: "dưới 5 triệu", "không quá 5tr"
  if (!params.maxPrice) {
    const maxMatch = lower.match(/(?:dưới|không quá|tối đa|max)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/);
    if (maxMatch) params.maxPrice = parseFloat(maxMatch[1].replace(',', '.')) * 1_000_000;
  }

  // Min price: "trên 2 triệu", "từ 2tr"
  if (!params.minPrice) {
    const minMatch = lower.match(/(?:trên|từ|ít nhất|tối thiểu)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/);
    if (minMatch) params.minPrice = parseFloat(minMatch[1].replace(',', '.')) * 1_000_000;
  }

  // Exact price: "tầm 3 triệu", "khoảng 3tr" → ±1 triệu
  if (!params.minPrice && !params.maxPrice) {
    const exactMatch = lower.match(/(?:tầm|khoảng|khoảng|giá)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/);
    if (exactMatch) {
      const val = parseFloat(exactMatch[1].replace(',', '.')) * 1_000_000;
      params.minPrice = Math.max(0, val - 1_000_000);
      params.maxPrice = val + 1_000_000;
    }
  }

  // Area: "30m2", "30 mét vuông"
  const areaMatch = lower.match(/(\d+)\s*(?:m2|m²|mét vuông|mét)/);
  if (areaMatch) params.minArea = parseInt(areaMatch[1]);

  // Room type
  const typeMap: Record<string, string> = {
    'chung cư mini': 'chung cư mini',
    'studio': 'studio',
    'căn hộ': 'căn hộ',
    'phòng trọ': 'phòng trọ',
    'nhà trọ': 'phòng trọ',
  };
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lower.includes(keyword)) { params.roomType = type; break; }
  }

  // Tên đường: "đường Ngô Quyền", "phố Lê Duẩn"
  // Match từ "đường" hoặc "phố" tiếp theo là 1-5 từ tiếng Việt, dừng lại trước các từ khóa dừng
  const streetMatch = lower.match(/(?:đường|phố)\s+([a-zà-ỹ0-9\s]{2,40}?)(?:\s+(?:quận|q\.|huyện|ở|tại|giá|khoảng|có|cho|thuê|phường|p\.)|$|,|\.)/i);
  if (streetMatch && streetMatch[1].trim()) {
    // Loại bỏ các từ thừa có thể dính vào
    let streetName = streetMatch[1].trim();
    if (streetName.length > 2) {
      params.street = streetName;
    }
  }

  return params;
}

// ─────────────────────────────────────────────────────────────
// GEMINI API CALL WITH AUTO-RETRY
// ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseRetryDelay(error: any): number {
  try {
    const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error);
    // Extract retryDelay from error message JSON
    const jsonStart = msg.indexOf('{');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(msg.slice(jsonStart));
      const retryInfo = (parsed?.error?.details || []).find((d: any) =>
        d['@type']?.includes('RetryInfo')
      );
      if (retryInfo?.retryDelay) return parseInt(String(retryInfo.retryDelay)) + 2;
    }
  } catch {}
  return 62; // safe default +2s buffer
}

function isRateLimitError(error: any): boolean {
  const msg = String(error?.message || error);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

export async function callGemini(
  userText: string,
  systemInstruction: string,
  apiKey: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = [],
  onCountdown?: (s: number) => void,
  maxRetries = 2
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Build contents from history + current message
  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    { role: 'user' as const, parts: [{ text: userText }] },
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction, temperature: 0.7 },
      });

      const parts = (response.candidates?.[0]?.content?.parts || []) as any[];
      return parts.filter(p => p.text).map(p => p.text as string).join('\n').trim();

    } catch (error: any) {
      if (isRateLimitError(error) && attempt < maxRetries) {
        const delay = parseRetryDelay(error);
        console.warn(`[ProBot] Rate limit hit. Retrying in ${delay}s... (attempt ${attempt + 1})`);

        if (onCountdown) {
          for (let i = delay; i > 0; i--) {
            onCountdown(i);
            await sleep(1000);
          }
          onCountdown(0);
        } else {
          await sleep(delay * 1000);
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
