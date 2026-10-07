// Pura Nepal ka aspatal, swasthya sanstha, pharmacy, prahari, damkal OpenStreetMap bata OsmPlace ma import.
// Nepal lai 0.5 degree ka tukra (tile) ma chhutyaera sodhchha (pura pradesh ek choti Overpass ko lagi garhaun).
// Admin ko EmergencyService chhuchhaina. Pheri chalaye taja hunchha (upsert), OSM bata hateko pani hatcha.
// Run:  npm run import:osm                       (pura Nepal)
//       npm run import:osm -- --dry              (database ma nalekhi sankhya matra)
//       npm run import:osm -- --tiles=27.5,85    (fail bhaeka tile matra pheri)
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const OsmPlace = require("./models/OsmPlace");
const { fetchOverpass, placeFilters, toPlace } = require("./services/osmNearby");

dotenv.config();

const DRY = process.argv.includes("--dry");
const ONLY = (process.argv.find((arg) => arg.startsWith("--tiles=")) || "").slice(8).split(";").filter(Boolean);

// Nepal ko seema (thorai baahira samma; Nepal bhitra ko matra area filter le linchha)
const BOUNDS = { south: 26.0, north: 30.5, west: 80.0, east: 88.5 };
const STEP = 0.5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tiles = () => {
  const list = [];
  for (let s = BOUNDS.south; s < BOUNDS.north; s += STEP) {
    for (let w = BOUNDS.west; w < BOUNDS.east; w += STEP) {
      list.push({ key: `${s},${w}`, s, w, n: s + STEP, e: w + STEP });
    }
  }
  return ONLY.length ? list.filter((tile) => ONLY.includes(tile.key)) : list;
};

// Ek tile: busy bhae 3 choti samma parkhera pheri
const fetchTile = async ({ s, w, n, e }) => {
  const query = `[out:json][timeout:60][bbox:${s},${w},${n},${e}];
area["ISO3166-1"="NP"]["admin_level"="2"]->.np;
(${placeFilters("(area.np)")});
out center tags;`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await fetchOverpass(query, 70000);
      return (data.elements || []).map(toPlace).filter(Boolean);
    } catch (error) {
      if (attempt < 3) await sleep(attempt * 10000);
      else console.log(`  fail: ${error.message}`);
    }
  }

  return null;
};

const run = async () => {
  if (!DRY) {
    await mongoose.connect(process.env.MONGODB_URL);
    await OsmPlace.syncIndexes();
  }

  const startedAt = new Date();
  const list = tiles();
  const byType = {};
  const failed = [];
  let total = 0;

  for (const [index, tile] of list.entries()) {
    const places = await fetchTile(tile);

    if (!places) {
      failed.push(tile.key);
      continue;
    }

    places.forEach((place) => (byType[place.type] = (byType[place.type] || 0) + 1));
    total += places.length;
    if (places.length) console.log(`[${index + 1}/${list.length}] ${tile.key}: ${places.length}`);

    if (!DRY) {
      if (places.length) {
        await OsmPlace.bulkWrite(
          places.map((place) => ({
            updateOne: {
              filter: { osmId: place.osmId },
              update: { $set: { ...place, province: tile.key, importedAt: startedAt } },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }

      // Yo tile ko OSM bata hateko purano data hataune
      await OsmPlace.deleteMany({ province: tile.key, importedAt: { $lt: startedAt } });
    }

    // Overpass lai aaram (public server ko niyam)
    await sleep(1500);
  }

  console.log(`\nJamma: ${total} (${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(", ")})${DRY ? " - dry run, database ma lekhiena" : ""}`);
  if (failed.length) console.log(`Fail bhaeka tile (pheri: npm run import:osm -- --tiles="${failed.join(";")}")`);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Import failed:", error.message);
    process.exit(1);
  });
