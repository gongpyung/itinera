# itinera

여러 여행을 한 곳에서 관리하고, **오른쪽 AI 채팅으로 일정을 바로 고치는** 여행 플래너.
원래의 정적 일정 페이지(`index.html` + `app.js` 한 벌)를 **Next.js App Router + TypeScript**로 옮기고, 멀티 트립과 AI 편집 패널을 얹은 버전입니다. Vercel에 그대로 배포할 수 있습니다.

- 데모 데이터: **삿포로·비에이 겨울 여행**(2026-12-17~20, 예정) + **콩부부 시드니 여행**(2026-04-30~05-05, 기존 `sydney-plan` 일정 그대로)
- 디자인·테마·지도 동작은 기존 버전을 그대로 계승했습니다.

## 이번 버전에서 달라진 점

| 항목 | 이전 (정적) | 지금 |
| --- | --- | --- |
| 여행 1개 | 파일 2개(`config`, `data`)를 갈아끼움 | 화면에서 여행 추가·전환·수정·복제·삭제 |
| 일정 수정 | 코드 수정 후 배포 | 우측 AI 채팅 또는 일정 카드의 편집 버튼 |
| 저장 | 없음(파일이 곧 데이터) | `localStorage` 자동 저장 + JSON 내보내기/불러오기 |
| 지도·테마·필터 | 그대로 | 그대로 (6종 테마, 일자 필터, 분류 필터, 장소별 embed, 숙소 기준 길찾기, 모바일 인라인 지도) |
| 되돌리기 | 없음 | 모든 변경을 20단계까지 되돌리기 |
| 배포 | GitHub Pages | Vercel (API 라우트 포함) |

## 빠른 시작

Node 20 이상이 필요합니다.

```bash
npm install
cp .env.example .env.local   # AI 채팅을 쓰려면 키를 채웁니다
npm run dev                  # http://localhost:3000
```

빌드·타입 검사:

```bash
npm run build      # 프로덕션 빌드 (타입 오류 0건일 때만 성공)
npm run typecheck  # tsc --noEmit
```

## 환경변수

AI 채팅은 서버 라우트(`/api/chat`)에서 호출합니다. **아래 둘 중 하나만 있으면 동작**하고, 둘 다 있으면 Anthropic을 먼저 씁니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 선택(권장) | Anthropic Messages API 키 |
| `ANTHROPIC_MODEL` | 선택 | 기본값 `claude-sonnet-4-5` |
| `GEMINI_API_KEY` | 선택 | Google Gemini API 키 (Anthropic 키가 없을 때 사용) |
| `GEMINI_MODEL` | 선택 | 기본값 `gemini-2.5-flash` |

키가 하나도 없어도 앱은 정상 동작하며, 채팅을 보내면 어떤 변수를 넣어야 하는지 안내 메시지를 돌려줍니다. 키는 브라우저로 내려가지 않고 서버 라우트에서만 쓰입니다.

## Vercel 배포

1. Vercel → **Add New… → Project** → `gongpyung/itinera` 선택.
2. Framework Preset은 **Next.js**로 자동 인식됩니다 (Build `next build`, Output 자동). 별도 설정 없음.
3. **Settings → Environment Variables**에 `ANTHROPIC_API_KEY`(또는 `GEMINI_API_KEY`)를 추가합니다.
4. **Deploy**. 이후 브랜치를 push하면 Preview 배포, `main` 머지 시 Production 배포가 됩니다.

`/api/chat`은 Node 런타임을 쓰고 최대 60초까지 기다립니다. 외부 DB나 별도 서버는 필요 없습니다.

## AI 채팅 패널

- **데스크톱(≥1200px)**: 오른쪽 고정 패널. 헤더의 `AI 채팅` 버튼이나 패널 우측 상단 화살표로 접고 펴고, 접히면 앱 영역이 넓어집니다.
- **모바일/태블릿(<1200px)**: 우측에서 열리는 드로어 + 오른쪽 아래 플로팅 버튼.
- AI가 일정을 바꾸면 왼쪽 일정표에 **즉시 반영**되고 브라우저에 자동 저장됩니다. 변경된 항목은 잠깐 강조 표시되고, 채팅 패널과 일정표 상단의 **되돌리기**로 직전 상태로 돌아갈 수 있습니다.

### 동작 방식

1. 브라우저가 현재 여행 데이터 + 최근 대화를 `/api/chat`으로 보냅니다.
2. 서버가 `apply_itinerary_patch` 도구(tool use)를 정의해 모델에 넘기고, 모델은 답변과 함께 **구조화된 변경 목록(ops)** 을 돌려줍니다.
3. 서버가 ops를 검증합니다 — 여행에 실제로 있는 `dayId`/`stopId`만 허용, 없는 id·잘못된 값은 버리고 경고로 돌려줍니다.
4. 클라이언트가 ops를 일정 상태에 적용하고 `localStorage`에 저장합니다.

지원하는 op:

| op | 대상 | 주요 필드 |
| --- | --- | --- |
| `add_stop` | 날짜 | `dayId`, `stop{time,name,category,query,note,tags}`, `index?` |
| `update_stop` | 장소 | `dayId`, `stopId`, `stop{…바꿀 필드만}` |
| `delete_stop` | 장소 | `dayId`, `stopId` |
| `move_stop` | 장소 | `dayId`, `stopId`, `toIndex` |
| `add_day` | 여행 | `day{date,title,summary,travelMode,stops?}`, `index?` |
| `update_day` | 날짜 | `dayId`, `day{…바꿀 필드만}` |
| `delete_day` | 날짜 | `dayId` (마지막 1일은 삭제 불가) |
| `set_travel_mode` | 날짜 | `dayId`, `travelMode` (`walking`/`transit`/`driving`) |
| `set_theme` | 여행 | `theme` |
| `set_hotel` | 여행 | `hotel{name,displayName,query,address,note}` |
| `set_trip` | 여행 | `trip{title,destination,eyebrow,heroImage,startDate,endDate}` |

같은 op 목록은 일정 카드의 편집 UI(장소 추가·수정·삭제·순서 변경, 날짜 삭제, 이동 수단 변경)도 사용합니다. 즉 **AI와 손편집이 같은 경로**로 데이터를 바꿉니다.

## 데이터 모델

`lib/types.ts`의 타입이 기준입니다. 한 여행은 이런 모양입니다.

```jsonc
{
  "id": "trip-sapporo",
  "title": "삿포로·비에이 겨울 여행 ❄️",
  "destination": "삿포로·비에이, 홋카이도",
  "eyebrow": "12월 17일 - 12월 20일",   // 비우면 날짜에서 자동 생성
  "startDate": "2026-12-17",
  "endDate": "2026-12-20",
  "heroImage": "https://…",             // 비우면 테마 색 그라데이션
  "theme": "ocean",
  "hotel": { "name": "SAPPORO HOTEL by GRANBELL", "displayName": "삿포로 호텔 바이 그랑벨", "query": "…", "address": "…" },
  "days": [
    {
      "id": "sp-d1",
      "date": "2026-12-17",
      "title": "인천 출발, 삿포로 도착 · 그랑벨 체크인",
      "summary": "…",
      "travelMode": "transit",
      "stops": [
        {
          "id": "sp-d1-s1",
          "time": "10:05",
          "name": "KE 765 인천 → 신치토세",
          "category": "항공",
          "query": "Incheon International Airport",  // Google Maps 검색어
          "note": "10:05 인천 출발, 12:50 신치토세 도착",
          "tags": ["예약", "2시간 45분"],
          "booked": true
        }
      ]
    }
  ]
}
```

- 날짜는 `YYYY-MM-DD`. 화면에는 `12/17 (목)`처럼 표시됩니다.
- `stop.booked`는 빨간 "예약" 태그, `stop.free`는 초록 "무료" 태그 스타일을 씁니다.
- `lat`/`lng`는 선택입니다. 지도 embed와 길찾기는 `query` 문자열로 동작하므로 **좌표 없이도 새 장소를 추가할 수 있습니다.**
- `hotel`은 "숙소 기준 길찾기"의 기준점으로 쓰입니다. 숙소가 여러 곳이면 대표 숙소 하나를 넣고, 나머지는 일정의 숙소 stop으로 적습니다(삿포로 여행의 비에이 숙소처럼).

### 저장·백업

| 키 | 내용 |
| --- | --- |
| `itinera.state.v2` | 여행 목록 + 활성 여행 (`localStorage`) |
| `itinera.chat.v2.<tripId>` | 여행별 AI 대화 (최근 80개) |
| `itinera.visited.v2.<tripId>` | 여행별 방문 체크 |

**내보내기**는 모든 여행을 `itinera-<여행이름>-YYYY-MM-DD.json` 한 파일로 저장하고, **불러오기**는 그 파일(또는 여행 하나짜리 JSON)을 받아 기존 여행 옆에 추가합니다. id가 겹치면 새 id를 붙입니다. 저장 구조가 단순한 JSON이라 나중에 DB(예: Postgres/Supabase)로 옮길 때 `lib/storage.ts`만 갈아끼우면 됩니다.

## 내장 여행

- **삿포로·비에이 (2026-12-17~20)** — 확정 예약 기반으로 채웠습니다. KE 765(인천 10:05 → 신치토세 12:50), `SAPPORO HOTEL by GRANBELL`(12/17 15:00 체크인 ~ 12/20 11:00 체크아웃), 비에이 `チカラノ食堂`(12/18 16:00 ~ 12/20 10:00), KE 770(신치토세 16:55 → 인천 20:10). 관광·식사 후보는 확정이 아니므로 태그에 `제안`을 달았습니다. 그랑벨 3박과 비에이 2박이 12/18·19에 겹치는 점, 렌터카가 취소된 상태라는 점은 일정 메모에 남겨 두었습니다.
- **시드니 (2026-04-30~05-05)** — 기존 `sydney-plan`/`itinera`의 일정을 그대로 이식했습니다(장소·메모·태그·좌표 동일). 표시용 날짜(`4/30`)만 ISO 날짜로 바꿨고, 변환은 `scripts/gen-sydney-seed.mjs`로 재현할 수 있습니다.

내장 데이터는 첫 실행 시에만 쓰입니다. 이후에는 `localStorage` 값이 우선합니다. 처음 상태로 되돌리려면 브라우저에서 `itinera.state.v2`를 지우면 됩니다.

## 폴더 구조

```
app/
  layout.tsx            메타데이터·테마 부트스트랩
  page.tsx              화면 상태(선택·필터·모달·토스트) 오케스트레이션
  globals.css           기존 디자인 시스템 + 6종 테마 + 새 컴포넌트 스타일
  api/chat/route.ts     AI 채팅 엔드포인트 (Anthropic → Gemini 폴백)
components/
  TripHeader.tsx        히어로 + 여행 전환기 + 도구 버튼
  DayNav.tsx            일자 필터
  CategoryFilter.tsx    분류 필터
  ItineraryList.tsx     일자 카드 · 장소 행 · 모바일 인라인 지도
  MapPanel.tsx          장소별 Google Maps embed + 길찾기
  ChatPanel.tsx         우측 AI 채팅 (데스크톱 패널 / 모바일 드로어)
  TripDialog.tsx        새 여행 · 여행 편집
  StopDialog.tsx        장소 추가 · 수정 · 삭제 · 순서 변경
  Modal.tsx, Icon.tsx
lib/
  types.ts              Trip · Day · Stop 스키마
  store.ts              여행 상태 + 되돌리기 스택 (localStorage 동기화)
  ops.ts                op 검증(normalizeOps) · 적용(applyOps)
  storage.ts            저장/불러오기/내보내기, 관대한 JSON 리더
  useChat.ts            대화 상태 + /api/chat 호출
  seed/                 내장 여행 (삿포로, 시드니)
  ai/                   tool 스키마 · 시스템 프롬프트
  maps.ts, format.ts, themes.ts, labels.ts, ids.ts
scripts/gen-sydney-seed.mjs   정적 데이터 → 타입 시드 변환
legacy/                       이전 정적 버전 (참고용, 배포에는 영향 없음)
```

## 테마

`harbour` `sakura` `ocean` `forest` `sunset` `monochrome` 6종. 토큰은 `app/globals.css`의 `[data-theme="…"]` 블록에 있고, 여행마다 `theme` 값으로 선택합니다(여행 편집 창에서 고르거나 AI에게 "테마를 forest로 바꿔줘").

## 이전 정적 버전

`legacy/`에 그대로 남겨 두었습니다. 빌드 없이 보고 싶으면:

```bash
cd legacy && python3 -m http.server 8000
```

Next 버전에서는 서비스 워커 기반 오프라인 캐시를 이식하지 않았습니다(해시된 자산 이름과 캐시 무효화를 직접 관리해야 해서). `manifest.webmanifest`는 유지되어 홈 화면에 추가는 됩니다.

## 알려진 한계

- 데이터는 브라우저에만 있습니다. 기기 간 공유는 **내보내기/불러오기**로 하고, 자동 동기화가 필요하면 DB 연동이 다음 단계입니다.
- AI가 추가한 장소의 영업시간·요금·운행 여부는 검증하지 않습니다(프롬프트에서도 추측을 금지하고 `제안` 태그를 쓰게 합니다). 예약이 걸린 항목은 직접 확인하세요.
- Google Maps embed는 API 키 없이 `maps.google.com/maps?q=…&output=embed`를 씁니다. 장소명이 모호하면 지도가 엉뚱한 곳을 보여줄 수 있으니 `query`를 구체적으로 적는 게 좋습니다.
