export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section>
      <h2 className="page-title">{title}</h2>
      <p className="subtitle">{description}</p>
      <p className="empty">Próximo sprint.</p>
    </section>
  )
}
