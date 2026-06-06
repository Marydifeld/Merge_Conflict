function Searchbar() {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Name"
        className="search-input"
        aria-label="Search by client name"
      />
      <button type="button" className="search-button" aria-label="Search">
        🔍
      </button>
    </div>
  )
}

export default Searchbar
