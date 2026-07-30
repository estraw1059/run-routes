# McKinney Running Club — Routes

Mobile-friendly website that shows MRC routes on a map with your live GPS
position, so new runners can follow along without a Garmin or Strava.

**Live site:** https://estraw1059.github.io/run-routes/

## How runners use it

1. Open the link above on your phone (add it to your home screen for quick access).
   Routes are grouped by run day, with today's run at the top.
2. Tap a route to see it on the map. The ⇪ button shares a direct link to that
   route (e.g. `…/run-routes/#saturday-6`).
3. Tap **📍 Start tracking** and allow location access — the orange dot is you.
   Stay on the blue line! Green dot = start, red dot = finish, 💧 = water stop.

## Adding or updating a route

1. In [Garmin Connect](https://connect.garmin.com) go to **Training & Planning → Courses**,
   open the course, click the gear icon, and choose **Export to GPX**.
2. Drop the `.gpx` file into `public/routes/`.
3. Add an entry to `src/routes.json`:

   ```json
   {
     "id": "sunday-5",
     "name": "5 Mile Loop",
     "file": "sunday-5-mile.gpx",
     "day": "Sunday",
     "description": "optional note",
     "waterStops": [{ "lat": 33.175, "lng": -96.696 }]
   }
   ```

   `day` must be one of Saturday / Sunday / Wednesday / Thursday (the run days
   shown on the list). `description` and `waterStops` are optional. Distance is
   computed automatically from the GPX.
4. Commit and push to `main` — GitHub Actions rebuilds and deploys the site automatically.

## Marking water stops

Do the run with the route open and tracking on. Each time you pass a water
stop, tap **💧 Mark water** — it records your current GPS position. At the end,
tap **Copy** in the water panel and paste the resulting `"waterStops": [...]`
snippet into that route's entry in `src/routes.json`.

## Development

```bash
npm install
npm run dev
```

Built with Vite + React + [Leaflet](https://leafletjs.com/) / OpenStreetMap.
No API keys, no backend — routes are static GPX files served with the site.
