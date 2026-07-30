import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import PlaceholderCard from '../components/PlaceholderCard.jsx'
import BigButton from '../components/BigButton.jsx'

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <PageTitle description="오늘도 두뇌 건강 습관을 이어가 볼까요?">
        홈
      </PageTitle>

      <div className="space-y-5">
        <PlaceholderCard>
          오늘의 추천 훈련, 연속 사용일, 실생활 미션 카드가 이 자리에
          들어갑니다. (마일스톤 2)
        </PlaceholderCard>

        {/* 접근성 확인용 기준 버튼: 최소 높이 64px / 글자 24px */}
        <BigButton
          id="demo-button"
          onClick={() => navigate('/training')}
          aria-label="오늘의 훈련 시작하기"
        >
          오늘의 훈련 시작하기
        </BigButton>

        <BigButton
          variant="secondary"
          onClick={() => navigate('/settings')}
          aria-label="설정 화면으로 이동"
        >
          설정
        </BigButton>
      </div>
    </>
  )
}
