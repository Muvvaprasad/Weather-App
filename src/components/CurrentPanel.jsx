import React from 'react'

export default function CurrentPanel({ loading, weather, currentDetails, place, placeLabel }) {
  return (
    <section className="current-panel h-100">
      {loading && !weather ? (
        <div className="loading-state">
          <div className="spinner-border text-light" role="status"></div>
          <span>Loading forecast...</span>
        </div>
      ) : (
        weather &&
        currentDetails && (
          <>
            <div className="d-flex justify-content-between gap-3">
              <div>
                <p className="small text-white-50 mb-1">Now in</p>
                <h2 className="h4 mb-1">{placeLabel(place)}</h2>
                <p className="mb-0 text-white-50">{currentDetails[0]}</p>
              </div>
              <i className={`weather-icon bi ${currentDetails[1]}`} aria-hidden="true"></i>
            </div>

            <div className="temperature-row">
              <span>{Math.round(weather.current.temperature_2m)}</span>
              <sup>{weather.current_units.temperature_2m}</sup>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <div className="metric">
                  <i className="bi bi-thermometer-half" aria-hidden="true"></i>
                  <span>Feels like</span>
                  <strong>{Math.round(weather.current.apparent_temperature)}{weather.current_units.apparent_temperature}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="metric">
                  <i className="bi bi-moisture" aria-hidden="true"></i>
                  <span>Humidity</span>
                  <strong>{weather.current.relative_humidity_2m}%</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="metric">
                  <i className="bi bi-wind" aria-hidden="true"></i>
                  <span>Wind speed</span>
                  <strong>{Math.round(weather.current.wind_speed_10m)} {weather.current_units.wind_speed_10m}</strong>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </section>
  )
}
