import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/*
 * 링크 미리보기(og:image, og:url)는 절대 주소여야 스크래퍼가 이미지를 가져간다.
 * 그런데 배포 도메인을 소스에 박아 두면 도메인이 바뀌는 순간 조용히 깨진다.
 * index.html 에는 %SITE_URL% 자리만 두고 빌드할 때 채운다.
 *
 *   1) VITE_SITE_URL            직접 지정할 때
 *   2) VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL   Vercel 이 빌드에 자동으로 넣어 준다
 *   3) 둘 다 없으면 빈 문자열 -> '/og-image.png' 상대 경로로 남는다.
 *      대부분의 미리보기가 페이지 주소 기준으로 풀어 주므로 개발 중에도 깨지지 않는다.
 */
function resolveSiteUrl() {
  const direct = process.env.VITE_SITE_URL
  if (direct) return direct.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  return vercel ? `https://${vercel}` : ''
}

function siteUrlPlugin() {
  const siteUrl = resolveSiteUrl()
  return {
    name: 'site-url-in-html',
    transformIndexHtml(html) {
      return html.split('%SITE_URL%').join(siteUrl)
    },
  }
}

/*
 * PWA (SPEC 2장) — 마일스톤 7.
 *
 * [개발 중 캐시 문제 방지]
 * SPEC 2장이 PWA 를 마지막 마일스톤으로 미룬 이유가 서비스 워커 캐시다. 한 번 등록된
 * 워커가 옛 파일을 물고 있으면 코드를 고쳐도 화면이 그대로여서 원인을 찾기 어렵다.
 * 그래서 두 가지를 못 박아 둔다.
 *   - devOptions.enabled: false  -> npm run dev 에서는 워커를 아예 등록하지 않는다.
 *   - registerType: 'autoUpdate' -> 배포본에서도 새 빌드가 있으면 사용자에게 묻지 않고
 *     바로 갈아끼운다. "새 버전이 있습니다" 같은 팝업은 고령자에게 결정을 떠넘기는 셈이라
 *     쓰지 않는다(SPEC 3장 — 한 화면에 한 가지 행동).
 *   - clientsClaim/skipWaiting -> 갈아끼운 워커가 다음 방문까지 기다리지 않고 곧바로 맡는다.
 *
 * [오프라인]
 * 앱 껍데기와 정적 자원(js·css·html·아이콘·폰트)을 미리 캐시한다. 훈련 데이터는 원래
 * localStorage 에만 있으므로(SPEC 2·9장) 네트워크가 없어도 그대로 읽고 쓴다.
 * navigateFallback 을 index.html 로 두어, 오프라인에서 /family 같은 주소로 바로 들어와도
 * SPA 라우터가 받도록 한다.
 */
export default defineConfig({
  plugins: [
    react(),
    siteUrlPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Recharts 가 들어간 번들이 기본 상한(2MiB)에 가까워 여유를 둔다.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: '오늘의 두뇌 건강',
        short_name: '두뇌 건강',
        description: '장보기·요리 같은 일상 과제로 두뇌 건강 습관을 이어가는 웰니스 앱입니다.',
        lang: 'ko',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // 고령자 대상: 가로로 눕히면 큰 글자가 한 줄에 안 들어간다. 세로로 고정한다.
        orientation: 'portrait',
        background_color: '#F5F8FC', // 앱 배경(bg)과 같게 두어 실행 순간 깜빡임이 없다
        theme_color: '#1F4B87', // 주색 네이비 (SPEC 10장)
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
