import PageTitle from './PageTitle.jsx'
import Card from './Card.jsx'
import BigButton from './BigButton.jsx'

/**
 * 게임 첫 화면 — "오늘은 OO를 만듭니다" + 큰 시작 버튼.
 *
 * 장보기와 요리가 같은 짜임을 쓰므로 한 곳에 둔다.
 * 게임마다 다른 것은 문구뿐이라 문구만 받는다.
 * (한 화면에 한 가지 행동 — SPEC 3장)
 */
export default function GameIntro({
  title,
  description,
  recipeName,
  lead,
  startLabel,
  onStart,
}) {
  return (
    <>
      <PageTitle description={description}>{title}</PageTitle>

      <Card>
        <p className="text-body text-muted">오늘 만들 요리는</p>
        <p className="mt-2 text-title font-bold text-primary-700">{recipeName}</p>
        <p className="mt-4 text-body text-muted">{lead}</p>
      </Card>

      <div className="mt-6">
        <BigButton onClick={onStart} aria-label={startLabel}>
          시작하기
        </BigButton>
      </div>
    </>
  )
}
