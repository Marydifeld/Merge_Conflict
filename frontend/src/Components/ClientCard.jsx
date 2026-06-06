function ClientCard({ client }) {
  return (
    <div className="client-card">
      <div className="client-avatar" aria-hidden="true" />
      <div className="client-info">
        <span className="client-name">{client.name}</span>
        <span className="client-risk">Risk: {client.risk + '%'}</span>
      </div>
    </div>
  )
}

export default ClientCard
