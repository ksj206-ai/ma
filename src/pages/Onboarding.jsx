import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import BigButton from '../components/BigButton.jsx'
import ChoiceButton from '../components/ChoiceButton.jsx'
import StepProgress from '../components/StepProgress.jsx'
import WellnessNotice from '../components/WellnessNotice.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { isKoreanVoiceAvailable } from '../lib/speech.js'

/*
 * 온보딩 — 한 화면에 한 가지만 묻는다 (SPEC 3장 인지 부하 최소화).
 *
 *  - 총 4단계, 매 화면에 "4단계 중 N단계" 표시.
 *  - 언제든 뒤로 갈 수 있고, 무엇을 고르든(비워 두어도) 경고나 벌점이 없다.
 *  - 하단 탭 없이 단독으로 보여준다.
 *  - 3·4단계 선택은 그 자리에서 화면에 바로 반영해 결과를 눈으로 확인하게 한다.
 */

const AGE_BANDS = ['60대 이하', '70대', '80대', '90대 이상']
const TOTAL_STEPS = 4

export default function Onboarding() {
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const setPreference = useAppStore((state) => state.setPreference)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [ageBand, setAgeBand] = useState(null)
  const [largeText, setLargeText] = useState(false)
  const [voice, setVoice] = useState(false)

  const koreanVoiceAvailable = isKoreanVoiceAvailable()

  // 글자 크기·음성은 고른 즉시 화면에 반영한다(저장은 마지막에).
  function chooseLargeText(value) {
    setLargeText(value)
    setPreference('largeText', value)
  }

  function chooseVoice(value) {
    setVoice(value)
    setPreference('voice', value)
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }
    completeOnboarding({ name, ageBand, largeText, voice })
    navigate('/home', { replace: true })
  }

  function goBack() {
    if (step > 1) setStep(step - 1)
  }

  // Enter 로도 다음 단계로 넘어가도록 각 단계를 form 으로 감싼다.
  function handleSubmit(event) {
    event.preventDefault()
    goNext()
  }

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <StepProgress current={step} total={TOTAL_STEPS} />

        <form onSubmit={handleSubmit} noValidate>
          {step === 1 ? (
            <section>
              <PageTitle description="편하게 부를 이름을 알려 주세요. 비워 두셔도 괜찮습니다.">
                어떻게 불러 드릴까요?
              </PageTitle>
              <label htmlFor="onboarding-name" className="mb-3 block text-button font-bold text-ink">
                이름
              </label>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="예: 김영자"
                className={[
                  'w-full min-h-touch rounded-card border-4 border-line bg-surface',
                  'px-6 py-4 text-button text-ink placeholder:text-muted/70',
                ].join(' ')}
              />
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <PageTitle description="훈련을 알맞게 준비하는 데만 씁니다. 건너뛰셔도 됩니다.">
                연세가 어떻게 되시나요?
              </PageTitle>
              <div className="space-y-4">
                {AGE_BANDS.map((band) => (
                  <ChoiceButton
                    key={band}
                    selected={ageBand === band}
                    onClick={() => setAgeBand(ageBand === band ? null : band)}
                  >
                    {band}
                  </ChoiceButton>
                ))}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <PageTitle description="고르시면 이 화면의 글자부터 바로 커집니다. 언제든 설정에서 바꿀 수 있어요.">
                글자를 크게 볼까요?
              </PageTitle>
              <div className="space-y-4">
                <ChoiceButton selected={largeText} onClick={() => chooseLargeText(true)}>
                  네, 크게 볼게요
                </ChoiceButton>
                <ChoiceButton selected={!largeText} onClick={() => chooseLargeText(false)}>
                  아니요, 지금이 좋아요
                </ChoiceButton>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <PageTitle description="글을 소리로 읽어 드립니다. 언제든 설정에서 바꿀 수 있어요.">
                소리로도 안내해 드릴까요?
              </PageTitle>
              <div className="space-y-4">
                <ChoiceButton selected={voice} onClick={() => chooseVoice(true)}>
                  네, 소리로 들을게요
                </ChoiceButton>
                <ChoiceButton selected={!voice} onClick={() => chooseVoice(false)}>
                  아니요, 화면만 볼게요
                </ChoiceButton>
              </div>
              {!koreanVoiceAvailable ? (
                <p className="mt-4 text-body text-muted">
                  지금 쓰시는 기기에는 한국어 음성이 없어 소리가 나오지 않을 수 있습니다.
                  그래도 화면 안내는 그대로 보실 수 있어요.
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-4">
            {step > 1 ? (
              <BigButton
                variant="secondary"
                onClick={goBack}
                aria-label="이전 단계로 돌아가기"
                className="flex-1 basis-40"
              >
                뒤로
              </BigButton>
            ) : null}

            <BigButton
              type="submit"
              aria-label={step === TOTAL_STEPS ? '설정을 저장하고 시작하기' : '다음 단계로 이동'}
              className="flex-1 basis-40"
            >
              {step === TOTAL_STEPS ? '시작하기' : '다음'}
            </BigButton>
          </div>
        </form>

        <WellnessNotice className="mt-10" />
      </main>
    </div>
  )
}
