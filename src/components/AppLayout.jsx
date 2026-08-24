import { Outlet } from 'react-router-dom'
import BottomTabs from './BottomTabs.jsx'
import WellnessNotice from './WellnessNotice.jsx'

/*
 * 하단 탭이 보이는 화면들의 공통 레이아웃.
 * 탭바가 고정되어 있으므로 본문 아래쪽에 탭바 높이만큼 여백을 준다.
 *
 * 웰니스 고지(SPEC 4장)는 여기 공통 영역에 한 번 두어 모든 화면에서 보이게 한다.
 * (설정 화면에도 따로 한 번 더 표시한다)
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-3xl px-5 pt-8">
        <Outlet />
      </main>

      <footer className="mx-auto mt-10 max-w-3xl px-5 pb-tabbar">
        <WellnessNotice />
      </footer>

      <BottomTabs />
    </div>
  )
}
