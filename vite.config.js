import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'

/*
 * [DEV 전용] LLM 테스트 미들웨어.
 * dev 서버에만 /__llm 엔드포인트를 열어, 구독제 `claude -p`로 추출/해석을 돌린다.
 * apply:'serve' + configureServer 이므로 `vite build`(배포) 산출물엔 절대 포함되지 않는다.
 * (프로덕션은 여전히 브라우저에서 사용자 Gemini 키로 직접 호출)
 */
function devLlmPlugin() {
  return {
    name: 'dev-llm',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__llm', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('POST only')
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          let prompt = ''
          try {
            const { system, user } = JSON.parse(body || '{}')
            prompt = `${system || ''}\n\n[사용자 입력]\n${user || ''}\n\n반드시 지정된 JSON 형식으로만, JSON 외 텍스트 없이 출력하세요.`
          } catch {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'bad request' }))
          }
          const child = spawn('claude', ['-p'], { shell: true })
          let out = ''
          let err = ''
          child.stdout.on('data', (d) => (out += d))
          child.stderr.on('data', (d) => (err += d))
          child.on('error', (e) => {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'spawn 실패: ' + String(e) }))
          })
          child.on('close', (code) => {
            res.setHeader('Content-Type', 'application/json')
            if (code !== 0 && !out) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: `claude 종료(${code}): ${err.slice(0, 500)}` }))
            }
            res.end(JSON.stringify({ text: out }))
          })
          child.stdin.write(prompt)
          child.stdin.end()
        })
      })
    },
  }
}

// GitHub Pages는 하위 경로로 서비스 → 빌드 시에만 base 지정, 로컬은 루트
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/career-constellation/' : '/',
  plugins: [react(), devLlmPlugin()],
}))
