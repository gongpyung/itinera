"use client";

import { useRef, type CSSProperties } from "react";
import { dateRange } from "@/lib/format";
import { LABELS } from "@/lib/labels";
import type { Trip } from "@/lib/types";
import { Icon } from "./Icon";

type Props = {
  trip: Trip;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onNewTrip: () => void;
  onEditTrip: () => void;
  onDuplicateTrip: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  chatOpen: boolean;
  onToggleChat: () => void;
};

export function TripHeader({
  trip,
  trips,
  onSelectTrip,
  onNewTrip,
  onEditTrip,
  onDuplicateTrip,
  onExport,
  onImport,
  chatOpen,
  onToggleChat,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const totalStops = trip.days.reduce((sum, day) => sum + day.stops.length, 0);
  const heroStyle = trip.heroImage
    ? ({ "--hero-image": `url("${trip.heroImage}")` } as CSSProperties)
    : undefined;
  const eyebrow =
    trip.eyebrow ||
    (trip.startDate && trip.endDate ? dateRange(trip.startDate, trip.endDate) : "날짜 미정");

  return (
    <header className="trip-header">
      <div className="hero-media" aria-hidden="true" style={heroStyle} />
      <div className="trip-header__content">
        <div className="trip-header__title">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{trip.title}</h1>
          <div className="trip-summary" aria-label="여행 요약">
            <span>{trip.days.length}일</span>
            <span>{totalStops}장소</span>
            <span>Google Maps</span>
          </div>
          <p className="hotel">
            {LABELS.hotelPrefix}: {trip.hotel.displayName}
            {trip.hotel.note ? <span className="hotel-note"> · {trip.hotel.note}</span> : null}
          </p>
        </div>

        <div className="trip-header__panel">
          <div className="trip-switcher" role="tablist" aria-label="여행 전환">
            {trips.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === trip.id}
                className={`trip-pill${item.id === trip.id ? " is-active" : ""}`}
                onClick={() => onSelectTrip(item.id)}
              >
                <Icon.compass size={15} />
                <span>{item.title}</span>
              </button>
            ))}
            <button type="button" className="trip-pill trip-pill--add" onClick={onNewTrip}>
              <Icon.plus size={15} />
              <span>새 여행</span>
            </button>
          </div>

          <div className="trip-tools">
            <button type="button" className="tool-button" onClick={onEditTrip}>
              <Icon.settings size={15} />
              여행 편집
            </button>
            <button type="button" className="tool-button" onClick={onDuplicateTrip}>
              <Icon.layers size={15} />
              복제
            </button>
            <button type="button" className="tool-button" onClick={onExport}>
              <Icon.download size={15} />
              내보내기
            </button>
            <button type="button" className="tool-button" onClick={() => fileRef.current?.click()}>
              <Icon.upload size={15} />
              불러오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              className={`tool-button tool-button--chat${chatOpen ? " is-active" : ""}`}
              onClick={onToggleChat}
              aria-pressed={chatOpen}
            >
              <Icon.sparkles size={15} />
              AI 채팅
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
