import type { Stop, TravelMode } from "./types";

export function googleSearchUrl(query: string): string {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query);
  return url.toString();
}

export function googleEmbedUrl(query: string): string {
  const url = new URL("https://maps.google.com/maps");
  url.searchParams.set("q", query);
  url.searchParams.set("output", "embed");
  return url.toString();
}

/** Multi-stop directions; falls back to a search URL when there is nothing to route. */
export function googleRouteUrl(
  stops: Pick<Stop, "query">[],
  travelMode: TravelMode = "walking",
  fallbackQuery = "",
): string {
  const routeStops = stops.filter((stop) => stop.query);

  if (routeStops.length === 0) {
    return googleSearchUrl(fallbackQuery || "Google Maps");
  }
  if (routeStops.length === 1) {
    return googleSearchUrl(routeStops[0].query);
  }

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", routeStops[0].query);
  url.searchParams.set("destination", routeStops[routeStops.length - 1].query);
  url.searchParams.set("travelmode", travelMode);

  const waypoints = routeStops
    .slice(1, -1)
    .map((stop) => stop.query)
    .join("|");
  if (waypoints) {
    url.searchParams.set("waypoints", waypoints);
  }
  return url.toString();
}
