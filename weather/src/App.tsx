import { useEffect, useState } from 'react'

interface WeatherState {
  temperature: number | null
  city: string
  loading: boolean
  error: string | null
}

function App() {
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    city: 'Lagos',
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchLagosWeather = async () => {
      try {
        const geocodeResponse = await fetch(
          'https://geocoding-api.open-meteo.com/v1/search?name=Lagos&count=1&language=en&format=json',
        )

        if (!geocodeResponse.ok) {
          throw new Error('Could not find Lagos coordinates.')
        }

        const geocodeData = await geocodeResponse.json()
        const location = geocodeData.results?.[0]

        if (!location) {
          throw new Error('Lagos was not found in the geocoding API.')
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

        setWeather({
          temperature,
          city: location.name,
          loading: false,
          error: null,
        })
      } catch (error) {
        setWeather({
          temperature: null,
          city: 'Lagos',
          loading: false,
          error: error instanceof Error ? error.message : 'Something went wrong.',
        })
      }
    }

    fetchLagosWeather()
  }, [])

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
          width: 'min(90vw, 420px)',
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
        <h1 style={{ margin: '0.75rem 0 1rem', color: '#0f172a', fontSize: '2.5rem' }}>
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
