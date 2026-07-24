---
name: verify
description: Build, serve, and drive the run-routes map app in headless Chromium with mocked geolocation
---

# Verifying run-routes

Static Vite + React + Leaflet app. Geolocation is the only tricky part — mock it
through Playwright's context options.

## Build & serve

```bash
npm run build
npm run preview -- --port 4185   # serves at http://localhost:4185/run-routes/ (note base path)
```

`npm run dev` also works (localhost counts as a secure origin for geolocation).

## Drive (Playwright)

Create the browser context with a mobile viewport and mocked GPS near the route:

```js
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  geolocation: { latitude: 40.7855, longitude: -73.9635, accuracy: 25 },
  permissions: ['geolocation'],
})
```

Flows worth driving:
1. Route list renders `.route-card` with name + computed miles.
2. Tap card → `.leaflet-container`; wait for `.leaflet-tile-loaded` count > 3;
   route polyline + start/finish markers = 3 `path.leaflet-interactive` elements.
3. "Start tracking" → paths go 3 → 5 (accuracy circle + runner dot).
4. Drag map → "Re-center on me" button appears (follow turned off); tap re-centers.
5. `ctx.setGeolocation(...)` → dot moves. With follow ON the dot's *screen*
   position stays fixed (map pans under it) — check geography via screenshot,
   not screen coords.
6. Stop → paths back to 3, "Start tracking" restored.
7. Denied flow: new context WITHOUT `permissions: ['geolocation']` →
   "Start tracking" shows `.geo-error` banner and restores the button.

## Gotchas

- `watchPosition` fires a timeout error (code 3) if Playwright sends no new
  position for 20s — the app treats it as transient ("Weak GPS signal…" banner,
  watch stays alive). Only PERMISSION_DENIED stops tracking. Don't let long
  waits between script steps trick you into thinking tracking broke.
- The sample loop starts/ends at the same point, so the green start dot is
  hidden under the red finish dot.
