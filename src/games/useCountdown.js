import { useEffect, useRef, useState } from 'react'

/**
 * 노출 단계의 남은 시간 카운트다운.
 *
 * 장보기(장바구니 목록)와 요리(조리 순서)가 똑같이 쓴다.
 * 화면을 벗어나면 반드시 멈춘다 — 하단 탭으로 도중에 나가도 앱이 깨지면 안 되기 때문이다.
 *
 * 1초마다 숫자를 하나씩 빼는 대신 "끝나는 시각"을 정해 두고 남은 시간을 계산한다.
 * 그렇게 하지 않으면 첫 틱이 늦거나 한 번 밀릴 때 노출 시간이 그만큼 길어지는데,
 * 노출 시간은 난이도 레버(SPEC 6.1 / 6.2)라 설정값과 실제가 어긋나면 안 된다.
 */
export function useCountdown(seconds, active, onDone) {
  const [secondsLeft, setSecondsLeft] = useState(seconds)

  // onDone 은 렌더마다 새로 만들어진다. 타이머를 다시 걸지 않으려고 ref 로 들고 있는다.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!active) {
      setSecondsLeft(seconds)
      return undefined
    }

    const endsAt = Date.now() + seconds * 1000
    setSecondsLeft(seconds)

    // 끝나는 시점은 타이머 간격에 좌우되지 않도록 따로 정확히 잡는다.
    const finish = setTimeout(() => {
      clearInterval(ticker)
      setSecondsLeft(0)
      onDoneRef.current()
    }, seconds * 1000)

    // 화면의 숫자만 촘촘히 갱신한다. 실제 남은 시간에서 계산하므로 밀리지 않는다.
    const ticker = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }, 200)

    return () => {
      clearTimeout(finish)
      clearInterval(ticker)
    }
  }, [active, seconds])

  return secondsLeft
}
