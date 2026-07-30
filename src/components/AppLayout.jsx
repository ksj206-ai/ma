import { Outlet } from 'react-router-dom'
import BottomTabs from './BottomTabs.jsx'

/*
 * 하단 탭이 보이는 화면들의 공통 레이아웃.
 * 탭바가 고정되어 있으므로 본문 아래쪽에 탭바 높이만큼 여백을 준다.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-3xl px-5 pb-tabbar pt-8">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  )
}
