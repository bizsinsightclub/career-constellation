/*
 * SkillStar — 세부 스킬 잔별 (영역 대표별 주위의 작은 별들).
 * 미점등: 아주 작은 희미한 별 (아직 읽히지 않은 하늘)
 * 점등(tier 1~3): 촛불/금박/달빛으로 발광, 크기도 커짐.
 */
const TIER_NAME = ['', '촛불', '금박', '달빛']
const R = [2, 4.6, 6.2, 8]

export default function SkillStar({ skill, tier = 0, onClick }) {
  const { x, y, label } = skill
  const lit = tier > 0
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
      <circle className="skillstar__hit" r="9" fill="transparent" />
      <title>{label}{lit ? ` · ${TIER_NAME[tier]}` : ''}</title>
    </g>
  )
}
