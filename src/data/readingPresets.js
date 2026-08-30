/*
 * 해석 프리셋 (결정적) — 점등 패턴에서 아르카나 이름·판정·영역별 문구를 조립한다.
 * (tarot 레포의 결정적 사전 방식 참고) LLM은 이 위에 개인화 문단만 덧붙인다.
 */

// 우세 영역(dominant) → 아르카나 카드
export const ARCANA = {
  keter:   { roman: 'I',    ko: '소명을 좇는 자',   en: 'The Called',           tagline: '가장 높은 곳의 별을 바라보는 이' },
  hokhmah: { roman: 'II',   ko: '길을 그리는 자',   en: 'The Strategist',       tagline: '멀리 보고 판을 짜는 이' },
  binah:   { roman: 'III',  ko: '수를 읽는 자',     en: 'The Seer of Numbers',  tagline: '혼돈 속에서 질서를 읽는 이' },
  daat:    { roman: 'IV',   ko: '끝없이 배우는 자', en: 'The Eternal Student',  tagline: '앎으로 스스로를 벼리는 이' },
  hesed:   { roman: 'V',    ko: '사람을 품는 자',   en: 'The Shepherd',         tagline: '사람을 이끌고 살피는 이' },
  gevurah: { roman: 'VI',   ko: '벼려내는 손의 자', en: 'The Forgemaster',      tagline: '뜻을 현실로 벼려내는 이' },
  tiferet: { roman: 'VII',  ko: '아름다움을 빚는 자', en: 'The Maker',          tagline: '무에서 형태를 빚는 이' },
  netzah:  { roman: 'VIII', ko: '승리를 새기는 자', en: 'The Victor',           tagline: '결실로 스스로를 증명하는 이' },
  hod:     { roman: 'IX',   ko: '말로 잇는 자',     en: 'The Herald',           tagline: '말과 이야기로 세상에 닿는 이' },
  yesod:   { roman: 'X',    ko: '대지에 뿌리내린 자', en: 'The Rooted',         tagline: '현장에서 다져온 이' },
}
export const ARCANA_FALLBACK = { roman: '0', ko: '여정의 방랑자', en: 'The Wanderer', tagline: '별을 찾아 걷는 이' }

// 점등된 영역의 강점 문구 (② 빛나는 별들)
export const DOMAIN_STRENGTH = {
  keter:   '그대의 시선은 늘 지평 너머, 아직 오지 않은 것을 향합니다.',
  hokhmah: '그대는 흩어진 조각들 사이에서 나아갈 길을 읽어냅니다.',
  binah:   '숫자와 자료 속에서, 그대는 남들이 놓친 질서를 봅니다.',
  daat:    '배움은 그대의 오래된 습관이자 가장 날카로운 무기입니다.',
  hesed:   '사람들은 그대의 곁에서 자라났습니다.',
  gevurah: '그대의 손을 거치면 흐릿한 뜻이 단단한 현실이 됩니다.',
  tiferet: '그대는 없던 것을 아름다운 형태로 빚어냅니다.',
  netzah:  '그대의 여정에는 눈에 보이는 결실이 또렷이 새겨져 있습니다.',
  hod:     '그대의 말과 이야기는 멀리까지 닿습니다.',
  yesod:   '그대의 경험은 단단한 대지가 되어 나머지 별들을 떠받칩니다.',
}

// 아직 어두운 영역 문구 (③ 어두운 길 · ④ 다음에 깃들 별)
export const DOMAIN_DARK = {
  keter:   '아직 그대만의 북극성 — 오래 좇을 소명 — 은 흐릿합니다.',
  hokhmah: '큰 판을 그리는 전략의 별은 아직 잠들어 있습니다.',
  binah:   '데이터로 세상을 읽는 별에는 아직 빛이 닿지 않았습니다.',
  daat:    '새로운 배움의 별이 조용히 그대를 기다립니다.',
  hesed:   '사람을 이끄는 리더십의 별은 아직 켜지지 않았습니다.',
  gevurah: '실행과 운영의 별은 아직 어둠 속에 있습니다.',
  tiferet: '무언가를 빚어내는 창작의 별이 그대를 기다립니다.',
  netzah:  '눈에 보이는 성과의 별은 아직 조용합니다.',
  hod:     '그대의 목소리를 세상에 퍼뜨릴 별이 아직 어둡습니다.',
  yesod:   '아직 뿌리내리지 않은 새로운 산업의 대지가 남아 있습니다.',
}

// 전체 인상(판정) — 별자리의 모양으로
export function verdictOf(litDomains) {
  const count = litDomains.length
  const hasDeep = litDomains.some((d) => d.tier >= 3)
  if (count >= 6) {
    return { ko: '넓게 뻗은 하늘', line: '그대의 별자리는 여러 방향으로 넓게 뻗어 있습니다 — 다재多才의 하늘입니다.' }
  }
  if (hasDeep && count <= 3) {
    return { ko: '깊게 타오르는 불꽃', line: '좁지만 깊게 타오르는 별자리 — 한 길을 오래 판 이의 하늘입니다.' }
  }
  if (count === 0) {
    return { ko: '아직 잠든 하늘', line: '아직 별이 깃들지 않았습니다. 그대의 이야기를 조금 더 들려주세요.' }
  }
  return { ko: '자라나는 별자리', line: '그대의 별자리는 이제 막 모양을 갖추기 시작했습니다.' }
}
