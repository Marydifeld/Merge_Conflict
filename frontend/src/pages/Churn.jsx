import React, { useState } from 'react'
import Searchbar from '../Components/Searchbar'
import ClientCard from '../Components/ClientCard'
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

function Churn() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTerritorio, setSelectedTerritorio] = useState('')
  const [selectedSubchannel, setSelectedSubchannel] = useState('')
  const [selectedSize, setSelectedSize] = useState('All')
  const [selectedRiskTier, setSelectedRiskTier] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 5

  // Extract unique values dynamically for selects
  const uniqueTerritorios = Array.from(new Set(mockClients.map(c => c.territorio))).sort()
  const uniqueSubchannels = Array.from(new Set(mockClients.map(c => c.subchannel))).sort()

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

  const filteredClients = mockClients.filter((client) => {
    // 1. Search term on cliente_id
    const matchesSearch = client.cliente_id.toLowerCase().includes(searchTerm.toLowerCase())

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
              {['All', 'Mini', 'Mediano', 'Grande'].map((size) => (
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

      <div className="client-list">
        {paginatedClients.length > 0 ? (
          paginatedClients.map((client) => (
            <ClientCard key={client.cliente_id} client={client} />
          ))
        ) : (
          <div className="no-results">No clients found matching the selected filters.</div>
        )}
      </div>

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

