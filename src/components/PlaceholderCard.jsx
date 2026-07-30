/**
 * 마일스톤 1 전용 임시 안내 카드. 이후 마일스톤에서 실제 내용으로 대체된다.
 */
export default function PlaceholderCard({ children }) {
  return (
    <div className="rounded-card border-2 border-line bg-surface p-6 shadow-card">
      <p className="text-body text-muted">{children}</p>
    </div>
  )
}
