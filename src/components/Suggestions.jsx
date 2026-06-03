import React from 'react'

export default function Suggestions({ suggestions, choosePlace, placeLabel }) {
  return (
    <div className="suggestions d-flex flex-wrap gap-2 mb-4">
      {suggestions.map((item) => (
        <button
          className="btn btn-sm btn-light"
          key={`${item.id}-${item.latitude}`}
          type="button"
          onClick={() => choosePlace(item)}
        >
          {placeLabel(item)}
        </button>
      ))}
    </div>
  )
}
