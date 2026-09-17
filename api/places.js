const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 };
const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
const DISCOVERY_QUERIES = [
  'cafes in Dhaka',
  'coffee shops in Dhaka',
  'tea houses and bakeries in Dhaka',
  'dessert cafes and casual restaurants in Dhaka'
];

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.end(JSON.stringify(body));
}

function numberParam(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function minutes(value) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function hoursFor(place) {
  const periods = place.regularOpeningHours?.periods || [];
  const byDay = Array.from({ length: 7 }, () => null);
  periods.forEach(period => {
    const day = period.open?.day;
    if (typeof day !== 'number') return;
    const index = day === 0 ? 6 : day - 1;
    const open = minutes(period.open?.time);
    const close = minutes(period.close?.time);
    if (open === null) return;
    byDay[index] = [open, close === null ? 0 : close];
  });
  return byDay;
}

function normalize(place) {
  const location = place.location || {};
  const menu = place.websiteUri || null;
  const priceLevels = {
    PRICE_LEVEL_FREE: 1,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4
  };
  return {
    n: place.displayName?.text || 'Unnamed café',
    a: (place.formattedAddress || 'Dhaka').split(',')[1]?.trim() || 'Dhaka',
    addr: place.formattedAddress || 'Address unavailable',
    lat: location.latitude,
    lng: location.longitude,
    r: place.rating || 0,
    rc: place.userRatingCount || 0,
    pl: priceLevels[place.priceLevel] || null,
    ph: place.nationalPhoneNumber || null,
    note: place.editorialSummary?.text || 'Discover this café on Google Maps.',
    pid: place.id,
    hrs: hoursFor(place),
    picks: [],
    menu,
    map: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || 'café')}`,
    source: 'Google Places'
  };
}

async function searchPlaces(textQuery, lat, lng) {
  const response = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.editorialSummary,places.googleMapsUri,places.priceLevel'
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'en',
      regionCode: 'BD',
      maxResultCount: 20,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 15000 } }
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Google Places request failed.');
  }
  return payload.places || [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Only GET is supported.' });
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return json(res, 503, { error: 'Google Places is not configured. Showing the curated café list instead.' });
  }

  const requestedQuery = String(req.query?.query || '').trim().slice(0, 120);
  const lat = numberParam(req.query?.lat, DEFAULT_LOCATION.lat);
  const lng = numberParam(req.query?.lng, DEFAULT_LOCATION.lng);
  const queries = requestedQuery
    ? [`cafes, coffee shops, tea houses and bakeries near ${requestedQuery}`]
    : DISCOVERY_QUERIES;

  try {
    const results = await Promise.all(queries.map(query => searchPlaces(query, lat, lng)));
    const uniquePlaces = new Map();
    results.flat().forEach(place => {
      if (place.id && !uniquePlaces.has(place.id)) uniquePlaces.set(place.id, place);
    });
    return json(res, 200, {
      source: 'Google Places',
      query: requestedQuery || 'Dhaka café discovery',
      categories: requestedQuery ? ['cafes', 'coffee shops', 'tea houses', 'bakeries'] : ['cafes', 'coffee shops', 'tea houses', 'bakeries', 'dessert cafés', 'casual restaurants'],
      places: [...uniquePlaces.values()].map(normalize)
    });
  } catch (error) {
    return json(res, 502, { error: error.message || 'Google Places is temporarily unavailable.' });
  }
};
