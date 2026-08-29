import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 설정 — React 플러그인만 사용하는 단일 페이지 앱.
// GitHub Pages는 https://<계정>.github.io/career-constellation/ 하위 경로로 서비스되므로
// 빌드 시에만 base를 지정하고, 로컬 개발(npm run dev)은 루트('/')에서 열리게 한다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/career-constellation/' : '/',
  plugins: [react()],
}))
