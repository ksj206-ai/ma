/**
 * 진행 단계 표시 — "4단계 중 2단계" (SPEC 3장 인지 부하 최소화).
 * 글자로 먼저 알려 주고, 막대는 보조 표시라서 스크린리더에서는 감춘다.
 */
export default function StepProgress({ current, total }) {
  return (
    <div className="mb-6">
      <p
        className="text-body font-bold text-primary-700"
        role="status"
        aria-live="polite"
      >
        {total}단계 중 {current}단계
      </p>
      <ol className="mt-3 flex gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <li
            key={index}
            className={[
              'h-3 flex-1 rounded-pill',
              index < current ? 'bg-primary-600' : 'bg-primary-100',
            ].join(' ')}
          />
        ))}
      </ol>
    </div>
  )
}
