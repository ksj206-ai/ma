/**
 * 화면 제목. 항상 32px(text-title) 이상이며 화면당 하나만 쓴다.
 */
export default function PageTitle({ children, description }) {
  return (
    <header className="mb-6">
      <h1 className="text-title font-bold text-primary-800">{children}</h1>
      {description ? (
        <p className="mt-2 text-body text-muted">{description}</p>
      ) : null}
    </header>
  )
}
