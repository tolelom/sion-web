import {useWebSocket} from "./hooks/useWebSocket.js";
import {useEffect, useState} from "react";
import Dashboard from "./components/Dashboard/Dashboard.jsx";

function App() {
    // Web Socket 연결
    const WS_URL = "ws://tolelom.xyz:3000/websocket/web";
    const {isConnected, lastMessage, sendMessage} = useWebSocket(WS_URL);

    // AGV 데이터 상태
    const [agvData, setAgvData] = useState({
        position: {x: 0, y: 0, angle: 0},
        status: {battery: 100, speed: 0, mode: 'auto'},
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
                setAgvData(prev => ({
                    ...prev,
                    status: lastMessage.data
                }));
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
            isConnected={isConnected}
            onSendCommand={sendMessage}
        />
    );
}

export default App;