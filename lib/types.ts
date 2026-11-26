export const THEME_IDS = [
  "harbour",
  "sakura",
  "ocean",
  "forest",
  "sunset",
  "monochrome",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const TRAVEL_MODES = ["walking", "transit", "driving"] as const;

export type TravelMode = (typeof TRAVEL_MODES)[number];

export type Stop = {
  /** Stable id, unique inside the trip. */
  id: string;
  /** Free-form time label: "09:55", "점심", "선택". */
  time: string;
  name: string;
  category: string;
  /** Search query used by Google Maps embed / directions. */
  query: string;
  lat?: number;
  lng?: number;
  note: string;
  tags: string[];
  /** Renders the red "예약" tag style. */
  booked?: boolean;
  /** Renders the green "무료" tag style. */
  free?: boolean;
};

export type Day = {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  summary: string;
  travelMode: TravelMode;
  stops: Stop[];
};

export type Hotel = {
  name: string;
  displayName: string;
  query: string;
  lat?: number;
  lng?: number;
  address?: string;
  note?: string;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  /** Small label above the heading; regenerated from the dates when empty. */
  eyebrow: string;
  /** ISO date, YYYY-MM-DD. */
  startDate?: string;
  /** ISO date, YYYY-MM-DD. */
  endDate?: string;
  heroImage: string;
  theme: ThemeId;
  hotel: Hotel;
  days: Day[];
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  version: number;
  activeTripId: string;
  trips: Trip[];
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** Non-fatal notes about what a patch could not apply. */
  warnings?: string[];
  createdAt: string;
};
