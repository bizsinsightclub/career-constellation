/*
 * 해석 프롬프트 (Gemini 호출 #2) — 그 사람만의 아르카나 카드명 창작 + 개인화 문단.
 * 원칙(CLAUDE.md §6): 근거(evidence)에 있는 사실만, 없는 경력 창작 금지.
 */
export function buildInterpretPrompt() {
  return `당신은 다정한 별점술사입니다. 아래 '커리어 별자리' 분석 결과를 바탕으로,
(1) 이 사람만의 '아르카나 카드'를 창작하고 (2) 타로 리딩 문체의 개인화된 해석 한 단락(3~5문장)을 씁니다.

[아르카나 규칙]
- 이 사람의 '조합'을 상징하는 독창적인 카드 이름을 새로 지으세요. 각기 다른 사람에게는 다른 이름이 나와야 합니다.
- "전략가", "길을 그리는 자"처럼 흔하고 밋밋한 이름은 피하세요. 두 영역 이상의 결합을 은유로 담으면 좋습니다 (예: "다리를 놓는 자", "숫자로 꿈꾸는 자", "불을 다스리는 설계자").
- arcanaRoman: 로마 숫자 하나 (예: XIV, XXII — 자유롭게).
- arcanaKo: 한글 카드명(4~8자 권장). arcanaEn: 영어 카드명. arcanaTagline: 한 줄 부제.

[해석 규칙]
- 근거(evidence)에 담긴 사실만 사용하세요. 없는 경력·성과를 지어내지 마세요.
- 따뜻하고 시적이되, 미신적 단정("반드시 성공한다")은 피하세요. 존댓말, '그대' 2인칭.

반드시 아래 JSON으로만 답하세요(그 외 텍스트 금지):
{"arcanaRoman":"...","arcanaKo":"...","arcanaEn":"...","arcanaTagline":"...","reading":"..."}`
}

export const INTERPRET_SCHEMA = {
  type: 'object',
  properties: {
    arcanaRoman: { type: 'string' },
    arcanaKo: { type: 'string' },
    arcanaEn: { type: 'string' },
    arcanaTagline: { type: 'string' },
    reading: { type: 'string' },
  },
  required: ['reading'],
}

const TIER_NAME = ['', '촛불', '금박', '달빛']

export function interpretUserText(reading) {
  const strengths = reading.strengths
    .map((x) => `- ${x.ko}(${x.tierName || TIER_NAME[x.tier]}): ${x.evidence.join(' / ') || '근거 요약 없음'}`)
    .join('\n')
  const dark = reading.dark.map((x) => x.ko).join(', ') || '없음'
  return `전체 인상: ${reading.verdict.line}

[빛나는 영역과 근거]
${strengths}

[아직 어두운 영역]
${dark}`
}
