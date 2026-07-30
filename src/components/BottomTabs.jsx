import { useLocation, useNavigate } from 'react-router-dom'

/*
 * 하단 고정 탭 3개 (홈 · 훈련 · 가족) — SPEC 3장.
 *  - 각 탭 최소 높이 64px (min-h-touch)
 *  - 클릭 가능한 요소는 <button> (div onClick 금지)
 *  - aria-label 부여, 현재 탭은 aria-current="page"
 *  - 선택 여부는 hover 가 아니라 상태 기반 스타일(색 + 굵기 + 상단 바)로 표시
 */
const TABS = [
  { path: '/home', label: '홈', ariaLabel: '홈 화면으로 이동', icon: HomeIcon },
  {
    path: '/training',
    label: '훈련',
    ariaLabel: '훈련 화면으로 이동',
    icon: TrainingIcon,
  },
  {
    path: '/family',
    label: '가족',
    ariaLabel: '가족 화면으로 이동',
    icon: FamilyIcon,
  },
]

export default function BottomTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="주요 화면 이동"
      className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-surface"
    >
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.path)
          const Icon = tab.icon
          return (
            <li key={tab.path} className="flex-1">
              <button
                type="button"
                onClick={() => navigate(tab.path)}
                aria-label={tab.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex w-full min-h-touch flex-col items-center justify-center gap-1',
                  'border-t-4 px-2 py-3 text-button font-bold',
                  'transition-colors duration-150',
                  isActive
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-transparent bg-surface text-muted',
                ].join(' ')}
              >
                <Icon active={isActive} />
                <span>{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* 아이콘은 크고 명확하게. 아이콘 단독 버튼은 만들지 않고 항상 글자와 함께 쓴다. */
function iconProps(active) {
  return {
    width: '2rem',
    height: '2rem',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.4 : 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  }
}

function HomeIcon({ active }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function TrainingIcon({ active }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M4 12h16" />
      <path d="M7 7.5v9" />
      <path d="M17 7.5v9" />
      <path d="M3.5 9.5v5" />
      <path d="M20.5 9.5v5" />
    </svg>
  )
}

function FamilyIcon({ active }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15 14.8c2.6.2 4.5 2.1 4.5 4.7" />
    </svg>
  )
}
