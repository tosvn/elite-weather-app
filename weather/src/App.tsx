import { useEffect, useState } from 'react'
import './App.css'

interface WeatherState {
  temperature: number | null
  feelsLike: number | null
  humidity: number | null
  windSpeed: number | null
  precipitation: number | null
  condition: string | null
  symbol: string | null
  city: string
  loading: boolean
  error: string | null
  cityNotFound: boolean
  forecast: DailyForecast[]
}

interface DailyForecast {
  date: string
  minimum: number
  maximum: number
}

const defaultCity = 'Lagos'

function getWeatherDescription(code: number, isDay: number): string {
  if (code === 0) return isDay ? 'Clear sky' : 'Clear night'
  if (code === 1) return isDay ? 'Mainly clear' : 'Mostly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code === 85 || code === 86) return 'Snow showers'
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm'
  return 'Conditions unavailable'
}

function getWeatherSymbol(code: number, isDay: number): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code === 1) return isDay ? '🌤️' : '🌙'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code === 85 || code === 86) return '🌨️'
  if (code === 95 || code === 96 || code === 99) return '⛈️'
  return '🌡️'
}

async function fetchWeatherForCity(city: string): Promise<WeatherState | null> {
  const geocodeResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  )

  if (!geocodeResponse.ok) {
    throw new Error('Could not find that city.')
  }

  const geocodeData = await geocodeResponse.json()
  const location = geocodeData.results?.[0]

  if (!location) {
    return null
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=auto`,
  )

  if (!weatherResponse.ok) {
    throw new Error('Could not fetch the current weather.')
  }

  const weatherData = await weatherResponse.json()
  const current = weatherData.current
  const temperature = current?.temperature_2m

  if (temperature === undefined || temperature === null) {
    throw new Error('Temperature data was not returned.')
  }

  const weatherCode = current.weather_code
  const daily = weatherData.daily
  const forecast: DailyForecast[] = daily?.time?.slice(1, 4).map(
    (date: string, index: number) => ({
      date,
      minimum: daily.temperature_2m_min[index],
      maximum: daily.temperature_2m_max[index],
    }),
  ) ?? []

  if (forecast.length !== 3 || forecast.some((day) => day.minimum == null || day.maximum == null)) {
    throw new Error('Three-day forecast data was not returned.')
  }

  return {
    temperature,
    feelsLike: current.apparent_temperature ?? null,
    humidity: current.relative_humidity_2m ?? null,
    windSpeed: current.wind_speed_10m ?? null,
    precipitation: current.precipitation ?? null,
    condition:
      typeof weatherCode === 'number'
        ? getWeatherDescription(weatherCode, current.is_day ?? 1)
        : 'Conditions unavailable',
    symbol:
      typeof weatherCode === 'number'
        ? getWeatherSymbol(weatherCode, current.is_day ?? 1)
        : '🌡️',
    city: location.name,
    loading: false,
    error: null,
    cityNotFound: false,
    forecast,
  }
}

function App() {
  const [query, setQuery] = useState(defaultCity)
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    feelsLike: null,
    humidity: null,
    windSpeed: null,
    precipitation: null,
    condition: null,
    symbol: null,
    city: defaultCity,
    loading: true,
    error: null,
    cityNotFound: false,
    forecast: [],
  })

  useEffect(() => {
    const loadDefaultWeather = async () => {
      try {
        const result = await fetchWeatherForCity(defaultCity)
        setWeather(
          result ?? {
            temperature: null,
            feelsLike: null,
            humidity: null,
            windSpeed: null,
            precipitation: null,
            condition: null,
            symbol: null,
            city: defaultCity,
            loading: false,
            error: null,
            cityNotFound: true,
            forecast: [],
          },
        )
      } catch (error) {
        setWeather((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : 'Something went wrong.',
        }))
      }
    }

    loadDefaultWeather()
  }, [])

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setWeather({
        temperature: null,
        feelsLike: null,
        humidity: null,
        windSpeed: null,
        precipitation: null,
        condition: null,
        symbol: null,
        city: defaultCity,
        loading: false,
        error: 'Please enter a city name.',
        cityNotFound: false,
        forecast: [],
      })
      return
    }

    setWeather({
      temperature: null,
      feelsLike: null,
      humidity: null,
      windSpeed: null,
      precipitation: null,
      condition: null,
      symbol: null,
      city: trimmedQuery,
      loading: true,
      error: null,
      cityNotFound: false,
      forecast: [],
    })

    try {
      const result = await fetchWeatherForCity(trimmedQuery)
      setWeather(
        result ?? {
          temperature: null,
          feelsLike: null,
          humidity: null,
          windSpeed: null,
          precipitation: null,
          condition: null,
          symbol: null,
          city: trimmedQuery,
          loading: false,
          error: null,
          cityNotFound: true,
          forecast: [],
        },
      )
    } catch (error) {
      setWeather({
        temperature: null,
        feelsLike: null,
        humidity: null,
        windSpeed: null,
        precipitation: null,
        condition: null,
        symbol: null,
        city: trimmedQuery,
        loading: false,
        error: error instanceof Error ? error.message : 'Something went wrong.',
        cityNotFound: false,
        forecast: [],
      })
    }
  }

  return (
    <main className="app-shell">
      <section className="weather-card">
        <p
          className="eyebrow"
        >
          Current weather
        </p>

        <form onSubmit={handleSearch} className="weather-search">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city"
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        <h1 className="city-name">{weather.city}</h1>

        {weather.loading ? (
          <p style={{ margin: 0, color: '#475569', fontSize: '1.1rem' }}>Loading...</p>
        ) : weather.cityNotFound ? (
          <p role="status" style={{ margin: 0, color: '#475569', fontSize: '1.1rem' }}>
            We couldn’t find “{weather.city}”. Check the spelling or try another city.
          </p>
        ) : weather.error ? (
          <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '1.1rem' }}>
            {weather.error}
          </p>
        ) : (
          <>
            <p
              aria-label={weather.condition ?? 'Current weather condition'}
              className="weather-condition"
            >
              <span aria-hidden="true" className="weather-symbol">
                {weather.symbol}
              </span>
              {weather.condition}
            </p>
            <p className="temperature">
              {weather.temperature}°C
            </p>
            <dl className="weather-details">
              <div>
                <dt><span aria-hidden="true">🌡️ </span>Feels like</dt>
                <dd>
                  {weather.feelsLike === null ? '—' : `${weather.feelsLike}°C`}
                </dd>
              </div>
              <div>
                <dt><span aria-hidden="true">💧 </span>Humidity</dt>
                <dd>
                  {weather.humidity === null ? '—' : `${weather.humidity}%`}
                </dd>
              </div>
              <div>
                <dt><span aria-hidden="true">💨 </span>Wind</dt>
                <dd>
                  {weather.windSpeed === null ? '—' : `${weather.windSpeed} km/h`}
                </dd>
              </div>
              <div>
                <dt><span aria-hidden="true">🌧️ </span>Precipitation</dt>
                <dd>
                  {weather.precipitation === null ? '—' : `${weather.precipitation} mm`}
                </dd>
              </div>
            </dl>
            <section
              aria-label="Three-day temperature forecast"
              className="forecast-section"
            >
              <h2 className="forecast-title">
                Next 3 days
              </h2>
              <div className="forecast-grid">
                {weather.forecast.map((day) => (
                  <div key={day.date} className="forecast-day">
                    <span className="forecast-weekday">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: 'short',
                      })}
                    </span>
                    <div className="forecast-temperatures">
                      <span aria-label={`Low ${day.minimum} degrees Celsius`} style={{ whiteSpace: 'nowrap' }}>
                        ↓ {day.minimum}°
                      </span>
                      <span aria-label={`High ${day.maximum} degrees Celsius`} style={{ whiteSpace: 'nowrap' }}>
                        ↑ {day.maximum}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default App
