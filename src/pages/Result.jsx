import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatWon } from '../lib/recipes.js'
import { buildBridgeMissionText } from '../games/shoppingLogic.js'

/*
 * 훈련 결과 화면 (SPEC 5장 5번).
 *
 * 카피 원칙 (SPEC 4장 · 3장)
 *  - 잘한 것을 먼저, 크게. 틀린 개수를 강조하지 않는다.
 *  - 놓친 재료는 "이것도 있었어요" 정도로 부드럽게 알려 준다.
 *  - 점수를 의료적으로 해석하지 않는다. 백분율·판정 문구를 쓰지 않는다.
 *
 * 결과 값은 게임에서 라우터 state 로 넘어온다.
 * 새로고침이나 주소 직접 입력으로 state 없이 들어오면 훈련 목록으로 돌려보낸다.
 */
export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const addMission = useAppStore((state) => state.addMission)

  const [savedMissionText, setSavedMissionText] = useState(null)

  const result = location.state
  if (!result || !result.recipeName) {
    return <Navigate to="/training" replace />
  }

  const { recipeName, correct, missed, total, change } = result
  const bridgeText = buildBridgeMissionText(recipeName)

  // 격려 위주 카피. 하나도 못 맞혔을 때도 부정적으로 말하지 않는다.
  const headline =
    missed.length === 0
      ? '전부 찾으셨어요!'
      : correct.length > 0
        ? '잘하셨어요!'
        : '오늘도 해내셨어요!'

  function handleSaveBridge() {
    addMission(bridgeText)
    setSavedMissionText(bridgeText)
  }

  return (
    <>
      <PageTitle description={`${recipeName} 장보기를 마쳤습니다.`}>{headline}</PageTitle>

      <div className="space-y-5">
        <Card title="장바구니에 담으신 것">
          {correct.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {correct.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded-pill border-2 border-success bg-primary-50 px-5 py-3 text-button font-bold text-success"
                >
                  <span aria-hidden="true">✓</span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted">
              이번에는 목록이 좀 어려웠지요. 다시 하면 훨씬 수월해집니다.
            </p>
          )}

          <p className="mt-5 text-body text-muted">
            살 것 {total}가지 가운데 {correct.length}가지를 기억해 담으셨습니다.
          </p>
        </Card>

        {missed.length > 0 ? (
          <Card title="이것도 있었어요">
            <ul className="flex flex-wrap gap-3">
              {missed.map((name) => (
                <li
                  key={name}
                  className="rounded-pill border-2 border-line bg-surface px-5 py-3 text-button font-bold text-ink"
                >
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-body text-muted">
              다음에 장 보실 때 한 번 떠올려 보세요.
            </p>
          </Card>
        ) : null}

        {change ? (
          <Card title="계산대">
            <p className="text-body text-ink">
              {change.isCorrect
                ? `거스름돈 ${formatWon(change.answer)}, 정확히 맞히셨어요.`
                : `거스름돈은 ${formatWon(change.answer)}이었어요. 셈이 빠르시네요, 다음엔 더 수월할 거예요.`}
            </p>
            <p className="mt-3 text-body text-muted">
              {formatWon(change.total)}어치를 사고 {formatWon(change.bill)}을 냈습니다.
            </p>
          </Card>
        ) : null}

        {/* 실행 브리지 — 훈련을 실제 생활로 잇는다 (SPEC 6.2) */}
        <Card
          title="오늘 실제로 해보기"
          description="훈련에서 그친 것이 아니라, 오늘 진짜로 해보시면 더 좋습니다."
        >
          <p className="text-[1.4em] font-bold leading-snug text-ink">{bridgeText}</p>

          {savedMissionText ? (
            <p className="mt-5 flex items-center gap-2 text-body font-bold text-success">
              <span aria-hidden="true">✓</span>
              <span>홈 화면의 오늘 미션에 담아 두었습니다.</span>
            </p>
          ) : (
            <div className="mt-6">
              <BigButton
                onClick={handleSaveBridge}
                aria-label="오늘 실제로 해보기 미션을 홈에 담기"
              >
                오늘의 미션으로 담기
              </BigButton>
            </div>
          )}
        </Card>

        <BigButton
          onClick={() => navigate('/training/shopping', { replace: true })}
          aria-label="장보기 미션 한 번 더 하기"
        >
          한 번 더
        </BigButton>

        <BigButton
          variant="secondary"
          onClick={() => navigate('/home')}
          aria-label="홈 화면으로 이동"
        >
          홈으로
        </BigButton>
      </div>
    </>
  )
}
