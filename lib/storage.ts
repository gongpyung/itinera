import type { AppState, ChatMessage, Day, Stop, Trip } from "./types";
import { isThemeId } from "./themes";
import { newId } from "./ids";
import { isIsoDate, monthDay } from "./format";
import { TRAVEL_MODES, type TravelMode } from "./types";

const STATE_KEY = "itinera.state.v2";
const CHAT_KEY = (tripId: string) => `itinera.chat.v2.${tripId}`;
const VISITED_KEY = (tripId: string) => `itinera.visited.v2.${tripId}`;

export const STORAGE_VERSION = 2;

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the app keeps working in memory.
  }
}

export function loadState(): AppState | null {
  const raw = readJson(STATE_KEY);
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<AppState>;
  if (!Array.isArray(candidate.trips)) return null;
  const trips = candidate.trips.map((trip) => coerceTrip(trip)).filter((trip): trip is Trip => trip !== null);
  if (trips.length === 0) return null;
  const activeTripId =
    typeof candidate.activeTripId === "string" && trips.some((trip) => trip.id === candidate.activeTripId)
      ? candidate.activeTripId
      : trips[0].id;
  return { version: STORAGE_VERSION, activeTripId, trips };
}

export function saveState(state: AppState): void {
  writeJson(STATE_KEY, state);
}

export function loadChat(tripId: string): ChatMessage[] {
  const raw = readJson(CHAT_KEY(tripId));
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is ChatMessage => Boolean(item) && typeof item === "object")
    .map<ChatMessage>((item) => ({
      id: typeof item.id === "string" ? item.id : newId("msg"),
      role: item.role === "assistant" ? "assistant" : "user",
      content: typeof item.content === "string" ? item.content : "",
      warnings: Array.isArray(item.warnings) ? item.warnings.filter((w): w is string => typeof w === "string") : undefined,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }))
    .slice(-80);
}

export function saveChat(tripId: string, messages: ChatMessage[]): void {
  writeJson(CHAT_KEY(tripId), messages.slice(-80));
}

export function loadVisited(tripId: string): string[] {
  const raw = readJson(VISITED_KEY(tripId));
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export function saveVisited(tripId: string, keys: string[]): void {
  writeJson(VISITED_KEY(tripId), keys);
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10);
}

function asMode(value: unknown): TravelMode {
  return TRAVEL_MODES.find((mode) => mode === value) ?? "walking";
}

function coerceStop(raw: unknown, fallbackId: string): Stop | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const name = asText(source.name);
  if (!name) return null;
  const stop: Stop = {
    id: asText(source.id, fallbackId),
    time: asText(source.time),
    name,
    category: asText(source.category, "일정"),
    query: asText(source.query, name),
    note: asText(source.note),
    tags: asTags(source.tags),
  };
  if (typeof source.lat === "number" && Number.isFinite(source.lat)) stop.lat = source.lat;
  if (typeof source.lng === "number" && Number.isFinite(source.lng)) stop.lng = source.lng;
  if (source.booked === true) stop.booked = true;
  if (source.free === true) stop.free = true;
  return stop;
}

function coerceDay(raw: unknown, index: number): Day | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const date = isIsoDate(source.date) ? source.date : "";
  if (!date) return null;
  const stops = Array.isArray(source.stops)
    ? source.stops
        .map((stop, stopIndex) => coerceStop(stop, `stop-${index + 1}-${stopIndex + 1}`))
        .filter((stop): stop is Stop => stop !== null)
    : [];
  return {
    id: asText(source.id, `day-${index + 1}`),
    date,
    title: asText(source.title, `${monthDay(date)} 일정`),
    summary: asText(source.summary),
    travelMode: asMode(source.travelMode),
    stops,
  };
}

/** Tolerant reader for stored, imported or AI-produced trip documents. */
export function coerceTrip(raw: unknown): Trip | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const days = Array.isArray(source.days)
    ? source.days.map((day, index) => coerceDay(day, index)).filter((day): day is Day => day !== null)
    : [];

  // A trip without any day is not usable (and usually means this is not a trip file).
  if (days.length === 0) return null;

  const hotelSource = (source.hotel && typeof source.hotel === "object" ? source.hotel : {}) as Record<string, unknown>;
  const hotelName = asText(hotelSource.name, "숙소");
  const startDate = isIsoDate(source.startDate) ? source.startDate : days[0]?.date;
  const endDate = isIsoDate(source.endDate) ? source.endDate : days[days.length - 1]?.date;
  const now = new Date().toISOString();

  return {
    id: asText(source.id, newId("trip")),
    title: asText(source.title, "새 여행"),
    destination: asText(source.destination),
    eyebrow: asText(source.eyebrow),
    startDate,
    endDate,
    heroImage: typeof source.heroImage === "string" ? source.heroImage : "",
    theme: isThemeId(source.theme) ? source.theme : "harbour",
    hotel: {
      name: hotelName,
      displayName: asText(hotelSource.displayName, hotelName),
      query: asText(hotelSource.query, hotelName),
      address: asText(hotelSource.address) || undefined,
      note: asText(hotelSource.note) || undefined,
      lat: typeof hotelSource.lat === "number" ? hotelSource.lat : undefined,
      lng: typeof hotelSource.lng === "number" ? hotelSource.lng : undefined,
    },
    days,
    createdAt: asText(source.createdAt, now),
    updatedAt: asText(source.updatedAt, now),
  };
}

export type ImportResult = { trips: Trip[] } | { error: string };

/** Accepts a bare trip, {trip}, {trips:[…]} or a full exported app state. */
export function parseImport(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "JSON 파일을 읽지 못했습니다. 내보내기로 받은 파일인지 확인해 주세요." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { error: "여행 데이터 형식이 아닙니다." };
  }

  const source = parsed as Record<string, unknown>;
  const candidates: unknown[] = [];

  if (Array.isArray(source.trips)) candidates.push(...source.trips);
  else if (source.trip) candidates.push(source.trip);
  else candidates.push(parsed);

  const trips = candidates.map((item) => coerceTrip(item)).filter((trip): trip is Trip => trip !== null);
  if (trips.length === 0) {
    return { error: "여행 데이터를 찾지 못했습니다. days 배열이 있는지 확인해 주세요." };
  }
  return { trips };
}

/** Export payload: one self-describing file the same app can import again. */
export function exportPayload(trips: Trip[]) {
  return {
    app: "itinera",
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    trips,
  };
}
