import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Home from './pages/Home.jsx'
import Training from './pages/Training.jsx'
import Family from './pages/Family.jsx'
import Settings from './pages/Settings.jsx'
import Result from './pages/Result.jsx'
import Shopping from './games/Shopping.jsx'
import Cooking from './games/Cooking.jsx'
import { useUiStore } from './store/useUiStore.js'
import { useAppStore } from './store/useAppStore.js'

/*
 * 프로필이 없으면 어느 경로로 들어와도 온보딩으로 보낸다.
 * 하단 탭이 있는 화면 전체를 감싸므로 /home /training /family /settings 가 모두 보호된다.
 */
function RequireProfile() {
  const profile = useAppStore((state) => state.profile)
  if (!profile) return <Navigate to="/onboarding" replace />
  return <AppLayout />
}

export default function App() {
  const largeText = useUiStore((state) => state.largeText)

  // "글자 크게"는 <html> 의 class 하나로만 제어한다 (index.css / tailwind.config.js 참고).
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText)
  }, [largeText])

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<RequireProfile />}>
        <Route path="/home" element={<Home />} />
        <Route path="/training" element={<Training />} />
        {/* 게임과 결과도 하단 탭이 보이는 레이아웃 안에 둔다.
            도중에 탭으로 나가도 앱이 깨지지 않아야 하기 때문이다(SPEC 6.1). */}
        <Route path="/training/shopping" element={<Shopping />} />
        <Route path="/training/cooking" element={<Cooking />} />
        <Route path="/result" element={<Result />} />
        <Route path="/family" element={<Family />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
