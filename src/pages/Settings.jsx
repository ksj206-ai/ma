import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ToggleRow from '../components/ToggleRow.jsx'
import WellnessNotice from '../components/WellnessNotice.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { useUiStore } from '../store/useUiStore.js'
import { isKoreanVoiceAvailable, speak, subscribeToVoices } from '../lib/speech.js'

/*
 * 설정 — 글자 크게 / 음성 안내 / 데이터 초기화 / 웰니스 고지.
 *
 * 토글 값은 profile 에 저장되므로 새로고침해도 유지된다 (storage.js).
 * 데이터 초기화는 되돌릴 수 없으므로 반드시 확인 단계를 한 번 거친다.
 */
export default function Settings() {
  const navigate = useNavigate()
  const largeText = useUiStore((state) => state.largeText)
  const voice = useUiStore((state) => state.voice)
  const setPreference = useAppStore((state) => state.setPreference)
  const resetAll = useAppStore((state) => state.resetAll)

  const [confirmingReset, setConfirmingReset] = useState(false)
  // 브라우저가 음성 목록을 늦게 채우는 경우가 있어 준비되면 다시 확인한다.
  const [voiceAvailable, setVoiceAvailable] = useState(isKoreanVoiceAvailable)

  useEffect(() => {
    setVoiceAvailable(isKoreanVoiceAvailable())
    return subscribeToVoices(() => setVoiceAvailable(isKoreanVoiceAvailable()))
  }, [])

  function handleReset() {
    resetAll()
    navigate('/onboarding', { replace: true })
  }

  return (
    <>
      <PageTitle>설정</PageTitle>

      <div className="space-y-5">
        <Card title="화면과 소리">
          <div className="space-y-8">
            <ToggleRow
              id="setting-large-text"
              label="글자 크게"
              description="화면의 글자와 버튼이 1.25배 커집니다."
              checked={largeText}
              onChange={(next) => setPreference('largeText', next)}
            />

            <div className="border-t-2 border-line pt-8">
              <ToggleRow
                id="setting-voice"
                label="음성 안내"
                description="안내 문구를 소리로 읽어 드립니다."
                checked={voice}
                onChange={(next) => setPreference('voice', next)}
              />

              <div className="mt-5">
                <BigButton
                  variant="secondary"
                  onClick={() => speak('안녕하세요. 오늘도 두뇌 건강 습관을 이어가 볼까요?')}
                  aria-label="음성 안내 소리 테스트"
                >
                  음성 테스트
                </BigButton>

                {!voiceAvailable ? (
                  <p className="mt-3 text-body text-muted" role="status">
                    지금 쓰시는 기기에는 한국어 음성이 없어 소리가 나오지 않습니다.
                    화면 안내는 그대로 보실 수 있습니다.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="데이터 초기화"
          description="이름과 그동안의 활동 기록을 모두 지우고 처음부터 다시 시작합니다."
        >
          {confirmingReset ? (
            <div className="rounded-card border-4 border-danger bg-surface p-5">
              <p className="text-button font-bold text-ink">
                정말 모두 지울까요?
              </p>
              <p className="mt-2 text-body text-muted">
                한 번 지우면 되돌릴 수 없습니다. 그대로 두시려면 &ldquo;아니요&rdquo;를 눌러 주세요.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <BigButton
                  variant="secondary"
                  onClick={() => setConfirmingReset(false)}
                  aria-label="초기화하지 않고 돌아가기"
                  className="flex-1 basis-40"
                >
                  아니요, 그대로 둘게요
                </BigButton>
                <BigButton
                  variant="danger"
                  onClick={handleReset}
                  aria-label="데이터를 모두 지우고 처음부터 시작하기"
                  className="flex-1 basis-40"
                >
                  네, 모두 지울게요
                </BigButton>
              </div>
            </div>
          ) : (
            <BigButton
              variant="danger"
              onClick={() => setConfirmingReset(true)}
              aria-label="데이터 초기화 시작하기"
            >
              데이터 초기화
            </BigButton>
          )}
        </Card>

        {/* 웰니스 고지 — 앱 하단 공통 영역에도 있지만 설정에 한 번 더 명시한다 (SPEC 4장) */}
        <Card title="안내">
          <WellnessNotice />
        </Card>

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
