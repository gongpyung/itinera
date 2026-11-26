"use client";

import { monthDay, weekday } from "@/lib/format";
import { LABELS, TRAVEL_MODE_LABELS } from "@/lib/labels";
import { googleEmbedUrl, googleRouteUrl, googleSearchUrl } from "@/lib/maps";
import type { Day, Stop, TravelMode, Trip } from "@/lib/types";
import { TRAVEL_MODES } from "@/lib/types";
import { Icon } from "./Icon";

type Props = {
  trip: Trip;
  activeDay: string;
  activeCategories: Set<string>;
  selectedStopId: string | null;
  inlineStopId: string | null;
  visited: Set<string>;
  flashStopIds: Set<string>;
  onSelectStop: (dayId: string, stopId: string) => void;
  onToggleVisited: (dayId: string, stopId: string) => void;
  onEditStop: (dayId: string, stopId: string | null) => void;
  onDeleteDay: (dayId: string) => void;
  onTravelMode: (dayId: string, mode: TravelMode) => void;
};

export function visitedKey(dayId: string, stopId: string): string {
  return `${dayId}:${stopId}`;
}

function tagClass(tag: string, stop: Stop): string {
  if (stop.booked || tag.includes("예약")) return "tag is-booked";
  if (stop.free || tag.includes("무료") || tag.includes("자유")) return "tag is-free";
  return "tag";
}

function MapActions({ day, stop, trip }: { day: Day; stop: Stop; trip: Trip }) {
  return (
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
  );
}

function MapDetails({ day, stop, trip }: { day: Day; stop: Stop; trip: Trip }) {
  return (
    <>
      <h3 className="map-details__title">
        {monthDay(day.date)} · {stop.category}
      </h3>
      {stop.note ? <p className="map-details__text">{stop.note}</p> : null}
      {stop.tags.length > 0 ? (
        <div className="tag-row">
          {stop.tags.map((tag) => (
            <span key={tag} className={tagClass(tag, stop)}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <MapActions day={day} stop={stop} trip={trip} />
    </>
  );
}

function InlineMap({ day, stop, trip, onClose }: { day: Day; stop: Stop; trip: Trip; onClose: () => void }) {
  return (
    <div className="inline-map">
      <div className="inline-map__toolbar">
        <div>
          <p className="eyebrow">{LABELS.mapEyebrow}</p>
          <h4>{stop.name}</h4>
        </div>
        <button className="inline-map__close" type="button" onClick={onClose}>
          {LABELS.inlineMapClose}
        </button>
      </div>
      <div className="inline-map__frame">
        <iframe
          title={`${stop.name} Google Maps`}
          src={googleEmbedUrl(stop.query)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="inline-map__details">
        <MapDetails day={day} stop={stop} trip={trip} />
      </div>
    </div>
  );
}

function StopRow({
  day,
  stop,
  trip,
  isSelected,
  isVisited,
  isFlashing,
  inlineOpen,
  onSelect,
  onToggleVisited,
  onEdit,
  onCloseInline,
}: {
  day: Day;
  stop: Stop;
  trip: Trip;
  isSelected: boolean;
  isVisited: boolean;
  isFlashing: boolean;
  inlineOpen: boolean;
  onSelect: () => void;
  onToggleVisited: () => void;
  onEdit: () => void;
  onCloseInline: () => void;
}) {
  return (
    <>
      <div
        className={`stop-row${isVisited ? " is-visited" : ""}${isFlashing ? " is-flash" : ""}`}
        data-day={day.id}
        data-stop={stop.id}
      >
        <button
          type="button"
          className={`stop-card${isSelected ? " is-active" : ""}`}
          onClick={onSelect}
          aria-expanded={inlineOpen}
        >
          <span className="stop-time">{stop.time}</span>
          <span className="stop-body">
            <span className="stop-title-row">
              <span className="stop-category">{stop.category}</span>
              <strong className="stop-name">{stop.name}</strong>
            </span>
            {stop.note ? <span className="stop-note">{stop.note}</span> : null}
            {stop.tags.length > 0 ? (
              <span className="tag-row">
                {stop.tags.map((tag) => (
                  <span key={tag} className={tagClass(tag, stop)}>
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
        </button>
        <div className="stop-side">
          <button
            type="button"
            className="stop-check"
            aria-label="방문 체크"
            aria-pressed={isVisited}
            onClick={onToggleVisited}
          >
            <span aria-hidden="true">✓</span>
          </button>
          <button type="button" className="stop-edit" aria-label="장소 수정" onClick={onEdit}>
            <Icon.pencil size={14} />
          </button>
        </div>
      </div>
      {inlineOpen ? <InlineMap day={day} stop={stop} trip={trip} onClose={onCloseInline} /> : null}
    </>
  );
}

export function ItineraryList({
  trip,
  activeDay,
  activeCategories,
  selectedStopId,
  inlineStopId,
  visited,
  flashStopIds,
  onSelectStop,
  onToggleVisited,
  onEditStop,
  onDeleteDay,
  onTravelMode,
}: Props) {
  const filtering = activeCategories.size > 0 && activeDay === "all";
  const visibleDays = activeDay === "all" ? trip.days : trip.days.filter((day) => day.id === activeDay);

  if (visibleDays.length === 0) {
    return (
      <div className="day-list">
        <p className="empty-state">이 여행에는 아직 일자가 없습니다. 여행 편집에서 기간을 넣어 주세요.</p>
      </div>
    );
  }

  return (
    <div className="day-list">
      {visibleDays.map((day) => {
        const dayIndex = trip.days.findIndex((item) => item.id === day.id);
        const visibleStops = filtering
          ? day.stops.filter((stop) => activeCategories.has(stop.category))
          : day.stops;
        const hiddenByCategory = filtering && visibleStops.length === 0;

        return (
          <article
            className={`day-card${hiddenByCategory ? " is-hidden-by-category" : ""}`}
            data-day-card={day.id}
            key={day.id}
          >
            <header className="day-card__header">
              <span className="day-number">{dayIndex + 1}</span>
              <div className="day-card__heading">
                <h3>
                  {monthDay(day.date)} <span className="day-weekday">({weekday(day.date)})</span> {day.title}
                </h3>
                {day.summary ? <p className="day-meta">{day.summary}</p> : null}
              </div>
              <div className="day-card__aside">
                <a
                  className="route-link"
                  href={googleRouteUrl(day.stops, day.travelMode, trip.hotel.query)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {LABELS.todayRouteLink}
                </a>
                <div className="day-tools">
                  <select
                    className="mode-select"
                    aria-label="이동 수단"
                    value={day.travelMode}
                    onChange={(event) => onTravelMode(day.id, event.target.value as TravelMode)}
                  >
                    {TRAVEL_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {TRAVEL_MODE_LABELS[mode]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    onClick={() => onEditStop(day.id, null)}
                    aria-label="장소 추가"
                    title="장소 추가"
                  >
                    <Icon.plus size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    onClick={() => onDeleteDay(day.id)}
                    aria-label="날짜 삭제"
                    title="날짜 삭제"
                  >
                    <Icon.trash size={15} />
                  </button>
                </div>
              </div>
            </header>

            <div className="stop-list">
              {day.stops.length === 0 ? (
                <div className="empty-state empty-state--inline">
                  <p>아직 장소가 없습니다.</p>
                  <button className="button button--ghost button--small" type="button" onClick={() => onEditStop(day.id, null)}>
                    <Icon.plus size={15} /> 장소 추가
                  </button>
                </div>
              ) : null}
              {day.stops.map((stop) => {
                const hidden = filtering && !activeCategories.has(stop.category);
                if (hidden) return null;
                return (
                  <StopRow
                    key={stop.id}
                    day={day}
                    stop={stop}
                    trip={trip}
                    isSelected={selectedStopId === stop.id}
                    isVisited={visited.has(visitedKey(day.id, stop.id))}
                    isFlashing={flashStopIds.has(stop.id)}
                    inlineOpen={inlineStopId === stop.id}
                    onSelect={() => onSelectStop(day.id, stop.id)}
                    onToggleVisited={() => onToggleVisited(day.id, stop.id)}
                    onEdit={() => onEditStop(day.id, stop.id)}
                    onCloseInline={() => onSelectStop(day.id, stop.id)}
                  />
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
