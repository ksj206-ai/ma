/** @type {import('tailwindcss').Config} */

/*
 * 고령자 접근성 디자인 토큰 (SPEC 3장 / 10장)
 *
 * [글자 크게 토글 설계]
 * 모든 접근성 토큰은 px 가 아니라 rem 으로 정의한다.
 * 루트 <html> 의 기준 폰트 크기가 16px 이므로
 *   1.25rem = 20px (body) / 1.5rem = 24px (button) / 2rem = 32px (title) / 4rem = 64px (touch)
 * 가 되고, index.css 에서 <html> 에 class "large-text" 하나만 붙이면
 * 기준 폰트가 20px 로 바뀌어 글자·터치영역·여백이 한 번에 정확히 1.25배가 된다.
 * (버튼 글자만 커지고 버튼 크기는 그대로여서 글자가 넘치는 문제를 구조적으로 방지)
 *
 * [대비] 아래 색상은 밝은 배경(bg #F5F8FC) 위에서 WCAG AAA(7:1) 이상을 목표로 잡았다.
 *   primary-600 #1F4B87  on white  ≈ 8.5:1  (흰 글자를 얹어도 8.5:1)
 *   ink        #111C33  on bg     ≈ 16.8:1
 *   muted      #3D4A63  on bg     ≈  8.0:1  (회색 위 옅은 회색 금지 원칙 준수)
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontSize: {
        // 본문 20px / 버튼·선택지 24px / 화면 제목 32px  (기준 16px 환산)
        body: ['1.25rem', { lineHeight: '1.65' }],
        button: ['1.5rem', { lineHeight: '1.35' }],
        title: ['2rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      minHeight: {
        // 모든 버튼·선택지 최소 터치 영역 64px
        touch: '4rem',
      },
      minWidth: {
        touch: '4rem',
      },
      spacing: {
        touch: '4rem',
        tabbar: '5.5rem', // 하단 고정 탭바 높이(88px) — 탭 자체는 64px + 여백
      },
      colors: {
        // 차분한 네이비 계열 주색
        primary: {
          50: '#EEF3FA',
          100: '#D7E3F4',
          200: '#AEC6E8',
          300: '#7FA4D6',
          400: '#4F7FC0',
          500: '#2E5FA3',
          600: '#1F4B87',
          700: '#173A6B',
          800: '#112C52',
          900: '#0C1F3B',
        },
        // 부드러운 포인트 컬러 (따뜻한 주황)
        accent: {
          50: '#FDF3EC',
          500: '#C2410C',
          600: '#9A3412',
        },
        bg: '#F5F8FC', // 밝고 깨끗한 배경
        surface: '#FFFFFF', // 카드 면
        line: '#C9D4E4', // 경계선
        ink: '#111C33', // 기본 텍스트
        muted: '#3D4A63', // 보조 텍스트 (그래도 AAA)
        success: '#166534',
        danger: '#9B1C1C',
      },
      borderRadius: {
        card: '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(17, 28, 51, 0.08)',
      },
    },
  },
  plugins: [],
}
