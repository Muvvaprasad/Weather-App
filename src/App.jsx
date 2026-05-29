import { useEffect, useState } from 'react'

const weatherCodes = {
  0: ['Clear sky', 'bi-sun-fill'],
  1: ['Mainly clear', 'bi-sun'],
  2: ['Partly cloudy', 'bi-cloud-sun'],
  3: ['Overcast', 'bi-clouds'],
  45: ['Fog', 'bi-cloud-fog2'],
  48: ['Rime fog', 'bi-cloud-fog2'],
  51: ['Light drizzle', 'bi-cloud-drizzle'],
  53: ['Drizzle', 'bi-cloud-drizzle'],
  55: ['Heavy drizzle', 'bi-cloud-drizzle-fill'],
  61: ['Light rain', 'bi-cloud-rain'],
  63: ['Rain', 'bi-cloud-rain-heavy'],
  65: ['Heavy rain', 'bi-cloud-rain-heavy-fill'],
  71: ['Light snow', 'bi-cloud-snow'],
  73: ['Snow', 'bi-cloud-snow'],
  75: ['Heavy snow', 'bi-snow2'],
  80: ['Rain showers', 'bi-cloud-rain'],
  81: ['Showers', 'bi-cloud-rain-heavy'],
  82: ['Heavy showers', 'bi-cloud-rain-heavy-fill'],
  95: ['Thunderstorm', 'bi-cloud-lightning-rain'],
  96: ['Thunderstorm', 'bi-cloud-lightning-rain-fill'],
  99: ['Hailstorm', 'bi-cloud-hail'],
}

const defaultPlace = {
  name: 'Hyderabad',
  country: 'India',
  admin1: 'Telangana',
  latitude: 17.385,
  longitude: 78.4867,
}

function describeWeather(code) {
  return weatherCodes[code] ?? ['Weather update', 'bi-cloud']
}

function formatHour(value) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    hour12: true,
  }).format(new Date(value))
}

function formatDay(value) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function placeLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

async function fetchWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) {
    throw new Error('Unable to load forecast. Please try again.')
  }
  return response.json()
}

async function searchPlaces(query) {
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  })

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!response.ok) {
    throw new Error('Search failed. Please try another city.')
  }

  const data = await response.json()
  return data.results ?? []
}

function App() {
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState(defaultPlace)
  const [weather, setWeather] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchWeather(place)
      .then((data) => {
        if (active) {
          setWeather(data)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [place])

  const currentDetails = weather?.current ? describeWeather(weather.current.weather_code) : null
  const currentHourIndex = weather?.hourly?.time.findIndex((time) => time >= weather.current.time) ?? 0
  const hourlyForecast = weather?.hourly
    ? weather.hourly.time
        .map((time, index) => ({
          time,
          temperature: Math.round(weather.hourly.temperature_2m[index]),
          code: weather.hourly.weather_code[index],
          rain: weather.hourly.precipitation_probability[index],
        }))
        .slice(Math.max(currentHourIndex, 0), Math.max(currentHourIndex, 0) + 12)
    : []
  const weeklyForecast = weather?.daily
    ? weather.daily.time.map((time, index) => ({
        time,
        high: Math.round(weather.daily.temperature_2m_max[index]),
        low: Math.round(weather.daily.temperature_2m_min[index]),
        code: weather.daily.weather_code[index],
        rain: weather.daily.precipitation_probability_max[index],
        wind: Math.round(weather.daily.wind_speed_10m_max[index]),
      }))
    : []

  function choosePlace(nextPlace) {
    setLoading(true)
    setError('')
    setPlace(nextPlace)
  }

  async function handleSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setSuggestions([])

    try {
      const results = await searchPlaces(trimmed)
      if (!results.length) {
        throw new Error('No matching location found.')
      }
      choosePlace(results[0])
      setSuggestions(results.slice(1))
      setQuery('')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Location detection is not supported in this browser.')
      return
    }

    setLocating(true)
    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPlace({
          name: 'Current location',
          country: '',
          admin1: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setSuggestions([])
        setLocating(false)
      },
      () => {
        setError('Location permission was blocked or unavailable.')
        setLocating(false)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <main className="app-shell">
      <section className="container py-4 py-lg-5">
        <div className="weather-toolbar d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between mb-4">
          <div>
            <p className="eyebrow mb-1">Live forecast</p>
            <h1 className="h2 mb-0">Weather App</h1>
          </div>

          <form className="search-panel d-flex gap-2" onSubmit={handleSearch}>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search" aria-hidden="true"></i>
              </span>
              <input
                className="form-control"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city"
                aria-label="Search city"
              />
            </div>
            <button className="btn btn-dark px-3" type="submit" disabled={loading}>
              Search
            </button>
            <button
              className="btn btn-outline-dark location-btn"
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              title="Use current location"
            >
              <i className={`bi ${locating ? 'bi-arrow-repeat spin' : 'bi-geo-alt'}`} aria-hidden="true"></i>
            </button>
          </form>
        </div>

        {error && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
            <span>{error}</span>
          </div>
        )}

        {suggestions.length > 0 && (
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
        )}

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
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
          </div>

          <div className="col-lg-7">
            <section className="forecast-section mb-4">
              <div className="section-heading">
                <h2>Hourly forecast</h2>
                <span>Next 12 hours</span>
              </div>
              <div className="hourly-strip">
                {hourlyForecast.map((item) => {
                  const [label, icon] = describeWeather(item.code)
                  return (
                    <article className="hour-card" key={item.time} title={label}>
                      <span>{formatHour(item.time)}</span>
                      <i className={`bi ${icon}`} aria-hidden="true"></i>
                      <strong>{item.temperature} deg</strong>
                      <small>{item.rain}% rain</small>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <h2>Weekly forecast</h2>
                <span>7 days</span>
              </div>
              <div className="week-list">
                {weeklyForecast.map((item) => {
                  const [label, icon] = describeWeather(item.code)
                  return (
                    <article
                      className="day-row"
                      key={item.time}
                      tabIndex="0"
                    >
                      <div className="day-name">
                        <strong>{formatDay(item.time)}</strong>
                        <span>{label}</span>
                      </div>
                      <i className={`bi ${icon}`} aria-hidden="true"></i>
                      <div className="day-meta">
                        <span>{item.low} deg / {item.high} deg</span>
                        <small>{item.rain}% rain - {item.wind} km/h</small>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
