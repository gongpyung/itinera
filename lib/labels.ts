/** UI copy carried over from the static version's config/trip.config.js. */
export const LABELS = {
  hotelPrefix: "숙소",
  itineraryEyebrow: "Itinerary",
  itineraryHeading: "일정표",
  mapEyebrow: "Map",
  hotelMapLink: "숙소 지도",
  todayRouteLink: "오늘 경로",
  openInGoogleMaps: "Google Maps",
  openPlace: "장소 열기",
  routeFromHotel: "숙소에서 길찾기",
  todayRoute: "오늘 경로",
  allDays: "전체",
  daySuffix: "일",
  inlineMapClose: "닫기",
} as const;

export const TRAVEL_MODE_LABELS: Record<string, string> = {
  walking: "도보",
  transit: "대중교통",
  driving: "자동차",
};
