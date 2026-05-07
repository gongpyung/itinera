# itinera

재사용 가능한 여행 일정 정적 웹페이지. 도시·일정·테마를 두 파일만 갈아끼우면 새 여행에 그대로 투입할 수 있다. 외부 의존성 0, GitHub Pages 호환.

## 기능

- 일자별 일정 필터 (사이드 nav)
- 장소별 Google Maps embed
- 모바일 일정 하단 인라인 지도
- 숙소 기준 길찾기, 일자별 경로(walking/driving) 링크 자동 생성
- 6종 테마 프리셋 — 도시/계절에 맞춰 한 줄로 색감 전환

## 빠른 시작

빌드 도구 없음. 그냥 정적 서버로 띄우면 끝.

```bash
# 로컬 미리보기 (Python)
python3 -m http.server 8000

# 또는 Node
npx --yes serve .
```

브라우저에서 http://localhost:8000 열기. (Google Maps iframe 때문에 `file://` 직접 열기보다 정적 서버 권장)

## 새 여행 시작하기

여행마다 두 곳만 갈아끼우면 끝.

### 1. `config/trip.config.js`

도시 메타데이터 — 제목/eyebrow/요약 chips/hero 이미지/테마.

```js
window.TRIP_CONFIG = {
  htmlLang: "ko",
  documentTitle: "도쿄 여행 🗼",
  eyebrow: "9월 12일 - 9월 18일",
  title: "도쿄 여행 🗼",
  hotelLabelPrefix: "숙소",
  summaryChips: ["7일", "30+장소", "Google Maps"],
  itineraryAriaLabel: "도쿄 여행 일정",
  // ... (나머지 라벨은 그대로 둬도 됨)
  heroImage: "https://images.unsplash.com/photo-...",
  theme: "ocean",
};
```

### 2. `data/itinerary.js`

`hotel` 객체와 `days` 배열 갈아엎기. 형식은 그대로, 내용만 교체.

```js
const hotel = {
  name: "Park Hyatt Tokyo",
  displayName: "파크 하얏트 도쿄",
  query: "Park Hyatt Tokyo 3-7-1-2 Nishi Shinjuku",
  lat: 35.6856,
  lng: 139.6911,
};

const days = [
  {
    id: "day-1",
    number: 1,
    date: "9/12",
    title: "도착 + 시부야",
    summary: "...",
    travelMode: "walking",
    stops: [
      {
        time: "15:00",
        name: "나리타 공항",
        category: "공항",
        query: "Narita International Airport",
        lat: 35.7720,
        lng: 140.3929,
        note: "...",
        tags: ["택시 60분"],
      },
      // ...
    ],
  },
  // ...
];

window.TRIP_DATA = { hotel, days };
```

`stop` 객체의 옵션 필드:
- `booked: true` — 빨간 "예약" 태그 스타일
- `free: true` — 녹색 "무료" 태그 스타일
- 일반은 갈색 톤

## 테마 프리셋

`tripConfig.theme` 한 줄로 전체 색감 전환. 6종 내장:

| preset | 분위기 | 어울리는 도시·코스 |
|--------|--------|-------------------|
| `harbour` | 청록 / 코랄 / 앰버 (sydney 기본) | 항구, 해안 도시 |
| `sakura` | 부드러운 핑크 / 크림 | 봄, 벚꽃, 커플 |
| `ocean` | 시안 / 블루 | 해변, 섬, 워터프론트 |
| `forest` | 진초록 / 올리브 | 자연, 하이킹, 산림 |
| `sunset` | 오렌지 / 딥레드 | 사막, 노을, 남미 |
| `monochrome` | 그레이 / 블랙 | 도심, 모던, 비즈니스 트립 |

토큰은 `styles.css`의 `[data-theme="..."]` 블록에 정의. 새 프리셋 추가하려면 거기에 블록 하나 더 추가하고 `tripConfig.theme`에서 이름으로 선택.

## 프로젝트 구조

```
itinera/
├── index.html          shell, 모든 동적 텍스트는 JS가 주입
├── styles.css          공통 토큰 + 6종 테마 프리셋
├── app.js              렌더 로직 (도시 비종속)
├── config/
│   └── trip.config.js  여행마다 갈아끼우는 메타데이터
├── data/
│   └── itinerary.js    hotel + days
├── manifest.json       PWA 메타 (앱 이름/색상/아이콘)
├── sw.js               service worker — 정적 자산 오프라인 캐시
├── icon.svg            PWA / 브라우저 탭 아이콘
├── .nojekyll           GitHub Pages용
├── .gitignore
└── README.md
```

## PWA / 오프라인

- `manifest.json` + `sw.js`로 PWA로 동작. 모바일 브라우저 메뉴에서 "홈 화면에 추가" 가능.
- 처음 로드 후 `sw.js`가 정적 자산(HTML/CSS/JS/config/data/아이콘)을 캐시해서 오프라인에서도 페이지가 뜬다. Google Maps iframe은 cross-origin이라 캐시 안 되지만, 일정/체크리스트는 비행기 모드에서도 보임.
- **새 여행 시작 시:** `manifest.json`의 `name`/`short_name`/`theme_color`도 갈아끼울 것. theme_color는 `tripConfig.theme`이 가리키는 프리셋의 accent 색에 맞춰주는 게 자연스럽다.
- 새 정적 자산을 추가하면 `sw.js`의 `CORE_ASSETS` 배열과 `CACHE_VERSION` 둘 다 손대야 한다. version을 올리지 않으면 옛 캐시가 계속 살아남는다.

스크립트 로딩 순서: `config/trip.config.js` → `data/itinerary.js` → `app.js`. 각각 `window.TRIP_CONFIG` / `window.TRIP_DATA`에 글로벌로 노출.

## GitHub Pages 배포

`.nojekyll` 이미 들어 있어서 그대로 푸시하면 됨. Settings → Pages에서 브랜치 선택만 하면 끝.

## 출처

본래 시드니 여행을 위해 만든 정적 페이지를 다음 여행에도 재사용할 수 있도록 일반화한 결과물. 초기 데이터는 시드니 6일 일정 그대로 들어 있어 즉시 데모 가능.
