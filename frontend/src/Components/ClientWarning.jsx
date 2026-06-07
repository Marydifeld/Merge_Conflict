import { Link } from 'react-router-dom'
function ClientWarning({ client }) {
  return (
    <div className="client-card">
      <div className="client-info">
        <span className="client-name">{client.id.slice(0, 18) + "..."}</span>
        <span className="client-risk">Risk: {client.riesgo + '%'}</span>
      </div>
     
      <Link to={`/details/${client.id}`} className="view-more-link">
            Ver más
          </Link>
</div>
    
  )
}

export default ClientWarning;
