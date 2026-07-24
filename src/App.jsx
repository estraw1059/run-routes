import { useEffect, useState } from 'react'
import routes from './routes.json'
import { loadRoute } from './gpx.js'
import RouteList from './RouteList.jsx'
import RouteMap from './RouteMap.jsx'

export default function App() {
  const [loaded, setLoaded] = useState(null) // { [id]: { points, miles } }
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    Promise.all(routes.map((r) => loadRoute(r.file)))
      .then((parsed) => {
        const byId = {}
        routes.forEach((r, i) => {
          byId[r.id] = parsed[i]
        })
        setLoaded(byId)
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div className="screen-message">Failed to load routes: {error}</div>
  }
  if (!loaded) {
    return <div className="screen-message">Loading routes…</div>
  }

  const selected = routes.find((r) => r.id === selectedId)
  if (selected) {
    return (
      <RouteMap
        route={selected}
        data={loaded[selected.id]}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return <RouteList routes={routes} loaded={loaded} onSelect={setSelectedId} />
}
