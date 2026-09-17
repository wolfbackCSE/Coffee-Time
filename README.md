# Coffee Time — Dhaka

A single-page, GitHub Pages-ready café locator for Dhaka.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)` folder, then save.
6. GitHub will show your public website URL after deployment.

## What updates automatically

- Dhaka clock: every second.
- Open/closed café status: recalculated from the stored weekly hours.
- Results: refreshed every 30 seconds and again when the tab becomes active.
- “Near me”: uses the visitor’s browser geolocation when permission is granted.

## Important data note

The café names, ratings, phone numbers, addresses and weekly hours in this version are stored directly inside `index.html`. A static GitHub Pages site cannot automatically pull fresh Google Maps listing data without a permitted data source/API or a scheduled backend workflow. The Google Maps and Directions buttons still open the live Google Maps listing.
