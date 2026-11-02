# Sion Web

LoL 챔피언 사이온의 궁극기(돌진)를 AGV로 구현한 프로젝트의 관제 대시보드.

데모: https://sion.tolelom.xyz

데모는 실제 AGV 대신 [sion-api](https://github.com/tolelom/sion-api)의 시뮬레이터에 연결된다. 모든 방문자가 시뮬레이터 하나를 같이 조작한다.

## 기능

- 20x20 맵에 AGV 위치, 장애물, 목표(적), 이동 경로 표시
- 맵 클릭으로 목표 지정: 서버에서 A* 경로를 받아 이동 명령 전송
- 자동/수동 모드 전환, 긴급 정지, 초기화
- 배터리, 속도, 상태 표시
- WebSocket 연결 상태 표시와 자동 재연결(최대 10회)

## 기술 스택

- React 19, TypeScript, Vite 7
- Canvas 2D(맵 렌더링), 브라우저 WebSocket API
- Vitest, Testing Library

## 실행

```bash
git clone https://github.com/tolelom/sion-web.git
cd sion-web

npm install
cp .env.example .env.local
npm run dev
```

`.env.example`은 로컬 sion-api(`localhost:8001`)를 가리킨다.

```bash
npm run test
npm run lint
npm run build
```

Windows에서 `npm install`이 실패하거나 `node_modules`가 비어 있으면 개발자 모드(설정 > 개인 정보 및 보안 > 개발자용)를 켠다. 심볼릭 링크 권한이 없으면 일부 패키지가 설치되지 않는다.

## 관련 저장소

- [sion-api](https://github.com/tolelom/sion-api): 백엔드와 AGV 시뮬레이터(Go Fiber)
- [sion-robot](https://github.com/tolelom/sion-robot): 실제 AGV 제어 코드(Python)

## License

MIT
