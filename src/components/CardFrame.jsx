import './CardFrame.css'
import { MoonMotif, EyeMotif, HandMotif, KeyMotif } from './CornerMotifs.jsx'

/*
 * 카드 프레임 — 화면을 감싸는 이중 금선 테두리 + 네 모서리 문양.
 * design.md §4: 좌상 달 · 우상 눈 · 좌하 손 · 우하 열쇠.
 */
export default function CardFrame() {
  return (
    <div className="card-frame" aria-hidden="true">
      <span className="card-frame__corner card-frame__corner--tl">
        <MoonMotif />
      </span>
      <span className="card-frame__corner card-frame__corner--tr">
        <EyeMotif />
      </span>
      <span className="card-frame__corner card-frame__corner--bl">
        <HandMotif />
      </span>
      <span className="card-frame__corner card-frame__corner--br">
        <KeyMotif />
      </span>
    </div>
  )
}
