const StatusPanel = ({agvData}) => {
    const position = agvData?.position || {x: 0, y: 0, angle: 0};
    const status = agvData?.status || {battery: 0, speed: 0, mode: 'auto', state: 'idle'};
    const targetEnemy = agvData?.targetEnemy;
    const detectedEnemies = agvData?.detectedEnemies || [];

    // 🆕 상태 텍스트 및 아이콘
    const getStateDisplay = (state) => {
        const states = {
            'idle': { icon: '🚦', text: '대기', color: '#95a5a6' },
            'moving': { icon: '🚗', text: '이동 중', color: '#3498db' },
            'charging': { icon: '⚡', text: '돌진 중', color: '#e74c3c' },
            'searching': { icon: '🔍', text: '탐색 중', color: '#f39c12' },
            'stopped': { icon: '⛔', text: '정지', color: '#e67e22' },
            'emergency': { icon: '🚨', text: '긴급 정지', color: '#c0392b' },
        };
        return states[state] || states['idle'];
    };

    // 🆕 배터리 색상
    const getBatteryColor = (battery) => {
        if (battery > 60) return '#2ecc71';
        if (battery > 30) return '#f39c12';
        return '#e74c3c';
    };

    const stateDisplay = getStateDisplay(status.state);

    return (
        <div className="card">
            <h2 className="card-title">AGV 상태</h2>

            <div>
                {/* 🆕 현재 상태 */}
                <div className="status-item">
                    <div className="status-icon" style={{fontSize: '24px'}}>
                        {stateDisplay.icon}
                    </div>
                    <div className="status-content">
                        <p className="status-label">상태</p>
                        <p className="status-value" style={{color: stateDisplay.color, fontWeight: 'bold'}}>
                            {stateDisplay.text}
                        </p>
                    </div>
                </div>

                {/* 위치 */}
                <div className="status-item">
                    <div className="status-icon blue">
                        📍
                    </div>
                    <div className="status-content">
                        <p className="status-label">위치</p>
                        <p className="status-value">
                            ({position.x?.toFixed(2)}, {position.y?.toFixed(2)})
                        </p>
                        {position.angle !== undefined && (
                            <p className="status-hint" style={{fontSize: '11px', color: '#888', marginTop: '2px'}}>
                                각도: {(position.angle * 180 / Math.PI).toFixed(0)}°
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* 배터리 */}
            <div className="status-item">
                <div className="status-icon green">
                    🔋
                </div>
                <div className="status-content">
                    <p className="status-label">배터리</p>
                    <div className="battery-container">
                        <div 
                            className="battery-fill" 
                            style={{
                                width: `${status.battery || 0}%`,
                                backgroundColor: getBatteryColor(status.battery || 0)
                            }}
                        />
                    </div>
                    <span className="battery-percentage">
                        {status.battery || 0}%
                    </span>
                </div>
            </div>

            {/* 속도 */}
            <div className="status-item">
                <div className="status-icon orange">
                    ⚡
                </div>
                <div className="status-content">
                    <p className="status-label">속도</p>
                    <p className="status-value">{status.speed?.toFixed(1) || 0} m/s</p>
                </div>
            </div>

            {/* 모드 */}
            <div className="status-item">
                <div className="status-icon">
                    {status.mode === 'auto' ? '🤖' : '🎮'}
                </div>
                <div className="status-content">
                    <p className="status-label">모드</p>
                    <span className={`mode-badge ${status.mode || 'auto'}`}>
                        {status.mode === 'auto' ? '자동' : '수동'}
                    </span>
                </div>
            </div>

            {/* 🆕 현재 타겟 */}
            {targetEnemy && (
                <div className="status-item" style={{borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '8px'}}>
                    <div className="status-icon" style={{fontSize: '20px'}}>
                        🎯
                    </div>
                    <div className="status-content">
                        <p className="status-label">현재 타겟</p>
                        <p className="status-value" style={{color: '#e74c3c', fontWeight: 'bold'}}>
                            {targetEnemy.name || '적'}
                        </p>
                        {targetEnemy.hp !== undefined && (
                            <div style={{marginTop: '4px'}}>
                                <div style={{
                                    width: '100%',
                                    height: '6px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${targetEnemy.hp}%`,
                                        height: '100%',
                                        backgroundColor: targetEnemy.hp > 50 ? '#2ecc71' : targetEnemy.hp > 25 ? '#f39c12' : '#e74c3c',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <span style={{fontSize: '11px', color: '#888'}}>
                                    HP: {targetEnemy.hp}%
                                </span>
                            </div>
                        )}
                        {targetEnemy.x !== undefined && targetEnemy.y !== undefined && (
                            <p className="status-hint" style={{fontSize: '11px', color: '#888', marginTop: '4px'}}>
                                위치: ({targetEnemy.x.toFixed(1)}, {targetEnemy.y.toFixed(1)})
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* 🆕 감지된 적 수 */}
            {detectedEnemies.length > 0 && (
                <div className="status-item">
                    <div className="status-icon" style={{fontSize: '20px'}}>
                        👁️
                    </div>
                    <div className="status-content">
                        <p className="status-label">감지된 적</p>
                        <p className="status-value">
                            {detectedEnemies.length}명
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusPanel;