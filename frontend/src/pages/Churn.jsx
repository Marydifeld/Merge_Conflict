import React, { useState, useEffect } from 'react'
import Searchbar from '../Components/Searchbar'
import ClientCard from '../Components/ClientCard'
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
  nivel_riesgo: c.nivel_riesgo
}))

const mapDbClientToFrontend = (c) => ({
  cliente_id: c.customer_id,
  churn_score: c.prob_churn,
  territorio: c.territory_d || c.territorio || '',
  subchannel: c.comercial_subchannel_d || c.subchannel || '',
  tamano: c.rtm_customer_size_d || c.tamanio || c.tamano || '',
  razones: c.razones || '',
  propuestas: c.propuestas || '',
  nivel_riesgo: c.nivel_riesgo || '',
  estado: c.estado || '',
  num_coolers: c.num_coolers,
  num_doors: c.num_doors
})

function Churn() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTerritorio, setSelectedTerritorio] = useState('')
  const [selectedSubchannel, setSelectedSubchannel] = useState('')
  const [selectedSize, setSelectedSize] = useState('All')
  const [selectedRiskTier, setSelectedRiskTier] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const itemsPerPage = 5

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      // Build dynamic query parameters for search and filtering in MongoDB
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('q', searchTerm.trim())
      if (selectedTerritorio) params.append('territory', selectedTerritorio)
      if (selectedSubchannel) params.append('subchannel', selectedSubchannel)
      if (selectedSize !== 'All') params.append('size', selectedSize)
      if (selectedRiskTier !== 'All') params.append('risk', selectedRiskTier)

      const url = `http://localhost:3001/api/clients/search?${params.toString()}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      
      // Map the returned database records to the frontend client format
      const mapped = data.map(mapDbClientToFrontend)
      setClients(mapped)
    } catch (err) {
      console.warn("Backend API request failed, falling back to local static JSON database:", err.message)
      // Fallback: load and filter locally from mockClients
      setClients(mockClients)
    } finally {
      setLoading(false)
    }
  }

  // Fetch clients from MongoDB via API on mount and whenever search term or filters change
  useEffect(() => {
    // Add a simple debounce to avoid hammering the database on every keystroke or selection change
    const timer = setTimeout(() => {
      fetchClients()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedTerritorio, selectedSubchannel, selectedSize, selectedRiskTier])

  // Complete set of unique territories and subchannels from MongoDB
  const uniqueTerritorios = [
    'Aguascalientes',   'Chihuahua',
    'Comarca Lagunera', 'Culiacan',
    'Delicias',         'Durango',
    'Guadalajara',      'Hermosillo',
    'Jalisco',          'Juarez',
    'La Paz',           'Laredo',
    'Matamoros',        'Mazatlan',
    'Mesa Central',     'Mexicali',
    'Monclova',         'Monterrey',
    'Nuevo Leon',       'Obregon',
    'Piedras negras',   'Reynosa',
    'Saltillo',         'San Luis Potosi',
    'Zacatecas'
  ]

  const uniqueSubchannels = [
    'Abarrotes y bodegas',
    'Farmacia',
    'Hogares',
    'Kiosco',
    'Licorería',
    'Mayorista',
    'Minisuper',
    'Panadería',
    'Proximidad',
    'Tienda orgánica',
    'Tiendas de carne/pollo/pescado',
    'Tortillería',
    'Verdulería'
  ]

  // Helper functions to update filters and reset pagination page
  const handleSearchChange = (val) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }
  const handleTerritorioChange = (val) => {
    setSelectedTerritorio(val)
    setCurrentPage(1)
  }
  const handleSubchannelChange = (val) => {
    setSelectedSubchannel(val)
    setCurrentPage(1)
  }
  const handleSizeChange = (val) => {
    setSelectedSize(val)
    setCurrentPage(1)
  }
  const handleRiskTierChange = (val) => {
    setSelectedRiskTier(val)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedTerritorio('')
    setSelectedSubchannel('')
    setSelectedSize('All')
    setSelectedRiskTier('All')
    setCurrentPage(1)
  }

  const filteredClients = clients.filter((client) => {
    // 1. Search term on cliente_id (runs locally if fell back to mockClients)
    const matchesSearch = client.cliente_id.toLowerCase().startsWith(searchTerm.toLowerCase())

    // 2. Territory filter
    const matchesTerritorio = !selectedTerritorio || client.territorio === selectedTerritorio

    // 3. Subchannel filter
    const matchesSubchannel = !selectedSubchannel || client.subchannel === selectedSubchannel

    // 4. Size filter
    const matchesSize = selectedSize === 'All' || client.tamano === selectedSize

    // 5. Risk tier filter
    const riskPercent = client.churn_score * 100
    let matchesRisk = true
    if (selectedRiskTier === 'High') {
      matchesRisk = riskPercent >= 75
    } else if (selectedRiskTier === 'Medium') {
      matchesRisk = riskPercent >= 50 && riskPercent < 75
    } else if (selectedRiskTier === 'Low') {
      matchesRisk = riskPercent < 50
    }

    return matchesSearch && matchesTerritorio && matchesSubchannel && matchesSize && matchesRisk
  })

  // Pagination calculations
  const totalClients = filteredClients.length
  const totalPages = Math.ceil(totalClients / itemsPerPage) || 1
  const activePage = Math.min(currentPage, totalPages)

  const startIndex = (activePage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div id="churn-page">
      <div className="churn-header">
        <h1>Churn Lookup</h1>
        <p>Analyze client risk rates and filter by demographics</p>
      </div>

      <Searchbar searchTerm={searchTerm} onSearchChange={handleSearchChange} />

      <div className="filters-section">
        <div className="filter-group select-group">
          <div className="select-wrapper">
            <label htmlFor="territorio-select">Territory</label>
            <select
              id="territorio-select"
              value={selectedTerritorio}
              onChange={(e) => handleTerritorioChange(e.target.value)}
            >
              <option value="">All Territories</option>
              {uniqueTerritorios.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <label htmlFor="subchannel-select">Subchannel</label>
            <select
              id="subchannel-select"
              value={selectedSubchannel}
              onChange={(e) => handleSubchannelChange(e.target.value)}
            >
              <option value="">All Subchannels</option>
              {uniqueSubchannels.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group button-group-container">
          <div className="button-group-wrapper">
            <span className="group-label">Size</span>
            <div className="pill-group">
              {['All', 'Mini', 'Pequeño', 'Mediano', 'Grande'].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`pill-button ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="button-group-wrapper">
            <span className="group-label">Risk Level</span>
            <div className="pill-group">
              {[
                { label: 'All', value: 'All' },
                { label: 'High (>75%)', value: 'High' },
                { label: 'Medium (50-75%)', value: 'Medium' },
                { label: 'Low (<50%)', value: 'Low' },
              ].map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  className={`pill-button ${selectedRiskTier === tier.value ? 'active' : ''}`}
                  onClick={() => handleRiskTierChange(tier.value)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(searchTerm || selectedTerritorio || selectedSubchannel || selectedSize !== 'All' || selectedRiskTier !== 'All') && (
          <button type="button" className="clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="results-count">
        Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalClients)} of {totalClients} clients
      </div>

      {loading && clients.length === 0 ? (
        <div className="clients-loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: '#666', fontSize: '14.5px' }}>Buscando clientes en MongoDB...</p>
        </div>
      ) : (
        <div className="client-list">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
              <ClientCard key={client.cliente_id} client={client} />
            ))
          ) : (
            <div className="no-results">No clients found matching the selected filters.</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-container">
          <span className="pagination-info">
            Page {activePage} of {totalPages}
          </span>
          <div className="pagination-arrows">
            <button
              type="button"
              className="pagination-btn"
              disabled={activePage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-label="Previous Page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ backgroundColor: 'transparent' }}
              >
                <polyline points="15 18 9 12 15 6" style={{ backgroundColor: 'transparent' }} />
              </svg>
            </button>
            <button
              type="button"
              className="pagination-btn"
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              aria-label="Next Page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ backgroundColor: 'transparent' }}
              >
                <polyline points="9 18 15 12 9 6" style={{ backgroundColor: 'transparent' }} />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Churn

