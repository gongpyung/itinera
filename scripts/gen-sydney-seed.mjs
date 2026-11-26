// One-off generator: converts the original static data file (legacy/data/itinerary.js)
// into the typed seed module used by the app. Kept in the repo so the carry-over
// from the static version stays auditable and repeatable.
//
//   node scripts/gen-sydney-seed.mjs > lib/seed/sydney.ts
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const require = createRequire(import.meta.url);

globalThis.window = {};
require(path.join(repoRoot, "legacy/data/itinerary.js"));
const { hotel, days } = globalThis.window.TRIP_DATA;

// The static site stored display dates ("4/30"). The trip ran in 2026 (the plans
// note that 5/1 was outside daylight saving time, which holds for May 2026).
const YEAR = 2026;
const isoDate = (display) => {
  const [m, d] = display.split("/").map(Number);
  return `${YEAR}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const trip = {
  id: "trip-sydney",
  title: "콩부부 시드니 여행 ❤️",
  destination: "시드니, 호주",
  eyebrow: "4월 30일 - 5월 5일",
  startDate: isoDate(days[0].date),
  endDate: isoDate(days[days.length - 1].date),
  heroImage:
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1800&q=80",
  theme: "harbour",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  hotel: {
    name: hotel.name,
    displayName: hotel.displayName,
    query: hotel.query,
    lat: hotel.lat,
    lng: hotel.lng,
  },
  days: days.map((day, dayIndex) => ({
    id: `sy-d${dayIndex + 1}`,
    date: isoDate(day.date),
    title: day.title,
    summary: day.summary,
    travelMode: day.travelMode,
    stops: day.stops.map((stop, stopIndex) => {
      const out = {
        id: `sy-d${dayIndex + 1}-s${stopIndex + 1}`,
        time: stop.time,
        name: stop.name,
        category: stop.category,
        query: stop.query,
        lat: stop.lat,
        lng: stop.lng,
        note: stop.note,
        tags: stop.tags,
      };
      if (stop.booked) out.booked = true;
      if (stop.free) out.free = true;
      return out;
    }),
  })),
};

process.stdout.write(`// Generated from legacy/data/itinerary.js by scripts/gen-sydney-seed.mjs.
// The Sydney itinerary is carried over unchanged (title, hotel, every day and
// stop, notes, tags, coordinates); only display dates were turned into ISO dates.
import type { Trip } from "../types";

export const sydneyTrip: Trip = ${JSON.stringify(trip, null, 2)};
`);
