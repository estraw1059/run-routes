import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'

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
  const watchIdRef = useRef(null)
  const wakeLockRef = useRef(null)

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
          <span className="route-meta">{data.miles.toFixed(1)} mi</span>
        </div>
      </header>

      {geoError && <div className="geo-error">{geoError}</div>}

      <MapContainer bounds={points} boundsOptions={{ padding: [30, 30] }} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={points} pathOptions={{ color: '#7c3aed', weight: 5, opacity: 0.85 }} />
        <CircleMarker
          center={start}
          radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#16a34a', fillOpacity: 1 }}
        />
        <CircleMarker
          center={finish}
          radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }}
        />
        {position && (
          <>
            {accuracy > 0 && (
              <Circle
                center={position}
                radius={accuracy}
                pathOptions={{ color: '#2563eb', weight: 1, fillColor: '#2563eb', fillOpacity: 0.12 }}
              />
            )}
            <CircleMarker
              center={position}
              radius={9}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
            />
          </>
        )}
        <FollowController position={position} follow={follow} setFollow={setFollow} />
      </MapContainer>

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
            {!follow && (
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
