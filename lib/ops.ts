import { addDays, isIsoDate, monthDay } from "./format";
import { newId } from "./ids";
import { isThemeId } from "./themes";
import { TRAVEL_MODES, type Day, type Hotel, type Stop, type ThemeId, type TravelMode, type Trip } from "./types";

export type StopPatch = Partial<Omit<Stop, "id">>;
export type DayPatch = Partial<Omit<Day, "id" | "stops">>;
export type HotelPatch = Partial<Hotel>;
export type TripPatch = Partial<
  Pick<Trip, "title" | "destination" | "eyebrow" | "heroImage" | "startDate" | "endDate">
>;

/**
 * A validated itinerary change. The AI layer and the manual editors both produce
 * these, so one code path applies every change to a trip.
 */
export type Op =
  | { op: "add_stop"; dayId: string; stop: Stop; index?: number }
  | { op: "update_stop"; dayId: string; stopId: string; patch: StopPatch }
  | { op: "delete_stop"; dayId: string; stopId: string }
  | { op: "move_stop"; dayId: string; stopId: string; toIndex: number }
  | { op: "add_day"; day: Day; index?: number }
  | { op: "update_day"; dayId: string; patch: DayPatch }
  | { op: "delete_day"; dayId: string }
  | { op: "set_travel_mode"; dayId: string; travelMode: TravelMode }
  | { op: "set_theme"; theme: ThemeId }
  | { op: "set_hotel"; patch: HotelPatch }
  | { op: "set_trip"; patch: TripPatch };

export type ApplyResult = {
  trip: Trip;
  applied: number;
  warnings: string[];
  touchedDayIds: string[];
  touchedStopIds: string[];
};

const LIMITS = {
  ops: 40,
  name: 120,
  category: 30,
  note: 600,
  query: 200,
  time: 24,
  tags: 10,
  tag: 30,
  stopsPerDay: 24,
  daysPerTrip: 60,
};

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((item) => text(item, LIMITS.tag))
    .filter((item): item is string => Boolean(item))
    .slice(0, LIMITS.tags);
  return out;
}

function boolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function coordinate(value: unknown, limit: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (Math.abs(value) > limit) return undefined;
  return value;
}

function travelMode(value: unknown): TravelMode | undefined {
  return TRAVEL_MODES.find((mode) => mode === value);
}

function ordinal(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.trunc(value);
}

function stopFrom(raw: unknown, defaults?: Partial<Stop>): Stop | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const name = text(source.name, LIMITS.name) ?? defaults?.name;
  if (!name) return null;

  const stop: Stop = {
    id: text(source.id, 80) ?? newId("stop"),
    time: text(source.time, LIMITS.time) ?? defaults?.time ?? "",
    name,
    category: text(source.category, LIMITS.category) ?? defaults?.category ?? "일정",
    query: text(source.query, LIMITS.query) ?? defaults?.query ?? name,
    note: text(source.note, LIMITS.note) ?? defaults?.note ?? "",
    tags: stringList(source.tags) ?? defaults?.tags ?? [],
  };

  const lat = coordinate(source.lat, 90);
  const lng = coordinate(source.lng, 180);
  if (lat !== undefined) stop.lat = lat;
  if (lng !== undefined) stop.lng = lng;

  const booked = boolean(source.booked);
  const free = boolean(source.free);
  if (booked !== undefined) stop.booked = booked;
  if (free !== undefined) stop.free = free;

  return stop;
}

function stopPatchFrom(raw: unknown): StopPatch {
  const patch: StopPatch = {};
  if (!raw || typeof raw !== "object") return patch;
  const source = raw as Record<string, unknown>;

  const name = text(source.name, LIMITS.name);
  const time = text(source.time, LIMITS.time);
  const category = text(source.category, LIMITS.category);
  const query = text(source.query, LIMITS.query);
  const note = text(source.note, LIMITS.note);
  const tags = stringList(source.tags);
  const lat = coordinate(source.lat, 90);
  const lng = coordinate(source.lng, 180);
  const booked = boolean(source.booked);
  const free = boolean(source.free);

  if (name !== undefined) patch.name = name;
  if (time !== undefined) patch.time = time;
  if (category !== undefined) patch.category = category;
  if (query !== undefined) patch.query = query;
  if (note !== undefined) patch.note = note;
  if (tags !== undefined) patch.tags = tags;
  if (lat !== undefined) patch.lat = lat;
  if (lng !== undefined) patch.lng = lng;
  if (booked !== undefined) patch.booked = booked;
  if (free !== undefined) patch.free = free;

  return patch;
}

function dayPatchFrom(raw: unknown): DayPatch {
  const patch: DayPatch = {};
  if (!raw || typeof raw !== "object") return patch;
  const source = raw as Record<string, unknown>;

  if (isIsoDate(source.date)) patch.date = source.date;
  const title = text(source.title, LIMITS.name);
  const summary = text(source.summary, LIMITS.note);
  const mode = travelMode(source.travelMode);
  if (title !== undefined) patch.title = title;
  if (summary !== undefined) patch.summary = summary;
  if (mode !== undefined) patch.travelMode = mode;

  return patch;
}

function hotelPatchFrom(raw: unknown): HotelPatch {
  const patch: HotelPatch = {};
  if (!raw || typeof raw !== "object") return patch;
  const source = raw as Record<string, unknown>;

  const name = text(source.name, LIMITS.name);
  const displayName = text(source.displayName, LIMITS.name);
  const query = text(source.query, LIMITS.query);
  const address = text(source.address, LIMITS.query);
  const note = text(source.note, LIMITS.note);
  const lat = coordinate(source.lat, 90);
  const lng = coordinate(source.lng, 180);

  if (name !== undefined) patch.name = name;
  if (displayName !== undefined) patch.displayName = displayName;
  if (query !== undefined) patch.query = query;
  if (address !== undefined) patch.address = address;
  if (note !== undefined) patch.note = note;
  if (lat !== undefined) patch.lat = lat;
  if (lng !== undefined) patch.lng = lng;

  return patch;
}

function tripPatchFrom(raw: unknown): TripPatch {
  const patch: TripPatch = {};
  if (!raw || typeof raw !== "object") return patch;
  const source = raw as Record<string, unknown>;

  const title = text(source.title, LIMITS.name);
  const destination = text(source.destination, LIMITS.name);
  const eyebrow = text(source.eyebrow, LIMITS.name);
  const heroImage = typeof source.heroImage === "string" ? source.heroImage.trim().slice(0, 600) : undefined;

  if (title !== undefined) patch.title = title;
  if (destination !== undefined) patch.destination = destination;
  if (eyebrow !== undefined) patch.eyebrow = eyebrow;
  if (heroImage !== undefined) patch.heroImage = heroImage;
  if (isIsoDate(source.startDate)) patch.startDate = source.startDate;
  if (isIsoDate(source.endDate)) patch.endDate = source.endDate;

  return patch;
}

function nextDayDate(trip: Trip): string {
  if (trip.days.length === 0) {
    return trip.startDate && isIsoDate(trip.startDate) ? trip.startDate : new Date().toISOString().slice(0, 10);
  }
  const last = trip.days[trip.days.length - 1].date;
  return isIsoDate(last) ? addDays(last, 1) : new Date().toISOString().slice(0, 10);
}

/**
 * Turns untrusted model output (or an imported JSON patch) into strictly typed
 * operations, dropping anything that points at a day or stop the trip does not have.
 */
export function normalizeOps(raw: unknown, trip: Trip): { ops: Op[]; dropped: string[] } {
  const ops: Op[] = [];
  const dropped: string[] = [];

  if (!Array.isArray(raw)) {
    return { ops, dropped: ["변경 목록을 읽지 못했습니다."] };
  }

  const dayById = new Map(trip.days.map((day) => [day.id, day]));

  for (const entry of raw.slice(0, LIMITS.ops)) {
    if (!entry || typeof entry !== "object") {
      dropped.push("형식이 맞지 않는 변경 1건을 건너뛰었습니다.");
      continue;
    }
    const source = entry as Record<string, unknown>;
    const kind = typeof source.op === "string" ? source.op : "";
    const dayId = typeof source.dayId === "string" ? source.dayId : "";
    const stopId = typeof source.stopId === "string" ? source.stopId : "";
    const day = dayById.get(dayId);
    const stop = day?.stops.find((item) => item.id === stopId);

    switch (kind) {
      case "add_stop": {
        if (!day) {
          dropped.push(`없는 날짜(${dayId || "?"})에 장소를 추가하려 해 건너뛰었습니다.`);
          break;
        }
        const stopValue = stopFrom(source.stop);
        if (!stopValue) {
          dropped.push("이름 없는 장소 추가를 건너뛰었습니다.");
          break;
        }
        if (day.stops.length >= LIMITS.stopsPerDay) {
          dropped.push(`${day.title} 일정이 너무 많아 장소를 더 넣지 못했습니다.`);
          break;
        }
        const index = ordinal(source.index);
        ops.push({ op: "add_stop", dayId, stop: stopValue, index });
        break;
      }
      case "update_stop": {
        if (!day || !stop) {
          dropped.push("없는 장소를 수정하려 해 건너뛰었습니다.");
          break;
        }
        const patch = stopPatchFrom(source.stop ?? source.patch);
        if (Object.keys(patch).length === 0) {
          dropped.push("바꿀 내용이 없는 장소 수정을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "update_stop", dayId, stopId, patch });
        break;
      }
      case "delete_stop": {
        if (!day || !stop) {
          dropped.push("없는 장소를 삭제하려 해 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "delete_stop", dayId, stopId });
        break;
      }
      case "move_stop": {
        if (!day || !stop) {
          dropped.push("없는 장소를 옮기려 해 건너뛰었습니다.");
          break;
        }
        const toIndex = ordinal(source.toIndex ?? source.index);
        if (toIndex === undefined) {
          dropped.push("이동 위치가 없어 순서 변경을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "move_stop", dayId, stopId, toIndex });
        break;
      }
      case "add_day": {
        if (trip.days.length + ops.filter((item) => item.op === "add_day").length >= LIMITS.daysPerTrip) {
          dropped.push("여행 일수가 너무 많아 날짜를 더 추가하지 못했습니다.");
          break;
        }
        const sourceDay = source.day && typeof source.day === "object" ? (source.day as Record<string, unknown>) : {};
        const date = isIsoDate(sourceDay.date) ? sourceDay.date : nextDayDate(trip);
        const stops = Array.isArray(sourceDay.stops)
          ? sourceDay.stops
              .slice(0, LIMITS.stopsPerDay)
              .map((item) => stopFrom(item))
              .filter((item): item is Stop => item !== null)
          : [];
        ops.push({
          op: "add_day",
          index: ordinal(source.index),
          day: {
            id: text(sourceDay.id, 80) ?? newId("day"),
            date,
            title: text(sourceDay.title, LIMITS.name) ?? `${monthDay(date)} 일정`,
            summary: text(sourceDay.summary, LIMITS.note) ?? "",
            travelMode: travelMode(sourceDay.travelMode) ?? "walking",
            stops,
          },
        });
        break;
      }
      case "update_day": {
        if (!day) {
          dropped.push("없는 날짜를 수정하려 해 건너뛰었습니다.");
          break;
        }
        const patch = dayPatchFrom(source.day ?? source.patch);
        if (Object.keys(patch).length === 0) {
          dropped.push("바꿀 내용이 없는 날짜 수정을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "update_day", dayId, patch });
        break;
      }
      case "delete_day": {
        if (!day) {
          dropped.push("없는 날짜를 삭제하려 해 건너뛰었습니다.");
          break;
        }
        {
          const deletions = new Set(
            ops.flatMap((item) => (item.op === "delete_day" ? [item.dayId] : [])),
          );
          if (trip.days.length - deletions.size <= 1 && !deletions.has(dayId)) {
            dropped.push("마지막 남은 날짜는 삭제하지 않았습니다.");
            break;
          }
        }
        ops.push({ op: "delete_day", dayId });
        break;
      }
      case "set_travel_mode": {
        if (!day) {
          dropped.push("없는 날짜의 이동 수단을 바꾸려 해 건너뛰었습니다.");
          break;
        }
        const mode = travelMode(source.travelMode ?? source.patch);
        if (!mode) {
          dropped.push("이동 수단 값이 올바르지 않아 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "set_travel_mode", dayId, travelMode: mode });
        break;
      }
      case "set_theme": {
        if (!isThemeId(source.theme)) {
          dropped.push("없는 테마 이름이라 테마 변경을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "set_theme", theme: source.theme });
        break;
      }
      case "set_hotel": {
        const patch = hotelPatchFrom(source.hotel ?? source.patch);
        if (Object.keys(patch).length === 0) {
          dropped.push("바꿀 내용이 없는 숙소 수정을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "set_hotel", patch });
        break;
      }
      case "set_trip": {
        const patch = tripPatchFrom(source.trip ?? source.patch);
        if (Object.keys(patch).length === 0) {
          dropped.push("바꿀 내용이 없는 여행 정보 수정을 건너뛰었습니다.");
          break;
        }
        ops.push({ op: "set_trip", patch });
        break;
      }
      default:
        dropped.push(`알 수 없는 변경(${kind || "?"})을 건너뛰었습니다.`);
    }
  }

  return { ops, dropped };
}

function replaceStop(day: Day, stopId: string, next: (stop: Stop) => Stop): Day {
  return { ...day, stops: day.stops.map((stop) => (stop.id === stopId ? next(stop) : stop)) };
}

/** Applies validated operations to a trip. Pure: the input trip is never mutated. */
export function applyOps(trip: Trip, ops: Op[]): ApplyResult {
  let working = trip;
  let applied = 0;
  const warnings: string[] = [];
  const touchedDayIds = new Set<string>();
  const touchedStopIds = new Set<string>();

  for (const op of ops) {
    const dayIndex = "dayId" in op ? working.days.findIndex((item) => item.id === op.dayId) : -1;

    switch (op.op) {
      case "add_stop": {
        if (dayIndex < 0) break;
        const day = working.days[dayIndex];
        const stops = [...day.stops];
        const index =
          op.index === undefined ? stops.length : Math.min(Math.max(op.index, 0), stops.length);
        stops.splice(index, 0, op.stop);
        const days = [...working.days];
        days[dayIndex] = { ...day, stops };
        working = { ...working, days };
        touchedDayIds.add(day.id);
        touchedStopIds.add(op.stop.id);
        applied += 1;
        break;
      }
      case "update_stop": {
        if (dayIndex < 0) break;
        const day = working.days[dayIndex];
        if (!day.stops.some((stop) => stop.id === op.stopId)) break;
        const days = [...working.days];
        days[dayIndex] = replaceStop(day, op.stopId, (stop) => ({ ...stop, ...op.patch }));
        working = { ...working, days };
        touchedDayIds.add(day.id);
        touchedStopIds.add(op.stopId);
        applied += 1;
        break;
      }
      case "delete_stop": {
        if (dayIndex < 0) break;
        const day = working.days[dayIndex];
        if (!day.stops.some((stop) => stop.id === op.stopId)) break;
        const days = [...working.days];
        days[dayIndex] = { ...day, stops: day.stops.filter((stop) => stop.id !== op.stopId) };
        working = { ...working, days };
        touchedDayIds.add(day.id);
        touchedStopIds.add(op.stopId);
        applied += 1;
        break;
      }
      case "move_stop": {
        if (dayIndex < 0) break;
        const day = working.days[dayIndex];
        const from = day.stops.findIndex((stop) => stop.id === op.stopId);
        if (from < 0) break;
        const stops = [...day.stops];
        const [moved] = stops.splice(from, 1);
        const to = Math.min(Math.max(op.toIndex, 0), stops.length);
        stops.splice(to, 0, moved);
        const days = [...working.days];
        days[dayIndex] = { ...day, stops };
        working = { ...working, days };
        touchedDayIds.add(day.id);
        touchedStopIds.add(op.stopId);
        applied += 1;
        break;
      }
      case "add_day": {
        const days = [...working.days];
        const index =
          op.index === undefined ? days.length : Math.min(Math.max(op.index, 0), days.length);
        days.splice(index, 0, op.day);
        working = { ...working, days };
        touchedDayIds.add(op.day.id);
        applied += 1;
        break;
      }
      case "update_day": {
        if (dayIndex < 0) break;
        const days = [...working.days];
        days[dayIndex] = { ...working.days[dayIndex], ...op.patch };
        working = { ...working, days };
        touchedDayIds.add(op.dayId);
        applied += 1;
        break;
      }
      case "delete_day": {
        if (dayIndex < 0) break;
        if (working.days.length <= 1) {
          warnings.push("마지막 남은 날짜는 삭제하지 않았습니다.");
          break;
        }
        const days = working.days.filter((item) => item.id !== op.dayId);
        working = { ...working, days };
        touchedDayIds.add(op.dayId);
        applied += 1;
        break;
      }
      case "set_travel_mode": {
        if (dayIndex < 0) break;
        const days = [...working.days];
        days[dayIndex] = { ...working.days[dayIndex], travelMode: op.travelMode };
        working = { ...working, days };
        touchedDayIds.add(op.dayId);
        applied += 1;
        break;
      }
      case "set_theme": {
        working = { ...working, theme: op.theme };
        applied += 1;
        break;
      }
      case "set_hotel": {
        working = { ...working, hotel: { ...working.hotel, ...op.patch } };
        applied += 1;
        break;
      }
      case "set_trip": {
        working = { ...working, ...op.patch };
        applied += 1;
        break;
      }
    }
  }

  if (applied > 0) {
    working = { ...working, updatedAt: new Date().toISOString() };
  }

  return {
    trip: working,
    applied,
    warnings,
    touchedDayIds: [...touchedDayIds],
    touchedStopIds: [...touchedStopIds],
  };
}

export function sortDays(trip: Trip): Trip {
  const days = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  return { ...trip, days };
}
