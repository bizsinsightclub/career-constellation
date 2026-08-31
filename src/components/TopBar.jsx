import { useState } from 'react'
import './TopBar.css'

/*
 * 상단 고정 바 — 제목 + 햄버거 메뉴(설정·해석·초기화).
 * 데스크톱: 제목 중앙 + 우측 메뉴. 모바일: 제목 좌측 + 우측 햄버거.
 */
export default function TopBar({ hasReading, litCount, onOpenSettings, onOpenReading, onReset }) {
  const [open, setOpen] = useState(false)
  const run = (fn) => () => {
    setOpen(false)
    fn?.()
  }

  return (
    <header className="topbar">
      <div className="topbar__titlewrap">
        <p className="topbar__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="topbar__title">커리어 별자리</h1>
      </div>

      <button className="topbar__menu" aria-label="메뉴" onClick={() => setOpen((o) => !o)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <>
          <div className="topbar__scrim" onClick={() => setOpen(false)} />
          <div className="topbar__dropdown" role="menu">
            <button className="topbar__item" role="menuitem" onClick={run(onOpenSettings)}>
              키·모델 설정
            </button>
            {hasReading && (
              <button className="topbar__item" role="menuitem" onClick={run(onOpenReading)}>
                해석 카드 보기
              </button>
            )}
            {litCount > 0 && (
              <button className="topbar__item" role="menuitem" onClick={run(onReset)}>
                지도 초기화
              </button>
            )}
          </div>
        </>
      )}
    </header>
  )
}
