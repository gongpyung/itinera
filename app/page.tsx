"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ChatPanel } from "@/components/ChatPanel";
import { DayNav } from "@/components/DayNav";
import { Icon } from "@/components/Icon";
import { ItineraryList, visitedKey } from "@/components/ItineraryList";
import { MapPanel } from "@/components/MapPanel";
import { Modal } from "@/components/Modal";
import { StopDialog } from "@/components/StopDialog";
import { TripDialog } from "@/components/TripDialog";
import { TripHeader } from "@/components/TripHeader";
import { LABELS } from "@/lib/labels";
import { newId } from "@/lib/ids";
import { googleSearchUrl } from "@/lib/maps";
import type { Op } from "@/lib/ops";
import { exportPayload, loadVisited, parseImport, saveVisited } from "@/lib/storage";
import { useTripStore, type NewTripInput } from "@/lib/store";
import type { Stop, TravelMode, Trip } from "@/lib/types";
import { useChat } from "@/lib/useChat";

type StopDialogState = { dayId: string; stopId: string | null };
type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};
type ToastState = { message: string; actionLabel?: string; onAction?: () => void };

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/(^-|-$)/g, "") || "trip"
  );
}

function touchedStopIds(ops: Op[]): string[] {
  const ids: string[] = [];
  for (const op of ops) {
    if (op.op === "add_stop") ids.push(op.stop.id);
    else if (op.op === "update_stop" || op.op === "delete_stop" || op.op === "move_stop") ids.push(op.stopId);
    else if (op.op === "add_day") ids.push(...op.day.stops.map((stop) => stop.id));
  }
  return ids;
}

export default function Page() {
  const store = useTripStore();
  const trip: Trip | undefined = store.activeTrip;

  const [activeDay, setActiveDay] = useState("all");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [inlineStopId, setInlineStopId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [flashStopIds, setFlashStopIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tripDialog, setTripDialog] = useState<"create" | "edit" | null>(null);
  const [stopDialog, setStopDialog] = useState<StopDialogState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const flashTimer = useRef<number | null>(null);
  const deepLinkRef = useRef<{ tripId: string; dayId: string; stopId: string } | null>(null);

  /* ---------- effects ---------- */

  useEffect(() => {
    if (!trip) return;
    document.documentElement.dataset.theme = trip.theme;
  }, [trip]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const narrow = window.matchMedia("(max-width: 1199px)");
    const sync = () => {
      setIsMobile(query.matches);
      if (narrow.matches) setChatOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    narrow.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      narrow.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1200px)").matches) setChatOpen(true);
  }, []);

  // Deep link: #/<tripId>/<dayId>/<stopId>
  useEffect(() => {
    if (!store.hydrated) return;
    const match = window.location.hash.match(/^#\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!match) return;
    const [, tripId, dayId, stopId] = match.map((part) => decodeURIComponent(part));
    if (!store.state.trips.some((item) => item.id === tripId)) return;
    deepLinkRef.current = { tripId, dayId, stopId };
    store.selectTrip(tripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated]);

  // Reset view state when the active trip changes (deep links win over the default).
  useEffect(() => {
    if (!trip) return;
    setActiveCategories(new Set());
    setInlineStopId(null);
    setVisited(new Set(loadVisited(trip.id)));

    const link = deepLinkRef.current;
    deepLinkRef.current = null;
    const linkedDay = link && link.tripId === trip.id ? trip.days.find((day) => day.id === link.dayId) : undefined;
    if (linkedDay) {
      const linkedStop = linkedDay.stops.find((stop) => stop.id === link?.stopId);
      setActiveDay(linkedDay.id);
      setSelectedDayId(linkedDay.id);
      setSelectedStopId(linkedStop?.id ?? linkedDay.stops[0]?.id ?? null);
      return;
    }

    setActiveDay("all");
    const firstDay = trip.days[0];
    setSelectedDayId(firstDay?.id ?? null);
    setSelectedStopId(firstDay?.stops[0]?.id ?? null);
    // Only the trip identity should reset the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);


  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(null), 4200);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  /* ---------- derived ---------- */

  const categories = useMemo(() => {
    if (!trip) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const day of trip.days) {
      for (const stop of day.stops) {
        if (stop.category && !seen.has(stop.category)) {
          seen.add(stop.category);
          list.push(stop.category);
        }
      }
    }
    return list;
  }, [trip]);

  const selected = useMemo(() => {
    if (!trip || !selectedDayId) return { day: null, stop: null };
    const day = trip.days.find((item) => item.id === selectedDayId) ?? null;
    const stop = day?.stops.find((item) => item.id === selectedStopId) ?? null;
    return { day, stop };
  }, [trip, selectedDayId, selectedStopId]);

  // Keep the address bar in step with the selected stop so a link can be shared.
  useEffect(() => {
    if (!trip || !selected.day || !selected.stop) return;
    const next = `#/${trip.id}/${selected.day.id}/${selected.stop.id}`;
    if (window.location.hash !== next) history.replaceState(null, "", next);
  }, [trip, selected]);

  const stopDialogData = useMemo(() => {
    if (!trip || !stopDialog) return null;
    const day = trip.days.find((item) => item.id === stopDialog.dayId);
    if (!day) return null;
    const index = stopDialog.stopId ? day.stops.findIndex((stop) => stop.id === stopDialog.stopId) : -1;
    return {
      day,
      stop: index >= 0 ? day.stops[index] : undefined,
      index,
    };
  }, [trip, stopDialog]);

  /* ---------- actions ---------- */

  const flash = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setFlashStopIds(new Set(ids));
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashStopIds(new Set()), 1800);
  }, []);

  const runOps = useCallback(
    (ops: Op[], label = "일정 변경", tripId?: string) => {
      const result = store.runOps(ops, label, tripId);
      flash(touchedStopIds(ops));
      return result;
    },
    [flash, store],
  );

  const chat = useChat(trip?.id, trip, runOps);

  const selectDay = (dayId: string) => {
    if (!trip) return;
    setActiveDay(dayId);
    setInlineStopId(null);
    const day = dayId === "all" ? trip.days[0] : trip.days.find((item) => item.id === dayId);
    setSelectedDayId(day?.id ?? null);
    setSelectedStopId(day?.stops[0]?.id ?? null);
  };

  const selectStop = (dayId: string, stopId: string) => {
    const togglingInline = isMobile && inlineStopId === stopId;
    setSelectedDayId(dayId);
    setSelectedStopId(stopId);
    setInlineStopId(isMobile ? (togglingInline ? null : stopId) : null);
  };

  const toggleVisited = (dayId: string, stopId: string) => {
    if (!trip) return;
    const key = visitedKey(dayId, stopId);
    const next = new Set(visited);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVisited(next);
    saveVisited(trip.id, [...next]);
  };

  const toggleCategory = (category: string) => {
    const next = new Set(activeCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setActiveCategories(next);
    setInlineStopId(null);
  };

  const saveStop = (stop: Stop) => {
    if (!stopDialog) return;
    if (stopDialog.stopId) {
      const { id: _id, ...patch } = stop;
      runOps(
        [{ op: "update_stop", dayId: stopDialog.dayId, stopId: stopDialog.stopId, patch }],
        "장소 수정",
      );
      setSelectedStopId(stopDialog.stopId);
    } else {
      const created: Stop = { ...stop, id: newId("stop") };
      runOps([{ op: "add_stop", dayId: stopDialog.dayId, stop: created }], "장소 추가");
      setSelectedDayId(stopDialog.dayId);
      setSelectedStopId(created.id);
    }
  };

  const deleteStop = () => {
    if (!stopDialog?.stopId) return;
    const target = stopDialog;
    setStopDialog(null);
    setConfirm({
      title: "장소를 삭제할까요?",
      description: "이 장소가 일정에서 빠집니다. 되돌리기 버튼으로 복구할 수 있어요.",
      confirmLabel: "삭제",
      onConfirm: () => {
        runOps([{ op: "delete_stop", dayId: target.dayId, stopId: target.stopId as string }], "장소 삭제");
        setSelectedStopId(null);
        setConfirm(null);
      },
    });
  };

  const moveStop = (direction: -1 | 1) => {
    if (!stopDialog?.stopId || !stopDialogData) return;
    const { index } = stopDialogData;
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= stopDialogData.day.stops.length) return;
    runOps(
      [{ op: "move_stop", dayId: stopDialog.dayId, stopId: stopDialog.stopId, toIndex }],
      "순서 변경",
    );
  };

  const deleteDay = (dayId: string) => {
    if (!trip) return;
    if (trip.days.length <= 1) {
      setToast({ message: "마지막 남은 날짜는 삭제할 수 없어요." });
      return;
    }
    setConfirm({
      title: "이 날짜를 삭제할까요?",
      description: "날짜와 그 안의 장소가 모두 빠집니다. 되돌리기로 복구할 수 있어요.",
      confirmLabel: "삭제",
      onConfirm: () => {
        runOps([{ op: "delete_day", dayId }], "날짜 삭제");
        setConfirm(null);
        if (selectedDayId === dayId) {
          setSelectedDayId(null);
          setSelectedStopId(null);
        }
      },
    });
  };

  const changeTravelMode = (dayId: string, travelMode: TravelMode) => {
    runOps([{ op: "set_travel_mode", dayId, travelMode }], "이동 수단 변경");
  };

  const createTrip = (input: NewTripInput) => {
    store.createTrip(input);
    setToast({ message: `'${input.title}' 여행을 추가했어요.` });
  };

  const exportTrips = () => {
    if (!trip) return;
    const payload = exportPayload(store.state.trips);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `itinera-${slugify(trip.title)}-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast({ message: `여행 ${store.state.trips.length}개를 JSON으로 내보냈어요.` });
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseImport(text);
      if ("error" in result) {
        setToast({ message: result.error });
        return;
      }
      store.replaceTrips(result.trips);
      setToast({ message: `여행 ${result.trips.length}개를 불러왔어요.` });
    } catch {
      setToast({ message: "파일을 읽지 못했어요. JSON 파일인지 확인해 주세요." });
    }
  };

  if (!trip) {
    return (
      <div className="app-shell">
        <p className="empty-state">여행 데이터를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className={`app-shell${chatOpen ? " chat-open" : ""}`}>
      <TripHeader
        trip={trip}
        trips={store.state.trips}
        onSelectTrip={store.selectTrip}
        onNewTrip={() => setTripDialog("create")}
        onEditTrip={() => setTripDialog("edit")}
        onDuplicateTrip={() => {
          store.duplicateTrip(trip.id);
          setToast({ message: "여행을 복제했어요." });
        }}
        onExport={exportTrips}
        onImport={importFile}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((value) => !value)}
      />

      <main className="planner">
        <DayNav days={trip.days} activeDay={activeDay} onSelect={selectDay} />

        <section className="itinerary" aria-label={`${trip.title} 일정`}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{LABELS.itineraryEyebrow}</p>
              <h2>{LABELS.itineraryHeading}</h2>
            </div>
            <div className="section-heading__actions">
              <button
                type="button"
                className="compact-link compact-link--button"
                onClick={() => {
                  if (store.canUndo) store.undo();
                }}
                disabled={!store.canUndo}
                title="마지막 변경 되돌리기"
              >
                <Icon.undo size={14} /> 되돌리기
              </button>
              <a
                className="compact-link"
                href={googleSearchUrl(trip.hotel.query)}
                target="_blank"
                rel="noreferrer"
              >
                {LABELS.hotelMapLink}
              </a>
            </div>
          </div>

          <CategoryFilter
            categories={categories}
            active={activeCategories}
            onToggle={toggleCategory}
            hidden={activeDay !== "all"}
          />

          <ItineraryList
            trip={trip}
            activeDay={activeDay}
            activeCategories={activeCategories}
            selectedStopId={selectedStopId}
            inlineStopId={inlineStopId}
            visited={visited}
            flashStopIds={flashStopIds}
            onSelectStop={selectStop}
            onToggleVisited={toggleVisited}
            onEditStop={(dayId, stopId) => setStopDialog({ dayId, stopId })}
            onDeleteDay={deleteDay}
            onTravelMode={changeTravelMode}
          />

          <p className="save-state">
            <Icon.check size={14} /> 변경 내용은 이 브라우저에 자동 저장됩니다 · 내보내기로 백업하세요
          </p>
        </section>

        <MapPanel trip={trip} day={selected.day} stop={selected.stop} />
      </main>

      <ChatPanel
        open={chatOpen}
        tripTitle={trip.title}
        messages={chat.messages}
        sending={chat.sending}
        error={chat.error}
        lastApplied={chat.lastApplied}
        canUndo={store.canUndo}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        onSend={chat.send}
        onClear={() => {
          chat.clear();
          setToast({ message: "이 여행의 대화를 지웠어요." });
        }}
        onUndo={store.undo}
        onDismissError={chat.dismissError}
      />

      {tripDialog ? (
        <TripDialog
          mode={tripDialog}
          trip={tripDialog === "edit" ? trip : undefined}
          onClose={() => setTripDialog(null)}
          onCreate={createTrip}
          onUpdate={(patch) => store.updateTrip(trip.id, patch)}
        />
      ) : null}

      {stopDialog && stopDialogData ? (
        <StopDialog
          dayLabel={`${trip.days.findIndex((day) => day.id === stopDialog.dayId) + 1}일차 · ${
            stopDialogData.day.title
          }`}
          stop={stopDialogData.stop}
          onClose={() => setStopDialog(null)}
          onSave={saveStop}
          onDelete={stopDialogData.stop ? deleteStop : undefined}
          onMove={stopDialogData.stop ? moveStop : undefined}
          canMoveUp={stopDialogData.index > 0}
          canMoveDown={
            Boolean(stopDialogData.stop) && stopDialogData.index < stopDialogData.day.stops.length - 1
          }
        />
      ) : null}

      {confirm ? (
        <Modal
          title={confirm.title}
          description={confirm.description}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="button button--ghost" type="button" onClick={() => setConfirm(null)}>
                취소
              </button>
              <button className="button button--danger" type="button" onClick={confirm.onConfirm}>
                {confirm.confirmLabel}
              </button>
            </>
          }
        >
          <p className="confirm-body">
            {confirm.confirmLabel} 후에도 상단의 되돌리기 버튼으로 직전 상태를 되살릴 수 있습니다.
          </p>
        </Modal>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
          <button type="button" className="icon-button icon-button--small" onClick={() => setToast(null)} aria-label="닫기">
            <Icon.close size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
