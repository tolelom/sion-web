import {useWebSocket} from "./hooks/useWebSocket.js";
import {useEffect, useState} from "react";
import Dashboard from "./components/Dashboard/Dashboard.jsx";

function App() {
    // Web Socket 연결
    const WS_URL = "ws://sion.tolelom.xyz:3000/websocket/web";
    const {isConnected, lastMessage, sendMessage} = useWebSocket(WS_URL);

    // AGV 데이터 상태
    const [agvData, setAgvData] = useState({
        position: {x: 0, y: 0, angle: 0},
        status: {battery: 100, speed: 0, mode: 'auto'},
        detectedEnemies: [], // 🆕 실시간 감지된 적들
        targetEnemy: null,   // 🆕 현재 타겟
    });

    // 🆕 맵 데이터 (장애물, 맵 크기)
    const [mapData, setMapData] = useState({
        obstacles: [],
        width: 20,
        height: 20,
    });

    // 🆕 경로 데이터 (AGV에서 받은 경로)
    const [pathData, setPathData] = useState({
        points: [],
        length: 0,
        algorithm: '',
        createdAt: null
    });

    // Web Socket 메시지 처리
    useEffect(() => {
        if (!lastMessage) return;

        console.log("수신: ", lastMessage);

        switch (lastMessage.type) {
            case "position":
                setAgvData(prev => ({
                    ...prev,
                    position: lastMessage.data
                }));
                break;
            
            case "status":
                // 🆕 status 메시지에 적 정보가 포함될 수 있음
                const statusData = lastMessage.data;
                setAgvData(prev => ({
                    ...prev,
                    status: {
                        battery: statusData.battery,
                        speed: statusData.speed,
                        mode: statusData.mode,
                        state: statusData.state,
                    },
                    // 🆕 적 정보도 함께 업데이트
                    detectedEnemies: statusData.detected_enemies || prev.detectedEnemies,
                    targetEnemy: statusData.target_enemy || prev.targetEnemy,
                }));
                break;

            // 🆕 타겟 발견 메시지
            case "target_found":
                setAgvData(prev => ({
                    ...prev,
                    detectedEnemies: lastMessage.data.enemies || [],
                    targetEnemy: lastMessage.data.target || null,
                }));
                console.log("🎯 타겟 발견:", lastMessage.data);
                break;

            // 🆕 경로 업데이트 메시지
            case "path_update":
                console.log("🗺️  경로 업데이트 수신:", lastMessage.data);
                setPathData({
                    points: lastMessage.data.points || [],
                    length: lastMessage.data.length || 0,
                    algorithm: lastMessage.data.algorithm || '',
                    createdAt: lastMessage.data.created_at
                });
                break;

            // 🆕 맵 업데이트 메시지
            case "map_update":
                setMapData(prev => ({
                    ...prev,
                    obstacles: lastMessage.data.obstacles || prev.obstacles,
                    width: lastMessage.data.width || prev.width,
                    height: lastMessage.data.height || prev.height,
                }));
                console.log("🗺️ 맵 업데이트:", lastMessage.data);
                break;

            case "chat_response":
                if (window.chatPanel && window.chatPanel.addAIMessage) {
                    window.chatPanel.addAIMessage(lastMessage.data.message);
                }
                break;

            case "agv_event":
                if (window.chatPanel && window.chatPanel.addAIMessage) {
                    window.chatPanel.addAIMessage(lastMessage.data.explanation);
                }
                break;

            default:
                console.log("알 수 없는 메시지: ", lastMessage);
        }
    }, [lastMessage]);

    return (
        <Dashboard
            agvData={agvData}
            mapData={mapData}
            pathData={pathData}
            isConnected={isConnected}
            onSendCommand={sendMessage}
        />
    );
}

export default App;
