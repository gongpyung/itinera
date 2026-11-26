# legacy — 이전 정적 버전

Next.js로 옮기기 전의 정적 페이지입니다. 데이터와 디자인의 원본으로 남겨 둡니다.

- `index.html` + `app.js` + `styles.css` — 빌드 없는 1페이지 플래너
- `config/trip.config.js`, `data/itinerary.js` — 여행 메타데이터와 일정
- `sw.js`, `manifest.json` — 서비스 워커·PWA 설정

보는 방법:

```bash
cd legacy && python3 -m http.server 8000   # http://localhost:8000
```

새 앱은 이 폴더를 참조하지 않습니다. 시드니 데이터는 `scripts/gen-sydney-seed.mjs`가
`data/itinerary.js`를 읽어 `lib/seed/sydney.ts`로 변환하며, 그 결과가 현재 앱의 내장
시드니 여행입니다.
