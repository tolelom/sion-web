import { useState } from 'react';

const ControlPanel = ({ onSendCommand }) => {
    const [mode, setMode] = useState('auto');

    // 모드 전환
    const handleModeToggle = () => {
        const newMode = mode === 'auto' ? 'manual' : 'auto';
        setMode(newMode);

        onSendCommand({
            type: 'mode_change',
            data: { mode: newMode },
        });

        console.log(`🎮 모드 변경: ${mode} → ${newMode}`);
    };

    // 🆕 긴급 정지
    const handleEmergencyStop = () => {
        if (window.confirm('⚠️ AGV를 긴급 정지하시겠습니까?')) {
            onSendCommand({
                type: 'emergency_stop',
                data: {
                    reason: 'User requested emergency stop',
                    timestamp: Date.now()
                },
            });

            console.log('🛑 긴급 정지 명령 전송');

            // 사용자 피드백
            alert('✅ 긴급 정지 명령이 전송되었습니다.');
        }
    };

    // 🆕 초기화 (재시작)
    const handleReset = () => {
        if (window.confirm('🔄 AGV를 초기화하시겠습니까?\n\n- 현재 경로가 취소됩니다\n- 시작 위치로 돌아갑니다\n- 모드가 자동 모드로 변경됩니다')) {
            onSendCommand({
                type: 'command',
                data: {
                    action: 'reset',
                    target_x: 0,
                    target_y: 0,
                    timestamp: Date.now()
                },
            });

            // 모드도 자동으로 변경
            setMode('auto');
            onSendCommand({
                type: 'mode_change',
                data: { mode: 'auto' },
            });

            console.log('🔄 AGV 초기화 명령 전송');

            // 사용자 피드백
            alert('✅ AGV가 초기화되었습니다.');
        }
    };

    return (
        <div className="card">
            <h2 className="card-title">제어</h2>

            <div className="control-buttons">
                {/* 모드 전환 */}
                <button
                    onClick={handleModeToggle}
                    className="control-btn primary"
                    title="자동/수동 모드 전환"
                >
                    {mode === 'auto' ? '▶️ 자동 모드' : '⏸️ 수동 모드'}
                </button>

                {/* 🆕 긴급 정지 */}
                <button 
                    onClick={handleEmergencyStop}
                    className="control-btn danger"
                    title="AGV 긴급 정지"
                >
                    ⏹️ 긴급 정지
                </button>

                {/* 🆕 초기화 */}
                <button 
                    onClick={handleReset}
                    className="control-btn secondary"
                    title="AGV 초기화 (시작 위치로 복귀)"
                >
                    🔄 초기화
                </button>
            </div>

            <div className="info-box">
                <p>💡 맵을 클릭하면 AGV가 해당 위치로 이동합니다</p>
            </div>
        </div>
    );
};

export default ControlPanel;