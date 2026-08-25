import PageTitle from '../components/PageTitle.jsx'
import PlaceholderCard from '../components/PlaceholderCard.jsx'
import ProfileChart from '../components/ProfileChart.jsx'
import { useAppStore } from '../store/useAppStore.js'

/*
 * 가족 모드(보호자 리포트) — 마일스톤 5 범위는 기능 프로파일 차트만.
 * 주간 요약·하이라이트 카드 등 나머지 대시보드 구성은 마일스톤 6.
 */
export default function Family() {
  const sessions = useAppStore((state) => state.sessions)

  return (
    <>
      <PageTitle description="이번 주 활동을 가족과 함께 봅니다.">가족</PageTitle>

      <div className="space-y-5">
        <ProfileChart sessions={sessions} />

        <PlaceholderCard>
          이번 주 활동 요약과 하이라이트 카드가 이 자리에 들어갑니다. (마일스톤 6)
        </PlaceholderCard>
      </div>
    </>
  )
}
