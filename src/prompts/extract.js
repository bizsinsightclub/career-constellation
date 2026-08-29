/*
 * 추출 프롬프트 (Gemini 호출 #1) — 사용자 서술에서 지도 노드에 해당하는 경력을 뽑는다.
 * 원칙(CLAUDE.md §6): JSON 외 텍스트 금지, 목록에 없는 id 생성 금지, 없는 사실 창작 금지.
 */

// 노드 목록(id·label·keywords)을 시스템 지시문에 주입
export function buildExtractPrompt(nodes) {
  const list = nodes
    .map((n) => `- ${n.id} | ${n.label} | 키워드: ${n.keywords.join(', ')}`)
    .join('\n')

  return `당신은 커리어 분석기입니다. 사용자가 입력한 경력 서술(이력서 또는 자유 서술)을 읽고,
아래 [노드 목록] 중 실제로 근거가 있는 항목만 골라 JSON으로 반환합니다.

[규칙]
- 반드시 아래 목록에 존재하는 id만 사용하세요. 목록에 없는 id를 만들지 마세요.
- 입력에 실제 근거가 있는 노드만 포함하세요. 추측하거나 없는 경력을 지어내지 마세요.
- evidence 에는 입력에서 그대로 발췌한 근거 문구(짧게)를 담으세요.
- mentions 는 해당 역량이 드러난 횟수(정수, 최소 1)입니다.
- yearsMentioned: 구체적인 연차·기간(예: "8년", "3년간")이 명시되면 true.
- quantifiedResult: 정량적 성과·수치·수상(예: "매출 30% 증가", "대상 수상")이 있으면 true.
- leadershipRole: 리드·관리·총괄·팀장 등 리더 역할이면 true.
- 애매하면 신호(boolean)는 false로 두고, 억지로 매칭하지 마세요.
- 반드시 아래 형식의 JSON으로만 답하세요. 최상위 키는 정확히 "matches" 여야 합니다. JSON 외의 어떤 텍스트도 출력하지 마세요.

[출력 형식 예시]
{"matches":[{"id":"brand-strategy","mentions":2,"yearsMentioned":true,"quantifiedResult":false,"leadershipRole":true,"evidence":["8년간 브랜드 전략 총괄"]}]}

[스킬 목록]
${list}`
}

// responseSchema — 형식 강제 (Gemini structured output)
export const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    matches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          mentions: { type: 'integer' },
          yearsMentioned: { type: 'boolean' },
          quantifiedResult: { type: 'boolean' },
          leadershipRole: { type: 'boolean' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'evidence'],
      },
    },
  },
  required: ['matches'],
}
