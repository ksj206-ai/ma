/**
 * 하나를 고르는 선택지 버튼 (온보딩 나이대 · 예/아니오 등).
 *
 * 선택 여부는 hover 가 아니라 색 + 테두리 + 체크 표시로 명시한다 (SPEC 3.1).
 * 테두리는 항상 4px, 색만 바뀌므로 고를 때 칸 크기가 움직이지 않는다.
 */
export default function ChoiceButton({ selected, children, onClick, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'flex w-full min-h-touch items-center justify-between gap-4',
        'rounded-card border-4 px-6 py-4 text-left text-button font-bold',
        'transition-colors duration-150',
        selected
          ? 'border-primary-700 bg-primary-100 text-primary-800'
          : 'border-line bg-surface text-ink',
        className,
      ].join(' ')}
      {...rest}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border-4 text-[1.1em]',
          selected
            ? 'border-primary-700 bg-primary-700 text-white'
            : 'border-line bg-surface text-transparent',
        ].join(' ')}
      >
        ✓
      </span>
    </button>
  )
}
