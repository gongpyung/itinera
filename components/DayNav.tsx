"use client";

import { LABELS } from "@/lib/labels";
import type { Day } from "@/lib/types";

type Props = {
  days: Day[];
  activeDay: string;
  onSelect: (dayId: string) => void;
};

export function DayNav({ days, activeDay, onSelect }: Props) {
  return (
    <aside className="day-nav" aria-label="일자 선택">
      <button
        type="button"
        className={`day-nav__button${activeDay === "all" ? " is-active" : ""}`}
        onClick={() => onSelect("all")}
      >
        {LABELS.allDays}
      </button>
      {days.map((day, index) => (
        <button
          key={day.id}
          type="button"
          className={`day-nav__button${activeDay === day.id ? " is-active" : ""}`}
          onClick={() => onSelect(day.id)}
          title={day.title}
        >
          {index + 1}
          {LABELS.daySuffix}
        </button>
      ))}
    </aside>
  );
}
