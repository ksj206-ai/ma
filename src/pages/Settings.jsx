import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import PlaceholderCard from '../components/PlaceholderCard.jsx'
import BigButton from '../components/BigButton.jsx'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <>
      <PageTitle>설정</PageTitle>

      <div className="space-y-5">
        <PlaceholderCard>
          글자 크게, 음성 안내, 데이터 초기화, 웰니스 고지가 이 자리에
          들어갑니다. (마일스톤 2)
        </PlaceholderCard>

        <BigButton
          variant="secondary"
          onClick={() => navigate('/home')}
          aria-label="홈 화면으로 돌아가기"
        >
          홈으로 돌아가기
        </BigButton>
      </div>
    </>
  )
}
