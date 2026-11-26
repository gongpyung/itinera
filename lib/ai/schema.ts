/**
 * Tool schema shared by the Anthropic and Gemini providers.
 * Kept to the common subset both accept (no anyOf/$ref/additionalProperties),
 * so one definition stays honest on both paths.
 */
export const PATCH_TOOL_NAME = "apply_itinerary_patch";

const STOP_PROPERTIES = {
  time: { type: "string", description: "표시 시간. '09:30', '점심', '선택'처럼 자유 형식" },
  name: { type: "string", description: "장소 이름" },
  category: { type: "string", description: "짧은 분류. 예: 카페, 식당, 관광, 이동, 숙소, 공항" },
  query: {
    type: "string",
    description: "Google Maps 검색어. '상호명 지역명' 형태. 좌표를 모르면 이 값만 채운다",
  },
  note: { type: "string", description: "한두 문장 메모" },
  tags: {
    type: "array",
    items: { type: "string" },
    description: "예: '도보 10분', '예약', '제안'",
  },
  booked: { type: "boolean", description: "예약 완료 항목이면 true" },
  free: { type: "boolean", description: "무료 입장이면 true" },
  lat: { type: "number" },
  lng: { type: "number" },
};

const DAY_PROPERTIES = {
  date: { type: "string", description: "YYYY-MM-DD" },
  title: { type: "string" },
  summary: { type: "string" },
  travelMode: { type: "string", description: "walking | transit | driving" },
  stops: { type: "array", items: { type: "object", properties: STOP_PROPERTIES } },
};

const OP_ITEM = {
  type: "object",
  properties: {
    op: {
      type: "string",
      description:
        "add_stop | update_stop | delete_stop | move_stop | add_day | update_day | delete_day | set_travel_mode | set_theme | set_hotel | set_trip",
    },
    dayId: { type: "string", description: "대상 날짜 id (데이터에 있는 값만)" },
    stopId: { type: "string", description: "대상 장소 id (데이터에 있는 값만)" },
    index: { type: "number", description: "add_stop / add_day 의 삽입 위치(0부터). 없으면 끝에 추가" },
    toIndex: { type: "number", description: "move_stop 의 새 위치(0부터)" },
    stop: {
      type: "object",
      properties: STOP_PROPERTIES,
      description: "add_stop 은 새 장소 전체, update_stop 은 바꿀 필드만",
    },
    day: { type: "object", properties: DAY_PROPERTIES, description: "add_day 는 새 날짜, update_day 는 바꿀 필드만" },
    travelMode: { type: "string", description: "set_travel_mode: walking | transit | driving" },
    theme: { type: "string", description: "set_theme: harbour | sakura | ocean | forest | sunset | monochrome" },
    hotel: {
      type: "object",
      properties: {
        name: { type: "string" },
        displayName: { type: "string" },
        query: { type: "string" },
        address: { type: "string" },
        note: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" },
      },
      description: "set_hotel: 바꿀 필드만",
    },
    trip: {
      type: "object",
      properties: {
        title: { type: "string" },
        destination: { type: "string" },
        eyebrow: { type: "string" },
        heroImage: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD" },
      },
      description: "set_trip: 바꿀 필드만",
    },
  },
  required: ["op"],
};

export const PATCH_TOOL = {
  name: PATCH_TOOL_NAME,
  description:
    "여행 일정을 실제로 바꾼다. 사용자가 요청한 일정 변경(장소 추가·수정·삭제·순서 변경, 날짜 추가·수정·삭제, 테마·숙소·여행 정보 변경)은 모두 이 도구로 적용한다. 답변만 하고 도구를 부르지 않으면 화면은 바뀌지 않는다.",
  input_schema: {
    type: "object",
    properties: {
      reply: {
        type: "string",
        description: "사용자에게 보여줄 한국어 답변. 무엇을 바꿨는지 1~3문장으로 간결하게",
      },
      ops: {
        type: "array",
        items: OP_ITEM,
        description: "적용할 변경 목록. 바꿀 것이 없으면 빈 배열",
      },
    },
    required: ["reply", "ops"],
  },
} as const;
