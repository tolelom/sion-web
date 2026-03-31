# Sion Frontend

LoL 사이온 궁극기를 구현한 AGV 프로젝트의 웹 대시보드.
백엔드는 [sion-backend](https://github.com/tolelom/sion-backend), 로봇 제어는 [sion](https://github.com/tolelom/sion) 참고.

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **WebSocket**: Native WebSocket API

## Features

- 실시간 AGV 상태 모니터링
- 맵 시각화 (AGV 위치, 적, 장애물, 경로)
- LLM 기반 AI 채팅 해설
- 수동/자동 모드 전환, 긴급 정지

## Getting Started

```bash
git clone https://github.com/tolelom/sion-frontend.git
cd sion-frontend

npm install
npm run dev
```

백엔드 서버가 `localhost:3000`에서 실행 중이어야 함.

## License

MIT
