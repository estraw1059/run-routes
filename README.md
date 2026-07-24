# Run Group Routes

Mobile-friendly website that shows our group running routes on a map with your
live GPS position, so new runners can follow along without a Garmin or Strava.

**Live site:** https://estraw1059.github.io/run-routes/

## How runners use it

1. Open the link above on your phone (add it to your home screen for quick access).
2. Tap a route to see it on the map.
3. Tap **📍 Start tracking** and allow location access — the blue dot is you.
   Stay on the purple line! Green dot = start, red dot = finish.

## Adding or updating a route

1. In [Garmin Connect](https://connect.garmin.com) go to **Training & Planning → Courses**,
   open the course, click the gear icon, and choose **Export to GPX**.
2. Drop the `.gpx` file into `public/routes/`.
3. Add an entry to `src/routes.json`:

   ```json
   {
     "id": "river-loop",
     "name": "River Loop",
     "file": "river-loop.gpx",
     "description": "Tuesday nights"
   }
   ```

   (`description` is optional. Distance is computed automatically from the GPX.)
4. Commit and push to `main` — GitHub Actions rebuilds and deploys the site automatically.

## Development

```bash
npm install
npm run dev
```

Built with Vite + React + [Leaflet](https://leafletjs.com/) / OpenStreetMap.
No API keys, no backend — routes are static GPX files served with the site.
