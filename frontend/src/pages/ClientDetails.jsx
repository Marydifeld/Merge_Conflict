import React from 'react'
import { useParams, Link } from 'react-router-dom'
import '../churn_styles.css'

const mockClients = [
  { cliente_id: 'Tienda_MX_9032', churn_score: 0.92, territorio: 'CDMX', subchannel: 'Tortillería', tamano: 'Mediano' },
  { cliente_id: 'Abarrotes_JAL_8841', churn_score: 0.74, territorio: 'Jalisco', subchannel: 'Mayorista', tamano: 'Grande' },
  { cliente_id: 'Kiosco_NLE_7720', churn_score: 0.58, territorio: 'Nuevo León', subchannel: 'Kiosco', tamano: 'Mini' },
  { cliente_id: 'Hogar_CDMX_1109', churn_score: 0.32, territorio: 'CDMX', subchannel: 'Hogares', tamano: 'Mediano' },
  { cliente_id: 'Tortilla_PUE_6542', churn_score: 0.88, territorio: 'Puebla', subchannel: 'Tortillería', tamano: 'Mediano' },
  { cliente_id: 'Depot_JAL_5510', churn_score: 0.45, territorio: 'Jalisco', subchannel: 'Mayorista', tamano: 'Grande' },
  { cliente_id: 'Tienda_NLE_4301', churn_score: 0.12, territorio: 'Nuevo León', subchannel: 'Kiosco', tamano: 'Mini' },
  { cliente_id: 'Miscelanea_EDO_9981', churn_score: 0.79, territorio: 'Estado de México', subchannel: 'Kiosco', tamano: 'Mini' },
  { cliente_id: 'Super_EDO_2210', churn_score: 0.61, territorio: 'Estado de México', subchannel: 'Mayorista', tamano: 'Grande' },
  { cliente_id: 'Tortilla_JAL_0029', churn_score: 0.25, territorio: 'Jalisco', subchannel: 'Tortillería', tamano: 'Mediano' },
]

function ClientDetails() {
  const { clientId } = useParams()
  
  // Find client matching parameter
  const client = mockClients.find((c) => c.cliente_id === clientId)

  if (!client) {
    return (
      <div id="details-page" className="details-error">
        <h1>Cliente no encontrado</h1>
        <p>El cliente con ID "{clientId}" no está registrado.</p>
        <Link to="/churn" className="back-link">← Volver a Churn</Link>
      </div>
    )
  }

  const riskPercent = Math.round(client.churn_score * 100)

  // Severity indicator classes
  let riskClass = 'risk-low'
  let riskLabel = 'Bajo'
  if (riskPercent >= 75) {
    riskClass = 'risk-high'
    riskLabel = 'Alto'
  } else if (riskPercent >= 50) {
    riskClass = 'risk-medium'
    riskLabel = 'Moderado'
  }

  // Mocked risk factor values from ML model
  const riskFactors = [
    { label: 'Frecuencia de compra', change: '-32% en los últimos 30 días', status: riskPercent >= 50 ? 'negative' : 'stable' },
    { label: 'Volumen medio de pedido', change: '-15% esta semana', status: riskPercent >= 75 ? 'negative' : 'stable' },
    { label: 'Visitas del asesor comercial', change: 'Sin contacto presencial por 45 días', status: 'warning' },
  ]

  // Preventative recommendation list
  const recommendations = [
    'Programar llamada inmediata del asesor comercial para evaluar la satisfacción de la tienda.',
    'Ofrecer un cupón de descuento especial del 15% en el próximo pedido de abasto.',
    'Presentar promociones personalizadas basadas en su subcanal comercial.'
  ]

  return (
    <div id="details-page">
      <div className="details-header">
        <Link to="/churn" className="back-link">← Volver a Churn</Link>
        <h1>Desglose de Cliente</h1>
      </div>

      <div className="details-card">
        <div className="details-title-section">
          <h2>{client.cliente_id}</h2>
          <span className={`risk-badge ${riskClass}`}>{riskPercent}% Churn Risk ({riskLabel})</span>
        </div>

        <div className="details-grid">
          {/* Demographic card */}
          <div className="details-section-box">
            <h3>Información General</h3>
            <div className="info-row">
              <span className="info-label">Territorio:</span>
              <span className="info-value">{client.territorio}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Subcanal:</span>
              <span className="info-value">{client.subchannel}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tamaño de Tienda:</span>
              <span className="info-value">{client.tamano}</span>
            </div>
          </div>

          {/* Model factors card */}
          <div className="details-section-box">
            <h3>Factores del Modelo ML</h3>
            <div className="factors-list">
              {riskFactors.map((factor, index) => (
                <div key={index} className="factor-item">
                  <span className="factor-name">{factor.label}</span>
                  <span className={`factor-change ${factor.status}`}>{factor.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action recommendations */}
        <div className="details-section-box recommendations-box">
          <h3>Recomendaciones Preventivas</h3>
          <ul className="rec-list">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ClientDetails
