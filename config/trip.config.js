/**
 * Trip configuration — edit this file when starting a new trip.
 * Pair with data/itinerary.js for the per-day schedule + hotel info.
 */
window.TRIP_CONFIG = {
  /** <html lang="..."> */
  htmlLang: "ko",

  /** Browser tab title */
  documentTitle: "콩부부 시드니 여행 ❤️",

  /** Small uppercase label above the main heading (date range, season, etc.) */
  eyebrow: "4월 30일 - 5월 5일",

  /** Main heading text shown over the hero image */
  title: "콩부부 시드니 여행 ❤️",

  /** Hotel block tag prefix; the hotel name comes from data/itinerary.js */
  hotelLabelPrefix: "숙소",

  /**
   * Pill chips next to the heading. Free-form short strings.
   * Tokens "{days}" and "{stops}" are replaced with counts derived
   * from data/itinerary.js so the chips stay accurate when the
   * itinerary changes.
   */
  summaryChips: ["{days}일", "{stops}장소", "Google Maps"],

  /** Aria-label for the itinerary <section> */
  itineraryAriaLabel: "시드니 여행 일정",

  /** Heading shown above the day list */
  itineraryHeading: "일정표",
  itineraryEyebrow: "Itinerary",

  /** Map panel headings */
  mapEyebrow: "Map",
  mapHeading: "Map",

  /** Link labels */
  hotelMapLinkLabel: "숙소 지도",
  calendarExportLabel: "캘린더 추가",
  todayRouteLinkLabel: "오늘 경로",
  openInGoogleMapsLabel: "Google Maps",
  openPlaceLabel: "장소 열기",
  routeFromHotelLabel: "숙소에서 길찾기",
  todayRouteCardLabel: "오늘 경로",

  /** Day filter (sticky nav) */
  allDaysLabel: "전체",
  dayButtonSuffix: "일",

  /** Inline mobile map close button */
  inlineMapCloseLabel: "닫기",

  /**
   * Hero image shown behind the heading.
   * Any URL the browser can fetch (Unsplash, your own CDN, local file).
   * Will be injected via CSS variable --hero-image.
   */
  heroImage:
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1800&q=80",

  /**
   * Color theme preset. Pick one of:
   *   harbour     — teal / coral / amber (sydney default)
   *   sakura      — soft pink / cream
   *   ocean       — cyan / blue
   *   forest      — green / olive
   *   sunset      — orange / coral
   *   monochrome  — neutral grey
   */
  theme: "harbour",
};
