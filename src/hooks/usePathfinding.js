import { useState } from 'react';

export const usePathfinding = () => {
    const [path, setPath] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const findPath = async (start, goal, obstacles = []) => {
        setIsLoading(true);
        setError(null);

        // 🆕 전송 데이터 로그
        const requestData = {
            start: { x: start.x, y: start.y },
            goal: { x: goal.x, y: goal.y },
            map_width: 20,
            map_height: 20,
            obstacles: obstacles,
        };

        console.log('📤 경로 탐색 요청 데이터:', JSON.stringify(requestData, null, 2));

        try {
            const response = await fetch('http://sion.tolelom.xyz:3000/api/pathfinding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();
            console.log('📥 경로 탐색 응답:', data);

            if (data.success && data.path) {
                setPath(data.path);
                console.log('✅ 경로 탐색 성공:', data.path.length, '개 웨이포인트');
                return data.path;
            } else {
                console.error('❌ 경로 탐색 실패:', data.message);
                setError(data.message || '경로를 찾을 수 없습니다');
                setPath([]);
                return null;
            }
        } catch (err) {
            console.error('❌ 경로 탐색 API 오류:', err);
            setError('서버 연결 실패');
            setPath([]);
            return null;
        } finally {
            setIsLoading(false);
        }
    };


    const clearPath = () => {
        setPath([]);
        setError(null);
    };

    return {
        path,
        isLoading,
        error,
        findPath,
        clearPath,
    };
};
