"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { daysInRange, monthDay } from "./format";
import { newId } from "./ids";
import { applyOps, type Op } from "./ops";
import { createInitialState } from "./seed";
import { STORAGE_VERSION, loadState, saveState } from "./storage";
import type { AppState, ThemeId, Trip } from "./types";

export type NewTripInput = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  hotelName: string;
  theme: ThemeId;
  heroImage: string;
};

export type RunOpsResult = { applied: number; warnings: string[] };

const HISTORY_LIMIT = 20;

function blankDays(startDate: string, endDate: string) {
  const dates = daysInRange(startDate, endDate);
  const list = dates.length > 0 ? dates : [startDate];
  return list.map((date, index) => ({
    id: newId("day"),
    date,
    title: index === 0 ? "도착" : index === list.length - 1 ? "귀국" : `${monthDay(date)} 일정`,
    summary: "",
    travelMode: "walking" as const,
    stops: [],
  }));
}

/**
 * Single source of truth for trips: seeds → localStorage, every mutation goes
 * through here so the itinerary, the AI patch, and the undo stack stay in sync.
 */
export function useTripStore() {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const historyRef = useRef<{ label: string; state: AppState }[]>([]);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [lastActionLabel, setLastActionLabel] = useState("");

  useEffect(() => {
    const stored = loadState();
    if (stored) {
      stateRef.current = stored;
      setState(stored);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const apply = useCallback((next: AppState, label?: string) => {
    if (label) {
      historyRef.current = [...historyRef.current.slice(-(HISTORY_LIMIT - 1)), { label, state: stateRef.current }];
      setHistoryDepth(historyRef.current.length);
      setLastActionLabel(label);
    }
    stateRef.current = next;
    setState(next);
  }, []);

  const activeTrip = useMemo(
    () => state.trips.find((trip) => trip.id === state.activeTripId) ?? state.trips[0],
    [state],
  );

  const selectTrip = useCallback(
    (tripId: string) => {
      const current = stateRef.current;
      if (!current.trips.some((trip) => trip.id === tripId)) return;
      apply({ ...current, activeTripId: tripId });
    },
    [apply],
  );

  const mapActive = useCallback(
    (updater: (trip: Trip) => Trip, label?: string) => {
      const current = stateRef.current;
      const trips = current.trips.map((trip) => (trip.id === current.activeTripId ? updater(trip) : trip));
      apply({ ...current, trips }, label);
    },
    [apply],
  );

  const mapTrip = useCallback(
    (tripId: string, updater: (trip: Trip) => Trip, label?: string) => {
      const current = stateRef.current;
      const trips = current.trips.map((trip) => (trip.id === tripId ? updater(trip) : trip));
      apply({ ...current, trips }, label);
    },
    [apply],
  );

  /** Applies itinerary patches and returns what landed, for the chat/editor UI. */
  const runOps = useCallback(
    (ops: Op[], label = "일정 변경", tripId?: string): RunOpsResult => {
      const current = stateRef.current;
      const targetId = tripId ?? current.activeTripId;
      const trip = current.trips.find((item) => item.id === targetId);
      if (!trip) return { applied: 0, warnings: ["여행을 찾지 못했습니다."] };

      const result = applyOps(trip, ops);
      if (result.applied > 0) {
        const trips = current.trips.map((item) => (item.id === trip.id ? result.trip : item));
        apply({ ...current, trips }, label);
      }
      return { applied: result.applied, warnings: [...result.warnings] };
    },
    [apply],
  );

  const updateTrip = useCallback(
    (tripId: string, patch: Partial<Trip>) => {
      mapTrip(tripId, (trip) => ({ ...trip, ...patch, updatedAt: new Date().toISOString() }), "여행 정보 수정");
    },
    [mapTrip],
  );

  const createTrip = useCallback(
    (input: NewTripInput) => {
      const current = stateRef.current;
      const now = new Date().toISOString();
      const startDate = input.startDate;
      const endDate = input.endDate < startDate ? startDate : input.endDate;
      const trip: Trip = {
        id: newId("trip"),
        title: input.title || "새 여행",
        destination: input.destination,
        eyebrow: "",
        startDate,
        endDate,
        heroImage: input.heroImage,
        theme: input.theme,
        hotel: {
          name: input.hotelName,
          displayName: input.hotelName,
          query: input.hotelName,
        },
        days: blankDays(startDate, endDate),
        createdAt: now,
        updatedAt: now,
      };
      apply({ ...current, trips: [...current.trips, trip], activeTripId: trip.id }, "새 여행 추가");
      return trip;
    },
    [apply],
  );

  const duplicateTrip = useCallback(
    (tripId: string) => {
      const current = stateRef.current;
      const source = current.trips.find((trip) => trip.id === tripId);
      if (!source) return;
      const now = new Date().toISOString();
      const copy: Trip = {
        ...source,
        id: newId("trip"),
        title: `${source.title} 복사`,
        days: source.days.map((day) => ({
          ...day,
          id: newId("day"),
          stops: day.stops.map((stop) => ({ ...stop, id: newId("stop") })),
        })),
        createdAt: now,
        updatedAt: now,
      };
      apply({ ...current, trips: [...current.trips, copy], activeTripId: copy.id }, "여행 복제");
    },
    [apply],
  );

  const deleteTrip = useCallback(
    (tripId: string) => {
      const current = stateRef.current;
      if (current.trips.length <= 1) return;
      const trips = current.trips.filter((trip) => trip.id !== tripId);
      const activeTripId = current.activeTripId === tripId ? trips[0].id : current.activeTripId;
      apply({ ...current, trips, activeTripId }, "여행 삭제");
    },
    [apply],
  );

  /** Adds imported trips next to the existing ones (ids are re-minted on collision). */
  const replaceTrips = useCallback(
    (trips: Trip[]) => {
      const current = stateRef.current;
      const used = new Set(current.trips.map((trip) => trip.id));
      const added = trips.map((trip) => {
        let id = trip.id;
        if (used.has(id)) id = newId("trip");
        used.add(id);
        return { ...trip, id };
      });
      apply(
        {
          version: STORAGE_VERSION,
          trips: [...current.trips, ...added],
          activeTripId: added[0]?.id ?? current.activeTripId,
        },
        "여행 불러오기",
      );
    },
    [apply],
  );

  const undo = useCallback(() => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setHistoryDepth(historyRef.current.length);
    apply(previous.state);
  }, [apply]);

  return {
    state,
    activeTrip,
    hydrated,
    canUndo: historyDepth > 0,
    lastActionLabel,
    selectTrip,
    createTrip,
    updateTrip,
    duplicateTrip,
    deleteTrip,
    runOps,
    replaceTrips,
    undo,
  };
}
