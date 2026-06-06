function Searchbar() {
    return (
        <div className="search-container">
            <input
                type="text"
                placeholder="Search..."
                className="search-input"
            />

            <button className="search-button">
            🔍
            </button>
        </div>
    )
}

export default Searchbar;