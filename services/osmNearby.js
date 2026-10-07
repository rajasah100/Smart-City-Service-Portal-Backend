// OpenStreetMap (Overpass API) ko aapatkalin/swasthya sthaan.
// Mukhya: import gareko OsmPlace collection (chhito, bharpardo). Collection khali bhae matra live Overpass.

const OsmPlace = require("../models/OsmPlace");

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const USER_AGENT = "SmartCityServicePortal/1.0 (Nepal emergency services)";

// Overpass ko filter (import ra live dubai ma ekai)
const placeFilters = (scope) => `
  nwr["amenity"~"^(hospital|clinic|doctors|pharmacy|police|fire_station)$"]${scope};
  nwr["healthcare"~"^(hospital|clinic|centre)$"]${scope};
  nwr["emergency"="ambulance_station"]${scope};`;

// OSM tag -> hamro type
const toType = (tags) => {
  const amenity = tags.amenity;
  const name = `${tags.name || ""} ${tags["name:en"] || ""}`.toLowerCase();

  if (tags.emergency === "ambulance_station") return "ambulance";
  if (amenity === "hospital" || tags.healthcare === "hospital") return "hospital";
  if (amenity === "pharmacy" || tags.healthcare === "pharmacy") return "pharmacy";
  if (amenity === "clinic" || amenity === "doctors" || tags.healthcare) return "clinic";
  if (amenity === "fire_station") return "fire";
  if (amenity === "police") return name.includes("traffic") ? "traffic" : "police";
  return "other";
};

const toAddress = (tags) =>
  [tags["addr:street"], tags["addr:city"] || tags["addr:town"] || tags["addr:village"], tags["addr:district"]]
    .filter(Boolean)
    .join(", ");

// Overpass element -> hamro sthaan (naam wa location nabhae null)
const toPlace = (element) => {
  const tags = element.tags || {};
  const name = tags["name:en"] || tags.name || tags["name:ne"];
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (!name || lat === undefined || lng === undefined) return null;

  // Aapatkalin ma kaam nalagne (chashma, daat, prayogshala, vaikalpik upachar) nalyaune
  if (tags.healthcare && !["hospital", "clinic", "centre", "doctor", "pharmacy"].includes(tags.healthcare)) return null;

  return {
    osmId: `${element.type}/${element.id}`,
    name: name.trim(),
    nameNe: (tags["name:ne"] || "").trim(),
    type: toType(tags),
    phone: (tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "").split(";")[0].trim(),
    address: toAddress(tags),
    location: { type: "Point", coordinates: [lng, lat] },
  };
};

// Server haru paalai paalo try garne
const fetchOverpass = async (query, timeoutMs = 30000) => {
  let lastError;

  for (const url of ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`${url} ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
};

// API ko lagi ekai dhaancha
const toResponse = (place) => ({
  _id: `osm-${place.osmId}`,
  name: place.name,
  nameNe: place.nameNe,
  type: place.type,
  phone: place.phone,
  address: place.address,
  location: place.location,
  source: "osm",
});

// Live Overpass (import nagarieko bela) ko chhoto cache
const liveCache = new Map();
const LIVE_CACHE_MS = 6 * 60 * 60 * 1000;

const findLive = async (lat, lng, radius) => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${radius}`;
  const hit = liveCache.get(key);
  if (hit && Date.now() - hit.at < LIVE_CACHE_MS) return hit.services;

  const data = await fetchOverpass(`[out:json][timeout:25];(${placeFilters(`(around:${radius},${lat},${lng})`)});out center tags 300;`);
  const seen = new Set();
  const services = (data.elements || [])
    .map(toPlace)
    .filter((place) => place && !seen.has(place.osmId) && seen.add(place.osmId));
  const deduped = dedupe(services).map(toResponse);

  if (liveCache.size >= 300) liveCache.delete(liveCache.keys().next().value);
  liveCache.set(key, { at: Date.now(), services: deduped });
  return deduped;
};

// OSM ma ekai sthaan kahile node ra building duitai: ekai naam 200 m bhitra bhae ek matra (phone bhaeko rakhne)
const dedupe = (places) => {
  const kept = [];

  for (const place of places) {
    const [lng, lat] = place.location.coordinates;
    const twin = kept.find((other) => {
      const [olng, olat] = other.location.coordinates;
      return other.name.toLowerCase() === place.name.toLowerCase() && Math.hypot(lat - olat, (lng - olng) * 0.9) < 0.0018;
    });

    if (!twin) kept.push(place);
    else if (!twin.phone && place.phone) twin.phone = place.phone;
  }

  return kept;
};

// Najik ka sthaan: import gareko data bata, natra live
const findNearbyOsm = async (lat, lng, radius) => {
  const imported = await OsmPlace.estimatedDocumentCount();
  if (imported === 0) return findLive(lat, lng, radius);

  const places = await OsmPlace.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: radius } },
  })
    .limit(300)
    .lean();

  return dedupe(places).map(toResponse);
};

module.exports = { findNearbyOsm, fetchOverpass, placeFilters, toPlace };
