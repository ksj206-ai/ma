/**
 * 웰니스 고지 (SPEC 4장).
 * 문구는 SPEC 에 적힌 그대로여야 하므로 한 곳에서만 정의하고 두 화면이 같이 쓴다.
 * (앱 하단 공통 영역 + 설정 화면)
 */
export const WELLNESS_NOTICE =
  '이 앱은 건강한 생활습관을 돕는 웰니스 서비스이며, 의료적 진단·치료를 대체하지 않습니다.'

export default function WellnessNotice({ className = '' }) {
  return (
    <p
      role="note"
      className={[
        'rounded-card border-2 border-primary-200 bg-primary-50 px-5 py-4',
        'text-body text-primary-800',
        className,
      ].join(' ')}
    >
      {WELLNESS_NOTICE}
    </p>
  )
}
