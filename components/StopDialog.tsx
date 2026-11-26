"use client";

import { useState } from "react";
import type { Stop } from "@/lib/types";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

type Props = {
  dayLabel: string;
  stop?: Stop;
  onClose: () => void;
  onSave: (stop: Stop) => void;
  onDelete?: () => void;
  onMove?: (direction: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

const EMPTY: Stop = {
  id: "",
  time: "",
  name: "",
  category: "일정",
  query: "",
  note: "",
  tags: [],
};

export function StopDialog({ dayLabel, stop, onClose, onSave, onDelete, onMove, canMoveUp, canMoveDown }: Props) {
  const editing = Boolean(stop);
  const [time, setTime] = useState(stop?.time ?? "");
  const [name, setName] = useState(stop?.name ?? "");
  const [category, setCategory] = useState(stop?.category ?? EMPTY.category);
  const [query, setQuery] = useState(stop?.query ?? "");
  const [note, setNote] = useState(stop?.note ?? "");
  const [tags, setTags] = useState((stop?.tags ?? []).join(", "));
  const [booked, setBooked] = useState(Boolean(stop?.booked));
  const [free, setFree] = useState(Boolean(stop?.free));
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setError("장소 이름을 입력해 주세요.");
      return;
    }
    onSave({
      ...(stop ?? EMPTY),
      time: time.trim(),
      name: name.trim(),
      category: category.trim() || "일정",
      query: query.trim() || name.trim(),
      note: note.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 10),
      booked: booked || undefined,
      free: free || undefined,
    });
    onClose();
  };

  return (
    <Modal
      title={editing ? "장소 수정" : "장소 추가"}
      description={dayLabel}
      onClose={onClose}
      footer={
        <>
          {editing && onDelete ? (
            <button className="button button--danger" type="button" onClick={onDelete}>
              <Icon.trash size={16} /> 삭제
            </button>
          ) : null}
          {editing && onMove ? (
            <span className="modal-move-group">
              <button
                className="icon-button"
                type="button"
                onClick={() => onMove(-1)}
                disabled={!canMoveUp}
                aria-label="위로 이동"
              >
                <Icon.arrowUp size={16} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => onMove(1)}
                disabled={!canMoveDown}
                aria-label="아래로 이동"
              >
                <Icon.arrowDown size={16} />
              </button>
            </span>
          ) : null}
          <span className="modal-spacer" />
          <button className="button button--ghost" type="button" onClick={onClose}>
            취소
          </button>
          <button className="button button--primary" type="button" onClick={submit}>
            저장
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field">
          <span>시간</span>
          <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="09:30 · 점심 · 선택" />
        </label>
        <label className="field">
          <span>분류</span>
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="카페 · 식당 · 이동" />
        </label>
        <label className="field field--full">
          <span>장소 이름</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="예: 흰수염 폭포" />
        </label>
        <label className="field field--full">
          <span>지도 검색어</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="상호명 지역명 (비우면 장소 이름 사용)"
          />
        </label>
        <label className="field field--full">
          <span>메모</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>
        <label className="field field--full">
          <span>태그 (쉼표로 구분)</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="도보 10분, 예약, 제안" />
        </label>
        <div className="field field--full field--checks">
          <label className="check">
            <input type="checkbox" checked={booked} onChange={(event) => setBooked(event.target.checked)} />
            예약 완료
          </label>
          <label className="check">
            <input type="checkbox" checked={free} onChange={(event) => setFree(event.target.checked)} />
            무료
          </label>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </Modal>
  );
}
