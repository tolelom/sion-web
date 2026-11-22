# 아키텍처

## 시스템 구성

| 저장소 | 역할 |
|---|---|
| [sion-web](https://github.com/tolelom/sion-web) (이 저장소) | 관제 대시보드 |
| [sion-api](https://github.com/tolelom/sion-api) | 대시보드용 WebSocket·REST 서버. 내장 시뮬레이터가 AGV 역할 |
| [sion-robot](https://github.com/tolelom/sion-robot) | JETANK 제어. 경로 계획, 경로 추종, 적 돌진. 서버와 연결 없음 |

구성도는 `README.md` 맨 위에 있습니다. 대시보드와 서버가 주고받는 메시지 모양은 sion-api의 `contract/`가 정하고, 이 저장소의 `contract/`는 그 복사본입니다.

## 코드 지도

| 경로 | 책임 |
|---|---|
| `src/components/Dashboard` | 화면 배치, 서버 연결 표시 |
| `src/components/Map` | Canvas 맵 렌더링. `mapGeometry`(좌표 변환), `mapDrawing`(요소별 그리기), `mapLayers`(레이어 합성) |
| `src/components/Controls` | 모드 전환, 긴급 정지, 초기화 버튼 |
| `src/components/Status` | 배터리, 속도, 상태 표시 |
| `src/hooks/useWebSocket.ts` | 연결, 재연결, 명령 전송 |
| `src/hooks/messageRouter.ts` | 수신 메시지(position, status, map_update, system_info, error)를 상태 훅으로 분배 |
| `src/hooks/usePathfinding.ts` | `POST /api/pathfinding` 호출(새 요청이 이전 요청을 취소) |
| `src/hooks/useMoveCommand.ts` | 맵 클릭을 경로 요청과 이동 명령으로 연결 |
| `src/types` | AGV, 맵 타입. 수신 메시지(`messages.ts`)와 송신 명령(`commands.ts`)은 `contract.gen.ts`를 다시 내보냄 |
| `src/config.ts` | 빌드 시점 환경 변수(`VITE_WS_URL`, `VITE_API_BASE_URL`, `VITE_API_TIMEOUT`) |
| `contract/` | sion-api `contract/`의 복사본(JSON Schema, 픽스처) |
| `scripts/` | 계약 복사(`sync-contract.mjs`)와 타입 생성(`contract-types.mjs`) |

## 지켜야 할 규칙

- `contract/`는 직접 고치지 않고 `npm run contract:sync`로 sion-api에서 복사합니다.
- `src/types/contract.gen.ts`는 `npm run contract:types`가 만드는 파일이라 직접 고치지 않습니다.
