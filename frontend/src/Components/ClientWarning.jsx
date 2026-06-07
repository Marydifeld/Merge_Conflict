function ClientWarning({ client }) {
  return (
    <div className="client-card">
      <div className="client-info">
        <span className="client-name">{client.id}</span>
        <span className="client-risk">Risk: {client.riesgo + '%'}</span>
      </div>
    </div>
  )
}

export default ClientWarning;
