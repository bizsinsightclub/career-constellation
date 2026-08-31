import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/global.css'

// iOS Safari의 핀치 확대(gesture) 차단 — 지도의 커스텀 핀치(포인터 이벤트)는 영향 없음
;['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }),
)

// 앱 진입점 — tokens.css(디자인 토큰) → global.css(배경) 순으로 로드
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
