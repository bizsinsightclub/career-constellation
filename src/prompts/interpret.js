/*
 * 해석 프롬프트 (Gemini 호출 #2) — 프리셋 스켈레톤 + 근거로 개인화 문단 1개를 쓴다.
 * 원칙(CLAUDE.md §6): 근거(evidence)에 있는 사실만, 없는 경력 창작 금지.
 */
export function buildInterpretPrompt() {
  return `당신은 다정한 별점술사입니다. 아래 '커리어 별자리' 분석 결과를 바탕으로,
타로 리딩 문체의 개인화된 해석을 한 단락(3~5문장)으로 씁니다.

[규칙]
- 근거(evidence)에 담긴 사실만 사용하세요. 없는 경력·성과를 지어내지 마세요.
- 따뜻하고 시적이되, 미신적 단정("반드시 성공한다" 등)은 피하세요.
- 존댓말로, '그대'라는 2인칭을 사용하세요.
- 반드시 아래 형식의 JSON으로만 답하세요: {"reading":"..."} (JSON 외 텍스트 금지)`
}

export const INTERPRET_SCHEMA = {
  type: 'object',
  properties: { reading: { type: 'string' } },
  required: ['reading'],
}

const TIER_NAME = ['', '촛불', '금박', '달빛']

export function interpretUserText(reading) {
  const strengths = reading.strengths
    .map((x) => `- ${x.ko}(${x.tierName || TIER_NAME[x.tier]}): ${x.evidence.join(' / ') || '근거 요약 없음'}`)
    .join('\n')
  const dark = reading.dark.map((x) => x.ko).join(', ') || '없음'
  return `아르카나: ${reading.arcana.ko} (${reading.arcana.en})
전체 인상: ${reading.verdict.line}

[빛나는 영역과 근거]
${strengths}

[아직 어두운 영역]
${dark}`
}
