import type { Trip } from "../types";

/** Trip view sent to the model: ids, wording and order, without map plumbing. */
export function compactTrip(trip: Trip) {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    theme: trip.theme,
    startDate: trip.startDate,
    endDate: trip.endDate,
    hotel: {
      name: trip.hotel.name,
      displayName: trip.hotel.displayName,
      address: trip.hotel.address,
      note: trip.hotel.note,
    },
    days: trip.days.map((day) => ({
      id: day.id,
      date: day.date,
      title: day.title,
      summary: day.summary,
      travelMode: day.travelMode,
      stops: day.stops.map((stop) => ({
        id: stop.id,
        time: stop.time,
        name: stop.name,
        category: stop.category,
        note: stop.note,
        tags: stop.tags,
        booked: stop.booked ?? false,
      })),
    })),
  };
}

export function buildSystemPrompt(trip: Trip, today = new Date()): string {
  const todayIso = today.toISOString().slice(0, 10);
  return [
    "너는 여행 일정 편집 도우미다. 사용자와 대화하면서 왼쪽 화면의 여행 일정을 직접 고친다.",
    "",
    "규칙:",
    "1. 한국어로 짧고 실무적으로 답한다. 인사말·과장·되풀이는 넣지 않는다.",
    "2. 일정을 바꾸는 요청이면 반드시 apply_itinerary_patch 도구를 호출한다. 말로만 바꿨다고 하지 않는다.",
    "3. dayId·stopId는 아래 여행 데이터에 있는 값만 쓴다. 새 id를 만들지 않는다(새 장소·새 날짜의 id는 시스템이 붙인다).",
    "4. 새 장소는 name, time, category, query를 채운다. query는 Google Maps에서 검색되도록 '상호명 지역명' 형태로 쓴다. 좌표는 확실할 때만 넣는다.",
    "5. 항공·숙소 같은 확정 예약은 사용자가 말하지 않으면 바꾸지 않는다. 확인되지 않은 후보는 tags에 \"제안\"을 넣는다.",
    "6. 모르는 사실(영업시간·요금·운행 여부·날씨)을 추측해서 단정하지 않는다. 필요하면 사용자에게 확인할 것을 말한다.",
    "7. 여러 곳을 한 번에 바꿀 때는 ops 배열에 적용 순서대로 담고, reply에는 결과를 한두 문장으로 요약한다.",
    "8. 테마는 set_theme으로 바꾼다. 값: harbour, sakura, ocean, forest, sunset, monochrome.",
    "9. 날짜는 YYYY-MM-DD 형식이다. 오늘은 " + todayIso + " 이다.",
    "10. 여행 데이터에 없는 날짜를 새로 만들 때는 add_day를 쓰고 date를 채운다.",
    "",
    "여행 데이터(JSON):",
    JSON.stringify(compactTrip(trip)),
  ].join("\n");
}
