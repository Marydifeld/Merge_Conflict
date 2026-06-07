import React, { useState, useEffect } from 'react'
import Searchbar from '../Components/Searchbar'
import ClientCard from '../Components/ClientCard'
import '../churn_styles.css'

function Churn() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTerritorio, setSelectedTerritorio] = useState('')
  const [selectedSubchannel, setSelectedSubchannel] = useState('')
  const [selectedSize, setSelectedSize] = useState('All')
  const [selectedRiskTier, setSelectedRiskTier] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 5

  // API states
  const [clients, setClients] = useState([])
  const [totalClients, setTotalClients] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [territorios, setTerritorios] = useState([])
  const [subchannels, setSubchannels] = useState([])

  // Search input debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Fetch unique filter values on mount
  useEffect(() => {
    let active = true
    async function fetchFilters() {
      try {
        const res = await fetch('/api/clients/filters')
        if (!res.ok) throw new Error('Failed to fetch filters')
        const data = await res.json()
        if (active) {
          setTerritorios(data.territorios || [])
          setSubchannels(data.subchannels || [])
        }
      } catch (err) {
        console.error('Error fetching filters:', err)
      }
    }
    fetchFilters()
    return () => {
      active = false
    }
  }, [])

  // Fetch paginated and filtered clients
  useEffect(() => {
    let active = true
    async function fetchClients() {
      setLoading(true)
      setClients([])
      try {
        const queryParams = new URLSearchParams({
          q: debouncedSearchTerm,
          territorio: selectedTerritorio,
          subchannel: selectedSubchannel,
          tamano: selectedSize,
          risk: selectedRiskTier,
          page: currentPage,
          limit: itemsPerPage,
        })
        const res = await fetch(`/api/clients/search?${queryParams.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch clients')
        const data = await res.json()
        if (active) {
          setClients(data.clients || [])
          setTotalClients(data.total || 0)
          setTotalPages(data.totalPages || 1)
        }
      } catch (err) {
        console.error('Error fetching clients:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    fetchClients()
    return () => {
      active = false
    }
  }, [debouncedSearchTerm, selectedTerritorio, selectedSubchannel, selectedSize, selectedRiskTier, currentPage])

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

  // Pagination calculations for showing count range
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * itemsPerPage

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
              {territorios.map((t) => (
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
              {subchannels.map((s) => (
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
        {loading ? (
          'Loading clients...'
        ) : totalClients > 0 ? (
          `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalClients)} of ${totalClients} clients`
        ) : (
          'No clients found matching the selected filters.'
        )}
      </div>

      <div className="client-list">
        {loading && clients.length === 0 ? (
          <div className="loading-clients">Loading clients...</div>
        ) : clients.length > 0 ? (
          clients.map((client) => (
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
              disabled={activePage === 1 || loading}
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
              disabled={activePage === totalPages || loading}
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