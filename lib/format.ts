const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  return !Number.isNaN(toDate(value).getTime());
}

/** Parses YYYY-MM-DD as a local date (no UTC shift). */
export function toDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "2026-12-17" → "12/17" */
export function monthDay(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  const date = toDate(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function weekday(iso: string): string {
  if (!isIsoDate(iso)) return "";
  return WEEKDAYS[toDate(iso).getDay()];
}

/** "2026-12-17" → "12월 17일 (목)" */
export function koreanDate(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  const date = toDate(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday(iso)})`;
}

/** "2026-12-17", "2026-12-20" → "12월 17일 - 12월 20일" */
export function dateRange(start: string, end: string): string {
  if (!isIsoDate(start) || !isIsoDate(end)) return "";
  const a = toDate(start);
  const b = toDate(end);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.getMonth() + 1}월 ${a.getDate()}일 - ${b.getDate()}일`;
  }
  return `${a.getMonth() + 1}월 ${a.getDate()}일 - ${b.getMonth() + 1}월 ${b.getDate()}일`;
}

export function addDays(iso: string, days: number): string {
  const date = toDate(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function daysInRange(start: string, end: string): string[] {
  if (!isIsoDate(start) || !isIsoDate(end)) return [];
  const out: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 120) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return out;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  return `${days}일 전`;
}
