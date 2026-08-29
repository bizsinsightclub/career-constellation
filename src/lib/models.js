/*
 * 모델 레지스트리 — 사용자가 고르는 Gemini 모델 목록 (가성비 포함).
 * 모델 추가·교체는 이 파일 한 곳에서. (가격·무료티어 여부는 2026-08 기준, 변동 가능)
 */
export const MODELS = [
  {
    id: 'gemini-2.5-flash-lite',
    tier: '가성비',
    label: '가성비 · Flash-Lite',
    price: '입력 $0.10 / 출력 $0.40 (100만 토큰당)',
    free: true,
    note: '가장 저렴하고 빠름',
  },
  {
    id: 'gemini-3.7-flash',
    tier: '표준',
    label: '표준 · Flash',
    price: '입력 $0.75 / 출력 $3.75 (100만 토큰당)',
    free: true,
    note: '최신 Flash · 품질과 비용의 균형',
  },
  {
    id: 'gemini-3.1-pro',
    tier: '고품질',
    label: '고품질 · Pro',
    price: '입력 $2.00 / 출력 $12.00 (100만 토큰당)',
    free: false,
    note: '문장 품질 최상 · 무료 티어 불가(유료 플랜 필요)',
  },
]

// 기본값: 표준 Flash (무료 티어 가능·균형)
export const DEFAULT_MODEL = 'gemini-3.7-flash'

export function getModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS.find((m) => m.id === DEFAULT_MODEL)
}
