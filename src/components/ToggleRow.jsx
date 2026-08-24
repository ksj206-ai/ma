/**
 * 설정 토글 한 줄.
 *
 * 접근성 규칙(SPEC 3.1)
 *  - 실제 <button role="switch"> 이므로 Tab 이동 + Enter/Space 실행이 된다.
 *  - 켜짐/꺼짐은 hover 가 아니라 색 + 테두리 + 글자("켜짐"/"꺼짐") 세 가지로 동시에 표시한다.
 *    (색만으로 구분하면 색각 이상이 있는 사용자가 알 수 없다)
 *  - 테두리 두께는 항상 4px 로 두고 색만 바꾼다. 눌렀을 때 칸이 흔들리지 않게 하기 위해서다.
 */
export default function ToggleRow({ id, label, description, checked, onChange }) {
  const labelId = `${id}-label`
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="min-w-[12rem] flex-1">
        <p id={labelId} className="text-button font-bold text-ink">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-1 text-body text-muted">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onClick={() => onChange(!checked)}
        className={[
          'inline-flex min-h-touch min-w-[8rem] items-center justify-center gap-3',
          'rounded-pill border-4 px-6 py-3 text-button font-bold',
          'transition-colors duration-150',
          checked
            ? 'border-primary-800 bg-primary-600 text-white'
            : 'border-line bg-surface text-muted',
        ].join(' ')}
      >
        <span aria-hidden="true" className="text-[1.4em] leading-none">
          {checked ? '●' : '○'}
        </span>
        <span>{checked ? '켜짐' : '꺼짐'}</span>
      </button>
    </div>
  )
}
