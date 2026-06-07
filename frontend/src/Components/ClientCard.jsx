import { Link } from 'react-router-dom'

function ClientCard({ client }) {
  const riskPercent = Math.round(client.churn_score * 100)

  // Calculate initials from the encrypted store ID
  const getInitials = (id) => {
    if (!id) return ''
    const parts = id.split('_')
    if (parts.length > 1 && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return id.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(client.cliente_id)

  // Set risk class based on severity
  let riskClass = 'risk-low'
  if (riskPercent >= 75) {
    riskClass = 'risk-high'
  } else if (riskPercent >= 50) {
    riskClass = 'risk-medium'
  }

  return (
    <div className="client-card">
      <div className={`client-avatar ${riskClass}`}>
        {initials}
      </div>
      <div className="client-details">
        <div className="client-header-info">
          <span className="client-name">{client.cliente_id.length > 20 ? client.cliente_id.substring(0, 12) + '...' : client.cliente_id}</span>
          <span className={`client-risk-value ${riskClass}`}>{riskPercent}% Risk</span>
        </div>
        
        {/* Risk progress bar */}
        <div className="risk-progress-container">
          <div 
            className={`risk-progress-bar ${riskClass}`} 
            style={{ width: `${riskPercent}%` }}
            role="progressbar"
            aria-valuenow={riskPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>

        {/* Metadata badges and View More Link */}
        <div className="client-footer">
          <div className="client-badges">
            <span className="badge badge-territory">{client.territorio}</span>
            <span className="badge badge-subchannel">{client.subchannel}</span>
            <span className="badge badge-size">{client.tamano}</span>
          </div>
          <Link to={`/details/${client.cliente_id}`} className="view-more-link">
            Ver más
          </Link>
        </div>
      </div>
    </div>
  )
}


export default ClientCard

