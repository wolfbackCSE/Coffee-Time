# Coffee Time — Dhaka

A responsive café discovery site for Dhaka with live Google Places search across cafés, coffee shops, tea houses, bakeries, dessert spots, and casual restaurants. Results include ratings, opening hours, distance sorting, Google Maps directions, and menu/website links when a listing provides them. It remains usable with the curated café dataset when the live API is unavailable.

## Publish the frontend

1. Create a new GitHub repository.
2. Upload `index.html` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)` folder, then save.
6. GitHub will show your public website URL after deployment.

The frontend is a static `index.html`, so it can be deployed to GitHub Pages. The live search endpoint in `api/places.js` must be deployed separately to a serverless Node host (Vercel is the simplest option) and the frontend's `/api/places` path must resolve to that deployment. If the frontend and function share a host, no frontend changes are needed.

## Configure Google Places

1. Create a Google Cloud project and enable **Places API (New)**.
2. Create an API key restricted to the Places API and store it as the server-only `GOOGLE_PLACES_API_KEY` environment variable.
3. Deploy `api/places.js` with Node 18 or newer. `npm run check` validates the function syntax.
4. Configure the frontend host to proxy `/api/places` to the deployed function, or change the fetch URL in `index.html` to the function's public URL.

The proxy uses several Google Text Search category queries with a Dhaka/current-location bias, deduplicates place IDs, and applies a five-minute edge cache. This returns a broader discovery set than the previous single 20-result coffee query. Google Maps/Places attribution, quotas, billing, and its data-use policies still apply. Never put `GOOGLE_PLACES_API_KEY` in `index.html`.

## What updates automatically

- Dhaka clock: every second.
- Open/closed café status: recalculated from the stored weekly hours.
- Results: loaded from multiple Google Places categories when the proxy is configured, with curated data as a fallback; searches are debounced.
- “Near me”: uses the visitor’s browser geolocation when permission is granted and reloads live results around that location.
- Sorts: highest rating, most reviews, name, area, and nearest distance.

## Important data note

Google Places provides ratings, review counts, hours, phone numbers, websites, and Maps links where available. Every card now includes a website action: verified Google website URLs are labeled “Website / menu”; curated records without a verified URL use a Google search for the venue name labeled “Find website”. This avoids presenting an unverified domain as official. Google does not reliably provide a full menu for every venue, so curated menu highlights remain available for seeded records.
