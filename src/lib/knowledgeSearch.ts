// ============================================================
// PROBOT KNOWLEDGE SEARCH ENGINE
// Tìm kiếm và định dạng dữ liệu knowledge base для Gemini RAG
// ============================================================

import { KNOWLEDGE_BASE, DistrictKnowledge } from './knowledgeBase';

/**
 * Chuẩn hóa chuỗi: lowercase, bỏ dấu tiếng Việt, trim
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Tính điểm match giữa query và một DistrictKnowledge
 * Trả về điểm số (0 = không match, càng cao càng phù hợp)
 */
function scoreMatch(query: string, knowledge: DistrictKnowledge): number {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  // Check district name
  if (normalizedQuery.includes(normalizeText(knowledge.district))) {
    score += 10;
  }

  // Check city name
  if (normalizedQuery.includes(normalizeText(knowledge.city))) {
    score += 3;
  }

  // Check aliases
  for (const alias of knowledge.aliases) {
    if (normalizedQuery.includes(normalizeText(alias))) {
      score += 8;
      break;
    }
  }

  // Check universities
  if (knowledge.universities) {
    for (const uni of knowledge.universities) {
      if (normalizedQuery.includes(normalizeText(uni))) {
        score += 15; // Phù hợp trường ĐH điểm cao nhất vì rất cụ thể
        break;
      }
    }
  }

  // Check individual street names in query
  for (const street of knowledge.streets) {
    if (normalizedQuery.includes(normalizeText(street.name))) {
      score += 6;
      break;
    }
  }

  return score;
}

/**
 * Tìm kiếm knowledge phù hợp nhất từ câu hỏi người dùng
 * Trả về district phù hợp nhất hoặc null nếu không tìm thấy
 */
export function searchKnowledge(query: string): DistrictKnowledge | null {
  if (!query || query.trim().length === 0) return null;

  let bestMatch: DistrictKnowledge | null = null;
  let bestScore = 0;

  for (const knowledge of KNOWLEDGE_BASE) {
    const score = scoreMatch(query, knowledge);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = knowledge;
    }
  }

  // Chỉ trả về nếu có match tối thiểu (điểm >= 6)
  return bestScore >= 6 ? bestMatch : null;
}

/**
 * Tìm nhiều kết quả, dùng khi câu hỏi chung chung về thành phố
 */
export function searchKnowledgeMultiple(query: string, limit = 3): DistrictKnowledge[] {
  if (!query || query.trim().length === 0) return [];

  const scored = KNOWLEDGE_BASE
    .map((k) => ({ knowledge: k, score: scoreMatch(query, k) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.knowledge);
}

/**
 * Định dạng một DistrictKnowledge thành văn bản context cho Gemini
 */
export function formatKnowledgeForAI(knowledge: DistrictKnowledge): string {
  const lines: string[] = [];

  lines.push(`## Khu vực: ${knowledge.district} — ${knowledge.city}`);
  lines.push(`**Tổng quan:** ${knowledge.overview}`);
  lines.push(
    `**Giá thuê trung bình:** ${knowledge.avg_price.min} – ${knowledge.avg_price.max} triệu VNĐ/tháng`
  );
  lines.push(`**Phù hợp với:** ${knowledge.target_audience.join(', ')}`);
  
  if (knowledge.universities && knowledge.universities.length > 0) {
    // Chỉ hiển thị tên chính (loại bỏ các alias rút gọn)
    const displayUnis = knowledge.universities.filter(u => u.includes('Đại học') || u.includes('Cao đẳng') || u.includes('FPT'));
    if (displayUnis.length > 0) {
      lines.push(`**Trường Đại học lân cận:** ${displayUnis.join(', ')}`);
    }
  }
  
  lines.push('');

  lines.push('**Ưu điểm khu vực:**');
  knowledge.pros.forEach((p) => lines.push(`  - ${p}`));

  lines.push('**Nhược điểm khu vực:**');
  knowledge.cons.forEach((c) => lines.push(`  - ${c}`));
  lines.push('');

  lines.push('### Các đường phố nên ở:');
  for (const street of knowledge.streets) {
    lines.push('');
    lines.push(`#### Đường ${street.name}`);
    lines.push(`- **Lý do nên ở:** ${street.reason}`);
    lines.push(
      `- **Giá thuê:** ${street.price_range.min} – ${street.price_range.max} triệu/tháng`
    );
    lines.push(`- **Loại phòng:** ${street.types.join(', ')}`);
    lines.push(`- **Phù hợp với:** ${street.target.join(', ')}`);
    lines.push(`- **Tiện ích gần đó:** ${street.amenities.join(' | ')}`);
    lines.push(`- **Ưu điểm:** ${street.pros.join('; ')}`);
    lines.push(`- **Nhược điểm:** ${street.cons.join('; ')}`);
  }

  return lines.join('\n');
}

/**
 * Định dạng nhiều kết quả (dùng cho câu hỏi so sánh nhiều quận)
 */
export function formatMultipleKnowledgeForAI(districts: DistrictKnowledge[]): string {
  if (districts.length === 0) return '';
  return districts.map(formatKnowledgeForAI).join('\n\n---\n\n');
}
