import React from 'react'

export default function SearchPanel({
  query,
  setQuery,
  onSearch,
  onUseLocation,
  loading,
  locating,
}) {
  return (
    <form className="search-panel" onSubmit={onSearch}>
      <div className="search-group">
        <input
          className="form-control search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city"
          aria-label="Search city"
        />

        <button
          className="btn btn-search-inside"
          type="submit"
          disabled={loading}
          aria-label="Search"
        >
          <i className="bi bi-search"></i>
        </button>
      </div>

      <button
        className="btn location-btn"
        type="button"
        onClick={onUseLocation}
        disabled={locating}
        title="Use current location"
        aria-label="Use current location"
      >
        <i
          className={`bi ${
            locating ? 'bi-arrow-repeat spin' : 'bi-geo-alt'
          }`}
        ></i>
      </button>
    </form>
  )
}