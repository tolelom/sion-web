# Sion Web

> AGV 관제 대시보드

React 19 · TypeScript · Vite 7 · 데모 https://sion.tolelom.xyz

## 개요

Sion은 LoL 챔피언 사이온의 궁극기(목표를 향한 직선 돌진)를 Jetson 기반 AGV로 옮긴 프로젝트다. AGV는 맵에서 적을 찾아 장애물을 피해 접근한 뒤 직선 구간에서 가속해 돌진한다.

이 저장소는 그 AGV를 브라우저에서 보고 조작하는 대시보드다. 맵에 AGV 위치와 경로, 적, 장애물을 그리고, 모드 전환과 긴급 정지, 목표 지정 명령을 보낸다.

공개 데모는 실제 AGV 대신 [sion-api](https://github.com/tolelom/sion-api)의 시뮬레이터에 연결된다. 모든 방문자가 시뮬레이터 하나를 같이 조작한다.

## 시스템 구성

```mermaid
flowchart LR
    Web["sion-web<br/>대시보드"] -- "WebSocket<br/>상태 수신, 명령 전송" --> API["sion-api<br/>Go Fiber"]
    Web -- "REST<br/>A* 경로 요청" --> API
    API -. "WebSocket<br/>원래 구성" .-> Robot["sion-robot<br/>Jetson AGV 제어"]
    API -- "데모" --> Sim["AGV 시뮬레이터"]
```

| 저장소 | 역할 |
|---|---|
| sion-web | 관제 대시보드(이 저장소) |
| [sion-api](https://github.com/tolelom/sion-api) | A* 경로 탐색, 데모용 AGV 시뮬레이터. 원래 구성에서는 AGV와 대시보드 사이 상태 중계 |
| [sion-robot](https://github.com/tolelom/sion-robot) | AGV 제어. 경로 계획, 경로 추종, 적 돌진 |

## 기능

- 20x20 맵에 AGV 위치, 장애물, 목표(적), 이동 경로 표시
- 맵 클릭으로 목표 지정: 서버에서 A* 경로를 받아 이동 명령 전송
- 자동/수동 모드 전환, 긴급 정지, 초기화
- 배터리, 속도, 상태 표시
- WebSocket 연결 상태 표시와 자동 재연결(최대 10회)

## 구조

| 경로 | 책임 |
|---|---|
| `src/components/Dashboard` | 화면 배치, 맵 클릭을 경로 요청과 이동 명령으로 연결 |
| `src/components/Map` | Canvas 맵 렌더링(격자, 장애물, 경로, AGV, 목표) |
| `src/components/Controls` | 모드 전환, 긴급 정지, 초기화 버튼 |
| `src/components/Status` | 배터리, 속도, 상태 표시 |
| `src/hooks/useWebSocket.ts` | 연결, 재연결, 명령 전송 |
| `src/hooks/messageRouter.ts` | 수신 메시지(position, status, path_update, map_update 등)를 상태 훅으로 분배 |
| `src/hooks/usePathfinding.ts` | `POST /api/pathfinding` 호출 |
| `src/types` | AGV, 맵, 메시지 타입 |

## 실행

Node.js와 로컬 [sion-api](https://github.com/tolelom/sion-api)가 필요하다.

```bash
git clone https://github.com/tolelom/sion-web.git
cd sion-web

npm install
cp .env.example .env.local
npm run dev
```

`.env.example`은 로컬 sion-api(`localhost:8001`)를 가리킨다.

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run test` | Vitest 테스트 |
| `npm run lint` | ESLint |
| `npm run build` | 프로덕션 빌드 |
