import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { generateClientAnalysis, sendFollowUp, parsePartialJSON } from '../utils/geminiClient'
import '../churn_styles.css'

import dashboardData from '../data/dashboard_data.json'

const mockClients = dashboardData.top_50_clientes_riesgo.map(c => ({
  cliente_id: c.customer_id,
  churn_score: c.prob_churn,
  territorio: c.territorio,
  subchannel: c.subchannel,
  tamano: c.tamanio,
  razones: c.razones,
  propuestas: c.propuestas,
  nivel_riesgo: c.nivel_riesgo,
  num_coolers: c.num_coolers,
  num_doors: c.num_doors
}))

// Basic Markdown parser for streaming AI analysis
function renderMarkdown(text) {
  if (!text) return null

  // Split by line
  const lines = text.split('\n')
  return lines.map((line, index) => {
    const trimmed = line.trim()
    // 1. Heading 3
    if (trimmed.startsWith('### ')) {
      return <h3 key={index} className="markdown-h3">{parseBold(trimmed.substring(4))}</h3>
    }
    // 2. Heading 4
    if (trimmed.startsWith('#### ')) {
      return <h4 key={index} className="markdown-h4">{parseBold(trimmed.substring(5))}</h4>
    }
    // 3. Blockquote
    if (trimmed.startsWith('> ')) {
      return <blockquote key={index} className="markdown-blockquote">{parseBold(trimmed.substring(2))}</blockquote>
    }
    // 4. Bullet list item
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      return <li key={index} className="markdown-li">{parseBold(trimmed.substring(2))}</li>
    }
    // 5. Empty line
    if (trimmed === '') {
      return <div key={index} className="markdown-spacer" style={{ height: '8px' }} />
    }
    // 6. Normal paragraph
    return <p key={index} className="markdown-p">{parseBold(line)}</p>
  })
}

function parseBold(text) {
  if (!text) return ""

  // Parse **bold** and *italics*
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

const formatMonthReadable = (mesStr) => {
  if (!mesStr) return 'N/A'
  const parts = mesStr.split('-')
  if (parts.length !== 2) return mesStr
  const months = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  }
  return `${months[parts[1]] || parts[1]} ${parts[0]}`
}

function ClientDetails() {
  const { clientId } = useParams()

  const [client, setClient] = useState(null)
  const [clientLoading, setClientLoading] = useState(true)
  const [clientError, setClientError] = useState(null)
  const [historyData, setHistoryData] = useState([])

  const [calling, setCalling] = useState(false)
  const [callStatus, setCallStatus] = useState('')

  const handleStartCall = async () => {
    setCalling(true)
    setCallStatus('Iniciando llamada de retención...')
    try {
      const response = await fetch('http://localhost:3001/api/call/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        setCallStatus('Llamada en curso 📞')
      } else {
        setCallStatus(`Error: ${data.error || 'No se pudo iniciar'}`)
      }
    } catch (err) {
      setCallStatus('Error de conexión ⚠️')
    } finally {
      setCalling(false)
      setTimeout(() => setCallStatus(''), 6000)
    }
  }
  // IA analysis state
  const [analysisText, setAnalysisText] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)

  // Follow-up chat states
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatStreamingText, setChatStreamingText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Fetch client details and trend history from the backend API
  useEffect(() => {
    const fetchClientData = async () => {
      setClientLoading(true)
      setClientError(null)
      try {
        const response = await fetch(`http://localhost:3001/api/clients/${clientId}`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()

        const mappedClient = {
          cliente_id: data.client.customer_id,
          churn_score: data.client.prob_churn,
          territorio: data.client.territory_d || data.client.territorio || '',
          subchannel: data.client.comercial_subchannel_d || data.client.subchannel || '',
          tamano: data.client.rtm_customer_size_d || data.client.tamanio || data.client.tamano || '',
          razones: data.client.razones || '',
          propuestas: data.client.propuestas || '',
          nivel_riesgo: data.client.nivel_riesgo || '',
          num_coolers: data.client.num_coolers,
          num_doors: data.client.num_doors
        }

        const mappedHistory = data.history.map(h => ({
          mes: String(h.calmonth).replace(/^(\d{4})(\d{2})$/, '$1-$2'),
          num_transacciones: h.num_transacciones,
          uni_boxes_sold_m: h.uni_boxes_sold_m,
          prob_churn: h.prob_churn
        }))

        setClient(mappedClient)
        setHistoryData(mappedHistory)
      } catch (err) {
        console.warn("Backend API request for client details failed, falling back to local static JSON database:", err.message)
        const localClient = mockClients.find((c) => c.cliente_id === clientId)
        if (localClient) {
          setClient(localClient)

          // Generate history from mock trend
          const historyKey = localClient.cliente_id.length > 12 ? localClient.cliente_id.substring(0, 12) + "..." : localClient.cliente_id
          const realHistory = dashboardData.historiales_top20_riesgo[historyKey]
          const mockTrend = realHistory ? realHistory.map(h => ({
            mes: h.mes,
            num_transacciones: h.transacciones,
            uni_boxes_sold_m: h.cajas,
            prob_churn: localClient.churn_score
          })) : [
            { mes: '2025-10', num_transacciones: 52, uni_boxes_sold_m: 110, prob_churn: localClient.churn_score * 0.9 },
            { mes: '2025-11', num_transacciones: 48, uni_boxes_sold_m: 95, prob_churn: localClient.churn_score * 0.95 },
            { mes: '2025-12', num_transacciones: 42, uni_boxes_sold_m: 80, prob_churn: localClient.churn_score * 0.98 },
            { mes: '2026-01', num_transacciones: 34, uni_boxes_sold_m: 65, prob_churn: localClient.churn_score }
          ]
          setHistoryData(mockTrend)
        } else {
          setClientError(`El cliente con ID "${clientId}" no está registrado.`)
        }
      } finally {
        setClientLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  // Clear analysis and chat state when switching clients
  useEffect(() => {
    setAnalysisText('')
    setChatHistory([])
    setChatStreamingText('')
    setAnalysisError(null)
  }, [clientId])

  const fetchAnalysis = async () => {
    if (!client || analysisLoading) return
    setAnalysisLoading(true)
    setAnalysisError(null)
    setAnalysisText('')

    try {
      const stream = await generateClientAnalysis(client, historyData)
      const reader = stream.getReader()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += value
        setAnalysisText(accumulated)
      }
    } catch (err) {
      console.error('Error running Gemini analysis:', err)
      setAnalysisError(err.message || 'Error al conectar con la API de Gemini.')
    } finally {
      setAnalysisLoading(false)
    }
  }

  // Scroll to bottom of chat automatically on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatStreamingText])

  const handleSendChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput
    setChatInput('')
    await runChatQuery(userMessage)
  }

  // Handle suggestion prompt button click
  const handleStarterClick = async (starterText) => {
    if (chatLoading) return
    await runChatQuery(starterText)
  }

  const runChatQuery = async (messageText) => {
    // Append user turn
    const newHistory = [...chatHistory, { sender: 'user', text: messageText }]
    setChatHistory(newHistory)
    setChatLoading(true)
    setChatStreamingText('Pensando...')

    try {
      const stream = await sendFollowUp(messageText, chatHistory, client)
      const reader = stream.getReader()
      let accumulated = ""
      setChatStreamingText("") // Clear loader placeholder

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += value
        setChatStreamingText(accumulated)
      }

      // Append model turn
      setChatHistory(prev => [...prev, { sender: 'model', text: accumulated }])
      setChatStreamingText('')
    } catch (err) {
      console.error('Chat error:', err)
      setChatHistory(prev => [...prev, { sender: 'model', text: `Error: ${err.message || 'Error al enviar mensaje.'}` }])
      setChatStreamingText('')
    } finally {
      setChatLoading(false)
    }
  }

  if (clientLoading) {
    return (
      <div id="details-page" className="details-loading" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>Cargando detalles del cliente...</p>
      </div>
    )
  }

  if (clientError || !client) {
    return (
      <div id="details-page" className="details-error">
        <h1>Cliente no encontrado</h1>
        <p>{clientError || `El cliente con ID "${clientId}" no está registrado.`}</p>
        <Link to="/churn" className="back-link">← Volver a Churn</Link>
      </div>
    )
  }

  const riskPercent = Math.round(client.churn_score * 100)

  let riskClass = 'risk-low'
  let riskLabel = 'Bajo'
  if (riskPercent >= 75) {
    riskClass = 'risk-high'
    riskLabel = 'Alto'
  } else if (riskPercent >= 50) {
    riskClass = 'risk-medium'
    riskLabel = 'Moderado'
  }

  const riskFactors = client.razones
    ? client.razones.split('|').map((reason) => {
      const trimmed = reason.trim()
      let status = 'stable'
      const lower = trimmed.toLowerCase()
      if (lower.includes('caída') || lower.includes('perdió') || lower.includes('riesgo') || lower.includes('abandono') || lower.includes('disminuy')) {
        status = 'negative'
      } else if (lower.includes('nuevo') || lower.includes('no consolidado')) {
        status = 'warning'
      }
      return { label: trimmed, change: '', status }
    })
    : [
      { label: 'Frecuencia de compra', change: '-32% en los últimos 30 días', status: riskPercent >= 50 ? 'negative' : 'stable' },
      { label: 'Volumen medio de pedido', change: '-15% esta semana', status: riskPercent >= 75 ? 'negative' : 'stable' },
      { label: 'Visitas del asesor comercial', change: 'Sin contacto presencial por 45 días', status: 'warning' },
    ]

  const recommendations = client.propuestas
    ? client.propuestas.split('|').map(p => p.trim())
    : [
      'Programar llamada inmediata del asesor comercial para evaluar la satisfacción de la tienda.',
      'Ofrecer un cupón de descuento especial del 15% en el próximo pedido de abasto.',
      'Presentar promociones personalizadas basadas en su subcanal comercial.'
    ]

  // Circular gauge config
  const radius = 55
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (riskPercent / 100) * circumference

  // Dynamic calculations for ML metrics and context
  const activeHistory = historyData.filter(h => (h.uni_boxes_sold_m || 0) > 0)

  const latestPeriod = activeHistory.length > 0
    ? formatMonthReadable(activeHistory[activeHistory.length - 1].mes)
    : (historyData.length > 0 ? formatMonthReadable(historyData[historyData.length - 1].mes) : 'N/A')

  const maxBoxes = historyData.length > 0 ? Math.max(...historyData.map(h => h.uni_boxes_sold_m || 0)) : 0
  const lastActiveBoxes = activeHistory.length > 0 ? activeHistory[activeHistory.length - 1].uni_boxes_sold_m || 0 : 0

  const getCajasChange = () => {
    if (maxBoxes === 0) return '0%'
    const change = ((lastActiveBoxes - maxBoxes) / maxBoxes) * 100
    const roundedChange = Math.round(change)
    const finalChange = roundedChange === 0 ? 0 : roundedChange
    const sign = finalChange > 0 ? '+' : ''
    return `${sign}${finalChange}%`
  }
  const cajasChange = getCajasChange()

  const coolers = client.num_coolers !== undefined ? client.num_coolers : 0

  const monthsInRisk = historyData.filter(h => h.prob_churn >= 0.50).length

  const lastNormalPeriod = [...historyData]
    .reverse()
    .find(h => h.prob_churn < 0.50)?.mes
  const lastNormalPeriodStr = lastNormalPeriod
    ? formatMonthReadable(lastNormalPeriod)
    : 'No registrado'

  let shownSalesEvidence = false
  let shownCoolersEvidence = false
  let shownRiskEvidence = false

  const riskFactorsWithEvidence = riskFactors.map((factor) => {
    let label = factor.label
    const lower = label.toLowerCase()
    let evidence = null
    let emoji = '⚠️'

    if ((lower.includes('caída') || lower.includes('caida') || lower.includes('disminuy') || lower.includes('compra') || lower.includes('volumen') || lower.includes('venta') || lower.includes('transacciones')) && !shownSalesEvidence) {
      emoji = '📉'
      shownSalesEvidence = true
      evidence = (
        <div className="factor-evidence" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="evidence-primary" style={{ fontSize: '15px', color: 'var(--black)', fontWeight: '500' }}>
            De <strong style={{ fontSize: '16.5px', fontWeight: 'bold' }}>{Math.round(maxBoxes)}</strong> cajas → <strong style={{ fontSize: '16.5px', fontWeight: 'bold' }}>{Math.round(lastActiveBoxes)}</strong> cajas
          </span>
          <span className="evidence-secondary" style={{ fontSize: '12.5px', color: 'var(--pink)', fontWeight: 'bold' }}>
            en su último pedido ({cajasChange})
          </span>
        </div>
      )
    } else if ((lower.includes('enfriador') || lower.includes('cooler')) && !shownCoolersEvidence) {
      emoji = '🧊'
      shownCoolersEvidence = true
      evidence = (
        <div className="factor-evidence">
          <span className="evidence-primary" style={{ fontSize: '14.5px', color: '#555', fontWeight: '500' }}>
            Enfriadores actuales: <strong style={{ fontSize: '15.5px', fontWeight: 'bold', color: 'var(--black)' }}>{coolers}</strong>
          </span>
        </div>
      )
    } else if ((lower.includes('pequeño') || lower.includes('pequeñ') || lower.includes('abandono') || lower.includes('riesgo') || lower.includes('tamaño') || lower.includes('tamanio') || lower.includes('nuevo') || lower.includes('consolidado')) && !shownRiskEvidence) {
      emoji = '⚠️'
      shownRiskEvidence = true
      label = 'Sin actividad prolongada'
      const periodText = lastNormalPeriodStr === 'No registrado'
        ? 'Sin período normal registrado'
        : `Último período normal: ${lastNormalPeriodStr}`
      evidence = (
        <div className="factor-evidence">
          <span className="evidence-primary" style={{ fontSize: '14.5px', color: '#555', fontWeight: '500' }}>
            <strong style={{ fontSize: '15.5px', fontWeight: 'bold', color: 'var(--black)' }}>{monthsInRisk}</strong> {monthsInRisk === 1 ? 'mes' : 'meses'} consecutivos en riesgo · {periodText}
          </span>
        </div>
      )
    }

    return { ...factor, label, emoji, evidence }
  })

  const hasActiveAlerts = riskPercent < 50 && riskFactorsWithEvidence.some(f => f.evidence !== null)

  return (
    <div id="details-page">
      <div className="details-header">
        <Link to="/churn" className="back-link">← Volver a Churn</Link>
        <h1>Desglose de Cliente</h1>
      </div>

      {/* Top Row: Store Profile, ML Factors, and Recommendations side-by-side */}
      <div className="details-top-grid">

        {/* Profile Card */}
        <div className="details-card-panel client-profile-card">
          <h2>{riskPercent >= 75 ? 'Cliente en Riesgo Crítico' : riskPercent >= 50 ? 'Cliente en Riesgo Moderado' : 'Cliente con Riesgo Bajo'}</h2>

          {/* Circular Risk Gauge */}
          <div className="gauge-wrapper">
            <div className="risk-gauge-container">
              <svg height={radius * 2} width={radius * 2} className="risk-gauge-svg">
                <circle
                  stroke="rgba(0, 0, 0, 0.05)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  style={{ backgroundColor: 'transparent' }}
                />
                <circle
                  className={`risk-gauge-circle ${riskClass}`}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset, backgroundColor: 'transparent' }}
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div className="risk-gauge-value">
                <span className="risk-gauge-num">{riskPercent}%</span>
                <span className="risk-gauge-label">Riesgo</span>
              </div>
            </div>
            <div className="risk-label-badge-wrapper">
              <span className={`risk-label-badge ${riskClass}`}>Riesgo {riskLabel}</span>
            </div>
          </div>

          <div className="client-info-table">
            <div className="info-row">
              <span className="info-label">ID de Cliente</span>
              <span className="info-value" title={client.cliente_id} style={{ cursor: 'help' }}>
                {client.cliente_id.length > 15 ? client.cliente_id.substring(0, 8) + '...' : client.cliente_id}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Territorio</span>
              <span className="info-value">{client.territorio}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Subcanal</span>
              <span className="info-value">{client.subchannel}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tamaño</span>
              <span className="info-value">{client.tamano}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Meses Registrados</span>
              <span className="info-value">{historyData.length} meses</span>
            </div>
          </div>
        </div>

        {/* ML Factors Card */}
        <div className="details-card-panel ml-factors-card">
          <div>
            <h3>Factores del Modelo ML</h3>
            {hasActiveAlerts && (
              <div className="alert-banner" style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1.5px solid #ffeeba',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: '1.4'
              }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span>El modelo detectó señales de alerta recientes no reflejadas en el score actual.</span>
              </div>
            )}
            <div className="factors-list">
              {riskFactorsWithEvidence.map((factor, index) => (
                <div key={index} className="factor-item" style={{ padding: '12px 0' }}>
                  <div className="factor-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span className="factor-emoji" style={{ fontSize: '16px', marginTop: '1px' }}>{factor.emoji}</span>
                    <span className="factor-name" style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--black)' }}>{factor.label}</span>
                  </div>
                  {factor.evidence && (
                    <div className="factor-evidence-container" style={{ paddingLeft: '24px', marginTop: '6px' }}>
                      {factor.evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Static recommendations */}
        <div className="details-card-panel recommendations-panel">
          <div>
            <h3>Recomendaciones Preventivas</h3>
            <ul className="rec-list">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="retention-call-container">
            <button
              type="button"
              className={`call-retention-btn ${calling ? 'loading' : ''}`}
              onClick={handleStartCall}
              disabled={calling}
            >
              <span>📞</span>
              {calling ? 'Iniciando...' : 'Iniciar llamada de retención'}
            </button>
            {callStatus && (
              <p className="call-status-msg">
                {callStatus}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Gemini Analysis & Live Chat side-by-side */}
      <div className="details-bottom-grid">

        {/* IA Analysis Box */}
        <div className="details-card-panel gemini-analysis-box">
          <div className="gemini-box-header">
            <span className="gemini-sparkle-icon">✨</span>
            <h3>Análisis Inteligente por IA</h3>
          </div>

          {analysisLoading && !analysisText && (
            <div className="gemini-loading">
              <div className="spinner"></div>
              <span>Consultando Gemini, ejecutando razonamiento (Thinking) y buscando competencia en Google Search (Grounding)...</span>
            </div>
          )}

          {analysisError && (
            <div className="gemini-error">⚠️ {analysisError}</div>
          )}

          {analysisText && (
            <div className="gemini-analysis-content" style={{ padding: '4px 0' }}>
              <div className="analysis-text-markdown">
                {renderMarkdown(analysisText)}
              </div>
            </div>
          )}

          {!analysisText && !analysisLoading && (
            <div className="gemini-trigger-container">
              <button
                type="button"
                className="gemini-trigger-btn"
                onClick={fetchAnalysis}
              >
                Generar Análisis Inteligente
              </button>
              <p className="gemini-trigger-hint">
                Haz clic para iniciar el análisis con Google Search (Grounding) y Razonamiento (Thinking)
              </p>
            </div>
          )}
        </div>

        {/* IA Follow-up Chat Box */}
        <div className="details-card-panel gemini-chat-box">
          <div className="gemini-box-header">
            <span className="gemini-sparkle-icon">💬</span>
            <h3>Consultas de Seguimiento en Vivo</h3>
          </div>
          <p className="chat-intro">Pregúntale a Gemini ideas de negociación, competidores regionales o estrategias de retención específicas para esta tienda.</p>

          <div className="chat-messages-list">
            {chatHistory.length === 0 && !chatStreamingText && (
              <div className="chat-empty-state-container">
                <button
                  type="button"
                  className="chat-starter-btn-large"
                  onClick={() => handleStarterClick("¿Qué más puedo saber?")}
                >
                  ¿Qué más puedo saber?
                </button>
                <p className="chat-starter-hint">Haz clic para iniciar el análisis interactivo de Gemini</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender === 'user' ? 'msg-user' : 'msg-model'}`}>
                <span className="msg-avatar">{msg.sender === 'user' ? 'Comercial' : 'Gemini'}</span>
                <div className="msg-text">
                  {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                </div>
              </div>
            ))}
            {chatStreamingText && (
              <div className="chat-message msg-model streaming">
                <span className="msg-avatar">Gemini</span>
                <div className="msg-text">
                  {renderMarkdown(chatStreamingText)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {(chatHistory.length > 0 || chatStreamingText) && (
            <form onSubmit={handleSendChat} className="chat-form">
              <input
                type="text"
                placeholder="Ej. ¿Qué descuento especial le puedo ofrecer y cómo lo justifico?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="chat-input-field"
                aria-label="Consulta a Gemini"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="chat-submit-btn">
                Consultar
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

export default ClientDetails
