import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import PlaceholderCard from '../components/PlaceholderCard.jsx'
import BigButton from '../components/BigButton.jsx'

/*
 * 온보딩은 하단 탭 없이 단독으로 보여준다 (한 화면에 한 가지 행동).
 */
export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <PageTitle description="시작하기 전에 몇 가지만 여쭤봅니다.">
          처음 오셨나요?
        </PageTitle>

        <div className="space-y-5">
          <PlaceholderCard>
            이름·나이대 입력과 글자 크기·음성 안내 선택이 이 자리에 들어갑니다.
            (마일스톤 2)
          </PlaceholderCard>

          <BigButton
            onClick={() => navigate('/home')}
            aria-label="홈 화면으로 이동"
          >
            시작하기
          </BigButton>
        </div>
      </main>
    </div>
  )
}
