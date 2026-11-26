"use client";

import { useState } from "react";
import { THEMES } from "@/lib/themes";
import type { ThemeId, Trip } from "@/lib/types";
import type { NewTripInput } from "@/lib/store";
import { Modal } from "./Modal";

type Props = {
  mode: "create" | "edit";
  trip?: Trip;
  onClose: () => void;
  onCreate: (input: NewTripInput) => void;
  onUpdate: (patch: Partial<Trip>) => void;
};

export function TripDialog({ mode, trip, onClose, onCreate, onUpdate }: Props) {
  const [title, setTitle] = useState(trip?.title ?? "");
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [startDate, setStartDate] = useState(trip?.startDate ?? "");
  const [endDate, setEndDate] = useState(trip?.endDate ?? "");
  const [hotelName, setHotelName] = useState(trip?.hotel.displayName ?? "");
  const [theme, setTheme] = useState<ThemeId>(trip?.theme ?? "harbour");
  const [heroImage, setHeroImage] = useState(trip?.heroImage ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) {
      setError("여행 이름을 입력해 주세요.");
      return;
    }
    if (!startDate) {
      setError("출발일을 골라 주세요.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("귀국일이 출발일보다 빠를 수 없어요.");
      return;
    }

    if (mode === "create") {
      onCreate({
        title: title.trim(),
        destination: destination.trim(),
        startDate,
        endDate: endDate || startDate,
        hotelName: hotelName.trim(),
        theme,
        heroImage: heroImage.trim(),
      });
    } else if (trip) {
      onUpdate({
        title: title.trim(),
        destination: destination.trim(),
        startDate,
        endDate: endDate || startDate,
        theme,
        heroImage: heroImage.trim(),
        hotel: { ...trip.hotel, displayName: hotelName.trim() || trip.hotel.displayName },
      });
    }
    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "새 여행 추가" : "여행 정보 수정"}
      description={
        mode === "create"
          ? "기간을 넣으면 날짜별 빈 일정이 만들어집니다. 장소는 AI 채팅이나 일정 카드에서 채우면 됩니다."
          : "이름·기간·테마를 바꿔도 이미 적은 장소는 그대로 남습니다."
      }
      onClose={onClose}
      footer={
        <>
          <button className="button button--ghost" type="button" onClick={onClose}>
            취소
          </button>
          <button className="button button--primary" type="button" onClick={submit}>
            {mode === "create" ? "여행 만들기" : "저장"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>여행 이름</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 삿포로 겨울 여행 ❄️"
            autoFocus
          />
        </label>
        <label className="field field--full">
          <span>도시 / 지역</span>
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="예: 삿포로, 홋카이도"
          />
        </label>
        <label className="field">
          <span>출발일</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="field">
          <span>귀국일</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label className="field field--full">
          <span>숙소 이름</span>
          <input
            value={hotelName}
            onChange={(event) => setHotelName(event.target.value)}
            placeholder="예: SAPPORO HOTEL by GRANBELL"
          />
        </label>
        <label className="field field--full">
          <span>대표 이미지 URL (선택)</span>
          <input
            value={heroImage}
            onChange={(event) => setHeroImage(event.target.value)}
            placeholder="https://…  비우면 테마 색으로 채워집니다"
          />
        </label>
        <div className="field field--full">
          <span>테마</span>
          <div className="theme-picker">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`theme-chip${theme === item.id ? " is-active" : ""}`}
                onClick={() => setTheme(item.id)}
                title={item.hint}
              >
                <span
                  className="theme-chip__swatch"
                  style={{ background: `linear-gradient(135deg, ${item.swatch[0]}, ${item.swatch[1]})` }}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </Modal>
  );
}
