# 🎮 Sion AGV Frontend

리그오브레전드 사이온의 궁극기 "멈출 수 없는 맹공"을 구현한 AGV 프로젝트의 프론트엔드 대시보드입니다.

## 📌 주요 기능

- **실시간 대시보드** - AGV 상태 모니터링
- **인터랙티브 맵** - AGV 위치, 적, 장애물, 경로 시각화
- **AI 채팅** - LLM 기반 실시간 해설
- **제어 패널** - 수동/자동 모드 전환, 이동 명령
- **WebSocket 통신** - 실시간 양방향 데이터 전송

## 🛠️ 기술 스택

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript (ES6+)
- **Styling**: CSS3
- **WebSocket**: Native WebSocket API
- **Date Library**: date-fns

## 📂 프로젝트 구조

```
sion-frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx              # 앱 엔트리포인트
│   ├── App.jsx               # 메인 앱 컴포넌트
│   ├── App.css
│   ├── index.css
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatPanel.jsx      # 채팅 UI
│   │   │   └── ChatMessage.jsx    # 개별 메시지
│   │   ├── Controls/
│   │   │   └── ControlPanel.jsx   # 제어 패널
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx      # 메인 대시보드
│   │   ├── Map/
│   │   │   └── MapCanvas.jsx      # 맵 캔버스
│   │   └── Status/
│   │       └── StatusPanel.jsx    # 상태 패널
│   ├── hooks/
│   │   ├── useWebSocket.js        # WebSocket 훅
│   │   └── usePathfinding.js      # 경로 탐색 훅
│   └── styles/
│       ├── dashboard.css          # 대시보드 스타일
│       └── chat.css               # 채팅 스타일
└── public/
    └── vite.svg
```

## 🚀 시작하기

### 1. 사전 요구사항

- Node.js 18+ 
- npm or yarn
- Backend 서버 실행 중 ([sion-backend](https://github.com/tolelom/sion-backend))

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/tolelom/sion-frontend.git
cd sion-frontend

# 의존성 설치
npm install
```

### 3. 실행

```bash
# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📡 백엔드 연동

### WebSocket 연결

```javascript
const WS_URL = "ws://localhost:3000/websocket/web";
```

백엔드 서버가 `localhost:3000`에서 실행 중이어야 합니다.

## 🎨 주요 컴포넌트

### Dashboard
메인 레이아웃과 상태 관리를 담당합니다.

### MapCanvas

- AGV 위치 표시
- 적(타겟) 표시
- 장애물 표시
- 경로 시각화
- 클릭으로 이동 명령

### ChatPanel

- AI 해설 실시간 표시
- 사용자 질문 입력
- 빠른 명령어 버튼
- 자동 스크롤

### StatusPanel

- AGV 배터리 상태
- 속도, 모드, 상태 표시
- 실시간 업데이트

### ControlPanel

- 자동/수동 모드 전환
- 긴급 정지 버튼
- 경로 초기화

## 🎯 사용 방법

### 1. 맵 클릭으로 이동

맵을 클릭하면 AGV가 해당 위치로 이동합니다. A* 알고리즘으로 최적 경로가 자동 생성됩니다.

### 2. 채팅으로 질문

채팅창에 "현재 상황을 설명해줘"와 같은 질문을 입력하면 AI가 AGV 상태를 기반으로 답변합니다.

### 3. 빠른 명령어

- **상황 설명** - 현재 AGV 상태 요약
- **행동 이유** - 최근 행동의 이유
- **다음 행동** - 다음 계획

## 🔌 WebSocket 메시지 처리

```javascript
// 메시지 수신
useEffect(() => {
    if (!lastMessage) return;
    
    switch (lastMessage.type) {
        case "position":
            // AGV 위치 업데이트
            break;
        case "chat_response":
            // AI 응답 표시
            break;
        case "agv_event":
            // 이벤트 설명 표시
            break;
    }
}, [lastMessage]);
```

## 🎨 스타일 커스터마이징

### 색상 테마

`src/styles/chat.css` 및 `dashboard.css`에서 색상 변경 가능:

```css
/* 다크 테마 */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

/* 프라이머리 색상 */
--primary-color: #667eea;
```

## 🧪 테스트

백엔드가 실행 중인 상태에서:

1. 프론트엔드 실행
2. 브라우저에서 WebSocket 연결 확인 (✅ 서버 연결됨)
3. 맵 클릭으로 이동 테스트
4. 채팅 입력 테스트

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 👥 팀원

- **김성민** - Frontend Developer

## 🔗 관련 링크

- [Backend Repository](https://github.com/tolelom/sion-backend)
