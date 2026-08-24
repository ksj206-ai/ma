/**
 * 본문 카드. 큰 카드 · 둥근 모서리 · 넉넉한 여백 (SPEC 10장).
 * 제목은 본문(20px)보다 큰 24px(text-button) 로 두어 훑어보기 쉽게 한다.
 */
export default function Card({ title, description, children, className = '', ...rest }) {
  return (
    <section
      className={[
        'rounded-card border-2 border-line bg-surface p-6 shadow-card',
        className,
      ].join(' ')}
      {...rest}
    >
      {title ? (
        <h2 className="text-button font-bold text-primary-800">{title}</h2>
      ) : null}
      {description ? (
        <p className={['text-body text-muted', title ? 'mt-2' : ''].join(' ')}>
          {description}
        </p>
      ) : null}
      {children ? (
        <div className={title || description ? 'mt-5' : ''}>{children}</div>
      ) : null}
    </section>
  )
}
