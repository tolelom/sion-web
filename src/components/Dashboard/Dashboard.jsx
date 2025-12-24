import MapCanvas from '../Map/MapCanvas';
import StatusPanel from '../Status/StatusPanel';
import ControlPanel from '../Controls/ControlPanel';
import {usePathfinding} from '../../hooks/usePathfinding';
import "../../styles/dashboard.css"
import ChatPanel from "../Chat/ChatPanel.jsx";

const Dashboard = ({agvData, mapData, pathData, isConnected, onSendCommand}) => {
    // 🆕 실시간 데이터 사용 (하드코딩 제거)
    const targets = agvData?.detectedEnemies || [];
    const targetEnemy = agvData?.targetEnemy; // 현재 타겟
    const obstacles = mapData?.obstacles || [];

    // 🆕 경로 도답 메시지에서 부름 경로 (맵 위에 더단 쥴추)
    const agvPathPoints = pathData?.points || [];
    
    // 경로 연사 훈 (사용자 맵 클릭 또는 백엔드 경로) - 돈째 커디녁 남기기
    const {path, isLoading, error, findPath} = usePathfinding();

    // 맵 클릭 핸들러 - 경로 탐색 추가
    const handleMapClick = async (position) => {
        console.log('🎯 맵 클릭:', position);

        // 현재 AGV 위치 (없으면 0,0)
        const currentPos = agvData?.position || {x: 0, y: 0};

        // 정수로 반올림 (그리드 단위)
        const start = {
            x: Math.round(currentPos.x),
            y: Math.round(currentPos.y)
        };

        const goal = {
            x: Math.round(position.x),
            y: Math.round(position.y)
        };

        console.log('🚀 경로 탐색 시작:', start, '→', goal);

        // 경로 탐색 API 호출
        const calculatedPath = await findPath(start, goal, obstacles);

        if (calculatedPath) {
            console.log('✅ 경로 생성 완료');

            // WebSocket으로 AGV에 이동 명령 전송
            onSendCommand({
                type: 'command',
                data: {
                    target_x: position.x,
                    target_y: position.y,
                    path: calculatedPath,
                    mode: 'manual'
                }
            });
        } else {
            console.error('❌ 경로를 찾을 수 없습니다');
            alert('경로를 찾을 수 없습니다. 장애물을 피해 다른 위치를 선택해주세요.');
        }
    };

    return (
        <div className="dashboard">
            {/* 헬더 */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">🚀 AGV 실시간 모니터링</h1>
                <div className="connection-status">
                    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}/>
                    <span className="status-text">
                        {isConnected ? "✅ 서버 연결됨" : "❌ 서버 연결 끊김"}
                    </span>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px'}}>
                        <h2 className="card-title">📄 실시간 맵</h2>
                        {/* 🆕 경로 상태 표시 - AGV 경로 또는 사용자 경로 */}
                        <div style={{fontSize: '14px', color: '#888', display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                            {agvPathPoints.length > 0 && (
                                <span style={{color: '#2ecc71'}}>
                                    🗺️ AGV 경로: {agvPathPoints.length}개 돬인트
                                </span>
                            )}
                            {isLoading && <span>🔄 경로 계산 중...</span>}
                            {error && <span style={{color: '#e74c3c'}}>❌ {error}</span>}
                            {path.length > 0 && !isLoading && (
                                <span style={{color: '#3498db'}}>
                                    ✅ 사용자 경로: {path.length}개 짧켐인트
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 🆕 AGV 경로 정보 표시 */}
                    {agvPathPoints.length > 0 && (
                        <div style={{
                            background: 'rgba(46, 204, 113, 0.1)',
                            border: '1px solid rgba(46, 204, 113, 0.3)',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '10px',
                            fontSize: '12px',
                            color: '#2ecc71'
                        }}>
                            <strong>🗺️ AGV 경로</strong> | 길이: {pathData.length?.toFixed(2)}m | 알고리즘: {pathData.algorithm}
                        </div>
                    )}

                    {/* 🆕 실시간 데이터 전달 */}
                    <MapCanvas
                        agvPosition={agvData?.position}
                        targets={targets}
                        targetEnemy={targetEnemy}
                        obstacles={obstacles}
                        path={path}
                        agvPath={agvPathPoints}
                        onMapClick={handleMapClick}
                    />
                </div>

                <div className="sidebar">
                    <StatusPanel agvData={agvData}/>
                    <ControlPanel onSendCommand={onSendCommand}/>

                    <div className="card" style={{ height: '500px' }}>
                        <ChatPanel
                            onSendMessage={onSendCommand}
                            isConnected={isConnected}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
