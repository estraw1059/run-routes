import { useState } from 'react'
import { shareLink, routeUrl } from './share.js'

const RUN_DAYS = ['Saturday', 'Sunday', 'Wednesday', 'Thursday']
const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

// Order run days so today's run is on top, then the next upcoming days.
export function orderedRunDays(today = new Date().getDay()) {
  return [...RUN_DAYS].sort(
    (a, b) => ((DAY_INDEX[a] - today + 7) % 7) - ((DAY_INDEX[b] - today + 7) % 7),
  )
}

export default function RouteList({ routes, loaded, onSelect }) {
  const [shareNote, setShareNote] = useState(null)
  const today = new Date().getDay()

  const onShare = async () => {
    const result = await shareLink('McKinney Running Club — Routes', routeUrl())
    if (result === 'copied') {
      setShareNote('Link copied!')
      setTimeout(() => setShareNote(null), 2000)
    }
  }

  return (
    <div className="route-list">
      <header className="list-header">
        <img className="club-logo" src={`${import.meta.env.BASE_URL}mrc-logo.png`} alt="McKinney Running Club" />
        <div className="list-header-text">
          <h1>McKinney Running Club</h1>
          <p>Pick a route, then tap “Start tracking” to see yourself on the map.</p>
        </div>
        <button className="icon-button" onClick={onShare} aria-label="Share this site">
          ⇪
        </button>
      </header>
      {shareNote && <div className="share-note">{shareNote}</div>}

      {orderedRunDays(today).map((day) => {
        const dayRoutes = routes.filter((r) => r.day === day)
        return (
          <section key={day} className="day-group">
            <h2 className="day-header">
              {day} Runs
              {DAY_INDEX[day] === today && <span className="today-badge">Today</span>}
            </h2>
            {dayRoutes.length === 0 ? (
              <p className="day-empty">Routes coming soon</p>
            ) : (
              dayRoutes.map((route) => {
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
              })
            )}
          </section>
        )
      })}
    </div>
  )
}
