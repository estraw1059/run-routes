// Load and parse a GPX file from public/routes/ into { name, points, miles }.
// Garmin course exports put coordinates in <trkpt> (tracks) or <rtept> (routes).

export async function loadRoute(file) {
  const res = await fetch(`${import.meta.env.BASE_URL}routes/${file}`)
  if (!res.ok) throw new Error(`Could not load route file: ${file}`)
  const text = await res.text()
  return parseGpx(text)
}

export function parseGpx(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid GPX file')

  let pts = [...doc.getElementsByTagName('trkpt')]
  if (pts.length === 0) pts = [...doc.getElementsByTagName('rtept')]

  const points = pts.map((pt) => [
    parseFloat(pt.getAttribute('lat')),
    parseFloat(pt.getAttribute('lon')),
  ])

  const name = doc.getElementsByTagName('name')[0]?.textContent?.trim() ?? ''
  return { name, points, miles: totalMiles(points) }
}

const EARTH_RADIUS_MI = 3958.8

function haversineMiles([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a))
}

function totalMiles(points) {
  let miles = 0
  for (let i = 1; i < points.length; i++) {
    miles += haversineMiles(points[i - 1], points[i])
  }
  return miles
}
