import { useEffect, useState } from 'react'
// SearchPanel component exists but using inline search markup here
import Suggestions from './components/Suggestions'
import CurrentPanel from './components/CurrentPanel'
import HourlyStrip from './components/HourlyStrip'
import WeekList from './components/WeekList'

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
  // Normalize to local date to correctly detect Today/Tomorrow
  const dateStr = String(value).split('T')[0]
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) {
    return new Intl.DateTimeFormat('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  }
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((target - today) / (24 * 60 * 60 * 1000))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(target)
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
            <h1 className="h2 mb-0">SkyCast</h1>
          </div>

          <form className="search-panel d-flex gap-2" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                className="form-control"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city"
                aria-label="Search city"
              />
              <button className="btn btn-search-inside" type="submit" aria-label="Search">
                <i className="bi bi-search" aria-hidden="true"></i>
              </button>
            </div>
            <button
              className="btn location-btn"
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
          <Suggestions suggestions={suggestions} choosePlace={choosePlace} placeLabel={placeLabel} />
        )}

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <CurrentPanel loading={loading} weather={weather} currentDetails={currentDetails} place={place} placeLabel={placeLabel} />
          </div>

          <div className="col-lg-7">
            <section className="forecast-section mb-4">
              <div className="section-heading">
                <h2>Hourly forecast</h2>
                <span>Next 12 hours</span>
              </div>
              <HourlyStrip hourlyForecast={hourlyForecast} formatHour={formatHour} describeWeather={describeWeather} />
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <h2>Weekly forecast</h2>
                <span>7 days</span>
              </div>
              <WeekList weeklyForecast={weeklyForecast} formatDay={formatDay} describeWeather={describeWeather} />
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
