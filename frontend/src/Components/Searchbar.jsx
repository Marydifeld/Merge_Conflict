function Searchbar({ searchTerm, onSearchChange }) {
  return (
    <div className="search-container">
      <button type="button" className="search-icon-button" aria-label="Search">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="search-icon-svg"
          style={{ backgroundColor: 'transparent' }}
        >
          <circle cx="11" cy="11" r="8" style={{ backgroundColor: 'transparent' }} />
          <line x1="21" y1="21" x2="16.65" y2="16.65" style={{ backgroundColor: 'transparent' }} />
        </svg>
      </button>
      <input
        type="text"
        placeholder="Search by client name (e.g. Tienda, Abarrotes...)"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
        aria-label="Search by client name"
      />
    </div>
  )
}

export default Searchbar


