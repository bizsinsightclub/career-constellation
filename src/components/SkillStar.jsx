/*
 * SkillStar — 세부 스킬 잔별 (영역 대표별 주위의 작은 별들).
 * 미점등: 아주 작은 희미한 별
 * 점등(tier 1~3): 촛불/금박/달빛으로 발광 + 입력에서 뽑은 '그 사람만의 별 이름' 라벨 표시.
 */
const TIER_NAME = ['', 'Silver', 'Diamond', 'Gold']
const R = [2, 4.6, 6.2, 8]

export default function SkillStar({ skill, tier = 0, customLabel, onClick }) {
  const { x, y, label } = skill
  const lit = tier > 0
  // 점등된 별에는 입력 기반 라벨(없으면 프리셋 스킬명)을 보여 의미를 드러낸다
  const shown = customLabel || label

  return (
    <g
      className={`skillstar ${lit ? `skillstar--t${tier}` : 'skillstar--dim'}`}
      data-skill-id={skill.id}
      transform={`translate(${x} ${y})`}
      onClick={onClick ? () => onClick(skill.id) : undefined}
    >
      {tier >= 2 && (
        <>
          <line className="skillstar__ray" x1={-R[tier] - 5} y1="0" x2={R[tier] + 5} y2="0" />
          <line className="skillstar__ray" x1="0" y1={-R[tier] - 5} x2="0" y2={R[tier] + 5} />
        </>
      )}
      {tier === 3 && (
        <>
          <line className="skillstar__ray" x1={-R[tier] - 2} y1={-R[tier] - 2} x2={R[tier] + 2} y2={R[tier] + 2} />
          <line className="skillstar__ray" x1={-R[tier] - 2} y1={R[tier] + 2} x2={R[tier] + 2} y2={-R[tier] - 2} />
        </>
      )}
      <circle className="skillstar__core" r={R[tier]} />
      {lit && (
        <text className="skillstar__label" y={R[tier] + 12}>
          {shown}
        </text>
      )}
      <circle className="skillstar__hit" r="10" fill="transparent" />
      <title>{shown}{lit ? ` · ${TIER_NAME[tier]}` : ''}</title>
    </g>
  )
}
