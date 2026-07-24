export default function RouteList({ routes, loaded, onSelect }) {
  return (
    <div className="route-list">
      <header className="list-header">
        <h1>🏃 Run Group Routes</h1>
        <p>Pick a route, then tap “Start tracking” to see yourself on the map.</p>
      </header>
      {routes.map((route) => {
        const data = loaded[route.id]
        return (
          <button
            key={route.id}
            className="route-card"
            onClick={() => onSelect(route.id)}
          >
            <span className="route-name">{route.name}</span>
            <span className="route-meta">
              {data.miles.toFixed(1)} mi
              {route.description ? ` · ${route.description}` : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
