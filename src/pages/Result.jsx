import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import { useAppStore } from '../store/useAppStore.js'

/*
 * 훈련 결과 화면 (SPEC 5장 5번) — 모든 게임이 함께 쓴다.
 *
 * 게임마다 보여 줄 내용이 다르므로 게임별 분기를 두는 대신,
 * 게임이 "무엇을 보여 줄지"를 blocks 로 만들어 넘기고 여기서는 그리기만 한다.
 * 덕분에 게임이 늘어도 이 파일은 그대로 둘 수 있다.
 *
 *   { headline, recipeName, bridgeText, replayPath, blocks: [...] }
 *
 *   blocks 종류
 *     { kind:'chips',   title, tone:'good'|'plain', items:[], note?, emptyText? }
 *     { kind:'ordered', title, items:[], note? }
 *     { kind:'note',    title, lines:[] }
 *
 * 카피 원칙 (SPEC 4장 · 3장)
 *  - 잘한 것을 먼저, 크게. 틀린 개수를 강조하지 않는다.
 *  - 점수를 의료적으로 해석하지 않는다. 백분율·판정 문구를 쓰지 않는다.
 *
 * 결과 값은 게임에서 라우터 state 로 넘어온다.
 * 새로고침이나 주소 직접 입력으로 state 없이 들어오면 훈련 목록으로 돌려보낸다.
 */
export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const addMission = useAppStore((state) => state.addMission)

  const [savedMission, setSavedMission] = useState(false)

  const result = location.state
  if (!result || !result.bridgeText) {
    return <Navigate to="/training" replace />
  }

  const { headline, recipeName, bridgeText, replayPath, blocks = [] } = result

  function handleSaveBridge() {
    addMission(bridgeText)
    setSavedMission(true)
  }

  return (
    <>
      <PageTitle description={`${recipeName} 훈련을 마쳤습니다.`}>{headline}</PageTitle>

      <div className="space-y-5">
        {blocks.map((block, index) => (
          <ResultBlock key={index} block={block} />
        ))}

        {/* 실행 브리지 — 훈련을 실제 생활로 잇는다 (SPEC 6.2) */}
        <Card
          title="오늘 실제로 해보기"
          description="훈련에서 그친 것이 아니라, 오늘 진짜로 해보시면 더 좋습니다."
        >
          <p className="text-lead font-bold text-ink">{bridgeText}</p>

          {savedMission ? (
            <p className="mt-5 flex items-center gap-2 text-body font-bold text-success">
              <span aria-hidden="true" className="anim-check">✓</span>
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
          onClick={() => navigate(replayPath, { replace: true })}
          aria-label="이 훈련 한 번 더 하기"
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

function ResultBlock({ block }) {
  if (block.kind === 'chips') {
    const hasItems = block.items.length > 0
    return (
      <Card title={block.title}>
        {hasItems ? (
          <ul className="flex flex-wrap gap-3">
            {block.items.map((item) => (
              <li
                key={item}
                className={[
                  'flex items-center gap-2 rounded-pill border-2 px-5 py-3 text-button font-bold',
                  // 'good' 은 초록 테두리 + 초록 글자 + 체크로 구분한다.
                  // 원래는 bg-primary-50(파란 틴트)을 깔았는데, 초록 글자 아래에 파란 면이
                  // 깔린 유일한 조합이라 다른 화면과 색 계열이 어긋났다. 초록 틴트로 바꾸면
                  // 대비가 7.13:1 에서 6.76:1 로 떨어져 AAA 를 못 지키므로 면은 비워 둔다.
                  block.tone === 'good'
                    ? 'border-success bg-surface text-success'
                    : 'border-line bg-surface text-ink',
                ].join(' ')}
              >
                {block.tone === 'good' ? <span aria-hidden="true">✓</span> : null}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted">{block.emptyText}</p>
        )}
        {block.note ? <p className="mt-5 text-body text-muted">{block.note}</p> : null}
      </Card>
    )
  }

  if (block.kind === 'ordered') {
    return (
      <Card title={block.title}>
        <ol className="space-y-4">
          {block.items.map((item, index) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-card border-2 border-line bg-surface px-4 py-4"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-primary-600 text-body font-bold text-white"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 break-keep break-words text-body font-bold text-ink">
                {item}
              </span>
            </li>
          ))}
        </ol>
        {block.note ? <p className="mt-5 text-body text-muted">{block.note}</p> : null}
      </Card>
    )
  }

  return (
    <Card title={block.title}>
      {block.lines.map((line) => (
        <p key={line} className="mt-2 break-keep text-body text-ink first:mt-0">
          {line}
        </p>
      ))}
    </Card>
  )
}
