# Sion Frontend

LoL 사이온 궁극기를 구현한 AGV 프로젝트의 웹 대시보드.
백엔드는 [sion-backend](https://github.com/tolelom/sion-backend), 로봇 제어는 [sion](https://github.com/tolelom/sion) 참고.

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Language**: TypeScript 5.9
- **WebSocket**: Native WebSocket API (3-stage 상태: connected / reconnecting / disconnected)
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + @testing-library/react (단위) + Playwright (E2E)

## Features

- 실시간 AGV 상태 모니터링 (위치, 속도, 배터리, 모드, 감지된 적)
- Canvas 기반 맵 시각화 (AGV, 적, 장애물, 경로) — 정적 레이어를 오프스크린 캔버스로 분리해 rAF 루프 최적화
- LLM 기반 AI 채팅 해설 (1분 단위 timeAgo 갱신)
- 자동/수동 모드 전환, 긴급 정지, 초기화 (`ConfirmModal` 기반)
- WebSocket 자동 재연결 (지수 백오프)

## Getting Started

```bash
git clone https://github.com/tolelom/sion-frontend.git
cd sion-frontend

cp .env.example .env.local   # VITE_WS_URL / VITE_API_BASE_URL 조정 (기본은 :3000이므로 백엔드 포트에 맞추세요)
npm install
npm run dev                  # http://localhost:5173
```

백엔드 서버가 별도로 떠 있어야 합니다 (`SION_USE_IN_MEMORY_DB=true go run .`이면 가장 빠름).

### Windows 주의사항

Windows에서 `npm install`이 실패하거나 `node_modules`가 비어있다면 **개발자 모드(Developer Mode)** 를 활성화해야 합니다.

> 설정 → 개인 정보 및 보안 → 개발자용 → 개발자 모드 ON

심볼릭 링크 권한이 없으면 일부 패키지가 정상 설치되지 않습니다.

## Tests

```bash
npm test              # Vitest 단위 + 컴포넌트 테스트 (64 tests)
npm run test:e2e      # Playwright E2E (backend 필요)
npm run test:e2e:ui   # Playwright 인터랙티브 UI 모드
```

### E2E

`e2e/dashboard.spec.ts`에 4개 시나리오:
- **smoke 2개** (backend 불필요) — 페이지 로드, 연결 상태 표시
- **integration 2개** (backend 필요) — `/api/health` 응답 시 자동 실행, 없으면 skip
  - 서버 연결 표시
  - `POST /api/simulator/start` 후 위치/속도/감지된 적이 화면에 갱신되는지

E2E는 backend가 `:8001`에 떠 있어야 합니다:
```bash
# 가장 빠른 방법: backend를 in-memory 모드로
cd ../sion-backend && SION_USE_IN_MEMORY_DB=true go run .

# 다른 터미널
cd sion-frontend && npm run test:e2e
```

CI는 매 push마다 자동으로 backend를 함께 빌드/기동해서 E2E까지 검증합니다.

## 구조

```
src/
├─ App.tsx                  # 얇은 shell — hooks를 Dashboard에 연결
├─ main.tsx                 # 엔트리
├─ hooks/
│  ├─ useWebSocket.ts       # WS 연결 + 3-stage 상태 + 지수 백오프
│  ├─ useAgvState.ts        # AGV 상태 reducer
│  ├─ useChatState.ts       # 채팅 상태 reducer
│  ├─ useMapState.ts        # 맵/장애물 상태 reducer
│  ├─ usePathfinding.ts     # 백엔드 A* API 래퍼
│  ├─ useConfirmDialog.ts   # window.confirm 대체 모달
│  └─ messageRouter.ts      # WS 메시지를 reducer로 dispatch
├─ components/
│  ├─ Dashboard/            # 레이아웃 + 패널 조립
│  ├─ Status/StatusPanel    # 배터리/위치/모드/적
│  ├─ Controls/ControlPanel # 자동·수동 토글, 긴급 정지, 초기화
│  ├─ Chat/                 # ChatPanel + ChatMessage
│  ├─ Map/MapCanvas         # Canvas 2D, mapDrawing.ts 분리
│  └─ Common/ConfirmModal   # 재사용 가능한 confirm/alert
├─ types/                   # agv / chat / map / messages / index
└─ styles/                  # 다크 테마 CSS
```

## License

MIT
