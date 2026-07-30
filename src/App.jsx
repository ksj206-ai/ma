import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Home from './pages/Home.jsx'
import Training from './pages/Training.jsx'
import Family from './pages/Family.jsx'
import Settings from './pages/Settings.jsx'
import { useUiStore } from './store/useUiStore.js'

export default function App() {
  const largeText = useUiStore((state) => state.largeText)

  // "글자 크게"는 <html> 의 class 하나로만 제어한다 (index.css / tailwind.config.js 참고).
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText)
  }, [largeText])

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/family" element={<Family />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
