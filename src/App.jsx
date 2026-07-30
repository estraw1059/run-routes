import { useEffect, useState } from 'react'
import routes from './routes.json'
import { loadRoute } from './gpx.js'
import RouteList from './RouteList.jsx'
import RouteMap from './RouteMap.jsx'

const readHash = () => window.location.hash.slice(1) || null

export default function App() {
  const [loaded, setLoaded] = useState(null) // { [id]: { points, miles } }
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(readHash)

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

  // The hash is the source of truth for which route is open, so shared
  // links like /run-routes/#saturday-6 land directly on that route.
  useEffect(() => {
    const onHashChange = () => setSelectedId(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const openRoute = (id) => {
    window.location.hash = id
  }
  const backToList = () => {
    window.history.pushState('', '', window.location.pathname)
    setSelectedId(null)
  }

  if (error) {
    return <div className="screen-message">Failed to load routes: {error}</div>
  }
  if (!loaded) {
    return <div className="screen-message">Loading routes…</div>
  }

  const selected = routes.find((r) => r.id === selectedId)
  if (selected) {
    return (
      <RouteMap route={selected} data={loaded[selected.id]} onBack={backToList} />
    )
  }

  return <RouteList routes={routes} loaded={loaded} onSelect={openRoute} />
}
