"use client";

import { monthDay } from "@/lib/format";
import { LABELS } from "@/lib/labels";
import { googleEmbedUrl, googleRouteUrl, googleSearchUrl } from "@/lib/maps";
import type { Day, Stop, Trip } from "@/lib/types";

type Props = {
  trip: Trip;
  day: Day | null;
  stop: Stop | null;
};

export function MapPanel({ trip, day, stop }: Props) {
  const query = stop?.query || trip.hotel.query;
  const title = stop?.name || trip.hotel.displayName;
  const openHref = googleSearchUrl(query);

  return (
    <section className="map-panel" aria-label="지도">
      <div className="map-panel__inner">
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">{LABELS.mapEyebrow}</p>
            <h2>{title}</h2>
          </div>
          <a className="map-open-link" href={openHref} target="_blank" rel="noreferrer">
            {LABELS.openInGoogleMaps}
          </a>
        </div>

        <div className="map-frame-wrap">
          <iframe
            key={query}
            title={`${title} Google Maps`}
            src={googleEmbedUrl(query)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="map-details">
          {stop && day ? (
            <>
              <h3 className="map-details__title">
                {monthDay(day.date)} · {stop.category}
              </h3>
              {stop.note ? <p className="map-details__text">{stop.note}</p> : null}
              <div className="tag-row">
                {stop.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`tag${stop.booked || tag.includes("예약") ? " is-booked" : stop.free || tag.includes("무료") ? " is-free" : ""}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="map-actions">
                <a className="place-link" href={googleSearchUrl(stop.query)} target="_blank" rel="noreferrer">
                  {LABELS.openPlace}
                </a>
                <a
                  className="place-link"
                  href={googleRouteUrl([{ query: trip.hotel.query }, { query: stop.query }], "transit", trip.hotel.query)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {LABELS.routeFromHotel}
                </a>
                <a
                  className="place-link"
                  href={googleRouteUrl(day.stops, day.travelMode, trip.hotel.query)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {LABELS.todayRoute}
                </a>
              </div>
            </>
          ) : (
            <>
              <h3 className="map-details__title">{trip.hotel.displayName}</h3>
              <p className="map-details__text">
                {trip.hotel.address || trip.hotel.name}
                {trip.hotel.note ? ` · ${trip.hotel.note}` : ""}
              </p>
              <div className="map-actions">
                <a className="place-link" href={googleSearchUrl(trip.hotel.query)} target="_blank" rel="noreferrer">
                  {LABELS.hotelMapLink}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
