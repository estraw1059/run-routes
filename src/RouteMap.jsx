import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Circle,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { shareLink, routeUrl } from './share.js'

const waterIcon = L.divIcon({
  className: 'water-marker',
  html: '💧',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const markedIcon = L.divIcon({
  className: 'water-marker water-marker-new',
  html: '💧',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Keeps the map centered on the runner while "follow" is on, and turns
// follow off as soon as they drag the map to look around.
function FollowController({ position, follow, setFollow }) {
  const map = useMap()
  useMapEvents({
    dragstart: () => setFollow(false),
  })
  useEffect(() => {
    if (follow && position) {
      map.panTo(position, { animate: true })
    }
  }, [map, follow, position])
  return null
}

export default function RouteMap({ route, data, onBack }) {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(0)
  const [tracking, setTracking] = useState(false)
  const [follow, setFollow] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [markedStops, setMarkedStops] = useState([])
  const [toast, setToast] = useState(null)
  const watchIdRef = useRef(null)
  const wakeLockRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported on this device/browser.')
      return
    }
    setGeoError(null)
    setTracking(true)
    setFollow(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setAccuracy(pos.coords.accuracy)
        setGeoError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          stopTracking()
          setGeoError(
            'Location permission was denied. Allow location access for this site in your browser settings, then try again.',
          )
        } else {
          // Timeout / signal loss is transient — keep the watch alive and let
          // the next successful fix clear this message.
          setGeoError('Weak GPS signal — still trying to find you…')
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    )
    requestWakeLock()
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    setTracking(false)
    setFollow(false)
    setPosition(null)
  }

  const requestWakeLock = async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock?.request('screen')
    } catch {
      // Wake lock is best-effort; the app works fine without it.
    }
  }

  // Re-grab the wake lock when the runner switches back to this tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && tracking) requestWakeLock()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [tracking])

  useEffect(() => stopTracking, [])

  const onShare = async () => {
    const result = await shareLink(
      `MRC — ${route.name} (${route.day})`,
      routeUrl(route.id),
    )
    if (result === 'copied') showToast('Link copied!')
  }

  const markWater = () => {
    if (!position) return
    setMarkedStops((stops) => [
      ...stops,
      { lat: +position[0].toFixed(6), lng: +position[1].toFixed(6) },
    ])
  }

  const copyMarkedStops = async () => {
    const json = `"waterStops": ${JSON.stringify(markedStops)}`
    try {
      await navigator.clipboard.writeText(json)
      showToast('Water stops copied!')
    } catch {
      // Clipboard can be unavailable (e.g. non-secure context); share instead.
      shareLink('Water stops', json)
    }
  }

  const { points } = data
  const start = points[0]
  const finish = points[points.length - 1]

  return (
    <div className="map-screen">
      <header className="map-header">
        <button className="back-button" onClick={onBack}>
          ‹ Routes
        </button>
        <div className="map-title">
          <span className="route-name">{route.name}</span>
          <span className="route-meta">
            {route.day} · {data.miles.toFixed(1)} mi
          </span>
        </div>
        <button className="icon-button" onClick={onShare} aria-label="Share this route">
          ⇪
        </button>
      </header>

      {geoError && <div className="geo-error">{geoError}</div>}
      {toast && <div className="share-note">{toast}</div>}

      <MapContainer bounds={points} boundsOptions={{ padding: [30, 30] }} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={points} pathOptions={{ color: '#2f7dd6', weight: 5, opacity: 0.85 }} />
        <CircleMarker
          center={start}
          radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#75a244', fillOpacity: 1 }}
        />
        <CircleMarker
          center={finish}
          radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }}
        />
        {(route.waterStops ?? []).map((stop, i) => (
          <Marker key={`water-${i}`} position={[stop.lat, stop.lng]} icon={waterIcon} />
        ))}
        {markedStops.map((stop, i) => (
          <Marker key={`marked-${i}`} position={[stop.lat, stop.lng]} icon={markedIcon} />
        ))}
        {position && (
          <>
            {accuracy > 0 && (
              <Circle
                center={position}
                radius={accuracy}
                pathOptions={{ color: '#d37e2c', weight: 1, fillColor: '#d37e2c', fillOpacity: 0.12 }}
              />
            )}
            <CircleMarker
              center={position}
              radius={9}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#d37e2c', fillOpacity: 1 }}
            />
          </>
        )}
        <FollowController position={position} follow={follow} setFollow={setFollow} />
      </MapContainer>

      {markedStops.length > 0 && (
        <div className="water-panel">
          <span>
            💧 {markedStops.length} water stop{markedStops.length > 1 ? 's' : ''} marked
          </span>
          <button className="water-panel-button" onClick={copyMarkedStops}>
            Copy
          </button>
          <button className="water-panel-button" onClick={() => setMarkedStops([])}>
            Clear
          </button>
        </div>
      )}

      <div className="map-controls">
        {!tracking ? (
          <button className="control-button primary" onClick={startTracking}>
            📍 Start tracking
          </button>
        ) : (
          <>
            <button className="control-button" onClick={stopTracking}>
              Stop
            </button>
            {follow ? (
              <button className="control-button water" onClick={markWater} disabled={!position}>
                💧 Mark water
              </button>
            ) : (
              <button className="control-button primary" onClick={() => setFollow(true)}>
                Re-center on me
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
