import { useState } from 'react'

interface WeatherState {
  temperature: number | null
  city: string
  loading: boolean
  error: string | null
}

const defaultCity = 'Lagos'

async function fetchWeatherForCity(city: string): Promise<WeatherState> {
  const geocodeResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  )

  if (!geocodeResponse.ok) {
    throw new Error('Could not find that city.')
  }

  const geocodeData = await geocodeResponse.json()
  const location = geocodeData.results?.[0]

  if (!location) {
    throw new Error('City not found.')
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m&timezone=auto`,
  )

  if (!weatherResponse.ok) {
    throw new Error('Could not fetch the current weather.')
  }

  const weatherData = await weatherResponse.json()
  const temperature = weatherData.current?.temperature_2m

  if (temperature === undefined || temperature === null) {
    throw new Error('Temperature data was not returned.')
  }

  return {
    temperature,
    city: location.name,
    loading: false,
    error: null,
  }
}

function App() {
  const [query, setQuery] = useState(defaultCity)
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    city: defaultCity,
    loading: true,
    error: null,
  })

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setWeather({
        temperature: null,
        city: defaultCity,
        loading: false,
        error: 'Please enter a city name.',
      })
      return
    }

    setWeather({
      temperature: null,
      city: trimmedQuery,
      loading: true,
      error: null,
    })

    try {
      const result = await fetchWeatherForCity(trimmedQuery)
      setWeather(result)
    } catch (error) {
      setWeather({
        temperature: null,
        city: trimmedQuery,
        loading: false,
        error: error instanceof Error ? error.message : 'Something went wrong.',
      })
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f3f4f6',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section
        style={{
          width: 'min(90vw, 440px)',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
          padding: '2rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.8rem',
          }}
        >
          Current weather
        </p>

        <form onSubmit={handleSearch} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city"
            style={{
              flex: 1,
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.8rem 1.1rem',
              border: 'none',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        <h1 style={{ margin: '1.5rem 0 1rem', color: '#0f172a', fontSize: '2.2rem' }}>
          {weather.city}
        </h1>

        {weather.loading ? (
          <p style={{ margin: 0, color: '#475569', fontSize: '1.1rem' }}>Loading...</p>
        ) : weather.error ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '1.1rem' }}>{weather.error}</p>
        ) : (
          <p style={{ margin: 0, color: '#0f172a', fontSize: '3rem', fontWeight: 700 }}>
            {weather.temperature}°C
          </p>
        )}
      </section>
    </main>
  )
}

export default App
