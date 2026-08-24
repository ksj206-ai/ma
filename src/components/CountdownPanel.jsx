import Card from './Card.jsx'
import BigButton from './BigButton.jsx'

/**
 * 노출 단계 공통 화면 — "남은 시간 N초" + 외울 내용 + 건너뛰기 버튼.
 *
 * 장보기(장바구니 목록)와 요리(조리 순서)가 함께 쓴다.
 * 보여 줄 내용만 children 으로 다르게 넣는다.
 *
 * 마일스톤 1 토큰만 사용: text-button / text-body / min-h-touch / rounded-card
 */
export default function CountdownPanel({ secondsLeft, children, skipLabel, onSkip }) {
  return (
    <>
      <Card>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-button font-bold text-ink">남은 시간</span>
          {/* 숫자는 크게. 초읽기를 스크린리더가 매초 읽으면 방해되므로 소리로는 알리지 않는다. */}
          <span className="text-[2.5em] font-bold leading-none text-primary-700">
            {secondsLeft}초
          </span>
        </div>

        <div className="mt-6">{children}</div>
      </Card>

      <p className="mt-5 text-body text-muted">
        다 외우셨으면 기다리지 않고 넘어가셔도 됩니다.
      </p>
      <div className="mt-3">
        <BigButton variant="secondary" onClick={onSkip} aria-label={skipLabel}>
          다 외웠어요
        </BigButton>
      </div>
    </>
  )
}
