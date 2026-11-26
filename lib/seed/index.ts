import type { AppState } from "../types";
import { STORAGE_VERSION } from "../storage";
import { sydneyTrip } from "./sydney";
import { sapporoTrip } from "./sapporo";

/**
 * Trips that ship with the app. The upcoming Sapporo trip is active first;
 * the Sydney itinerary is carried over byte-for-byte from the static version.
 * Anything the user changes is stored in localStorage and overrides these.
 */
export function createInitialState(): AppState {
  return {
    version: STORAGE_VERSION,
    activeTripId: sapporoTrip.id,
    trips: [sapporoTrip, sydneyTrip],
  };
}
