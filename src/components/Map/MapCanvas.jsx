import {useRef, useEffect, useState} from "react";

const MapCanvas = ({agvPosition, targets, targetEnemy, obstacles, path, agvPath, onMapClick}) => {
    const canvasRef = useRef(null);
    const [hoveredCell, setHoveredCell] = useState(null);

    const MAP_SIZE = 20;
    const CELL_SIZE = 30;
    const CANVAS_WIDTH = MAP_SIZE * CELL_SIZE;
    const CANVAS_HEIGHT = MAP_SIZE * CELL_SIZE;

    // 격자 그리기
    const drawGrid = (ctx) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= MAP_SIZE; i++) {
            const x = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }

        for (let i = 0; i <= MAP_SIZE; i++) {
            const y = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;

        for (let i = 0; i <= MAP_SIZE; i += 5) {
            const x = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();

            const y = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
    };

    // 좌표 라벨
    const drawCoordinates = (ctx) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        for (let i = 0; i <= MAP_SIZE; i += 5) {
            const x = i * CELL_SIZE;
            ctx.fillText(`${i}m`, x, CANVAS_HEIGHT - 8);
        }

        ctx.textAlign = 'right';
        for (let i = 0; i <= MAP_SIZE; i += 5) {
            const y = CANVAS_HEIGHT - i * CELL_SIZE;
            ctx.fillText(`${i}m`, 25, y + 4);
        }
    };

    // 장애물 그리기
    const drawObstacles = (ctx, obstacleList) => {
        if (!obstacleList || obstacleList.length === 0) return;

        obstacleList.forEach(obstacle => {
            const x = (obstacle.x - 0.5) * CELL_SIZE;
            const y = (MAP_SIZE - obstacle.y - 0.5) * CELL_SIZE;

            ctx.fillStyle = 'rgba(149, 165, 166, 0.7)';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

            ctx.strokeStyle = 'rgba(127, 140, 141, 1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

            ctx.strokeStyle = 'rgba(52, 73, 94, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + CELL_SIZE - 5, y + CELL_SIZE - 5);
            ctx.moveTo(x + CELL_SIZE - 5, y + 5);
            ctx.lineTo(x + 5, y + CELL_SIZE - 5);
            ctx.stroke();
        });
    };

    // 경로 그리기 (사용자 경로)
    const drawPath = (ctx, pathPoints) => {
        if (!pathPoints || pathPoints.length < 2) return;

        ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        pathPoints.forEach((point, index) => {
            const x = point.x * CELL_SIZE;
            const y = (MAP_SIZE - point.y) * CELL_SIZE;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);

        const lastPoint = pathPoints[pathPoints.length - 1];
        const targetX = lastPoint.x * CELL_SIZE;
        const targetY = (MAP_SIZE - lastPoint.y) * CELL_SIZE;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 20, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    // 🆕 AGV가 준 경로 그리기 (실제 주행 경로)
    const drawAGVPath = (ctx, pathPoints) => {
        if (!pathPoints || pathPoints.length < 2) return;

        ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);

        ctx.beginPath();
        pathPoints.forEach((point, index) => {
            const x = point.x * CELL_SIZE;
            const y = (MAP_SIZE - point.y) * CELL_SIZE;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        const lastPoint = pathPoints[pathPoints.length - 1];
        const targetX = lastPoint.x * CELL_SIZE;
        const targetY = (MAP_SIZE - lastPoint.y) * CELL_SIZE;

        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 18, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    // 체력 바 그리기
    const drawHealthBar = (ctx, x, y, hp) => {
        const barWidth = 40;
        const barHeight = 5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        const hpColor = hp > 50 ? '#2ecc71' : hp > 25 ? '#f39c12' : '#e74c3c';
        ctx.fillStyle = hpColor;
        ctx.fillRect(x - barWidth / 2, y, (barWidth * hp) / 100, barHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    };

    // AGV 그리기
    const drawAGV = (ctx, position) => {
        const x = position.x * CELL_SIZE;
        const y = (MAP_SIZE - position.y) * CELL_SIZE;
        const angle = position.angle || 0;

        ctx.fillStyle = '#3498db';
        ctx.shadowColor = 'rgba(52, 152, 219, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const arrowLength = 15;
        const arrowX = x + Math.cos(angle) * arrowLength;
        const arrowY = y + Math.sin(angle) * arrowLength;

        ctx.moveTo(x, y);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();

        const arrowHeadSize = 6;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - Math.cos(angle - Math.PI / 6) * arrowHeadSize,
            arrowY - Math.sin(angle - Math.PI / 6) * arrowHeadSize
        );
        ctx.lineTo(
            arrowX - Math.cos(angle + Math.PI / 6) * arrowHeadSize,
            arrowY - Math.sin(angle + Math.PI / 6) * arrowHeadSize
        );
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AGV', x, y - 28);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(
            `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
            x,
            y + 35
        );
    };

    // 🆕 타겟 강조 표시 (폄스 효과)
    const drawTargetHighlight = (ctx, target, time) => {
        const x = target.x * CELL_SIZE;
        const y = (MAP_SIZE - target.y) * CELL_SIZE;

        const pulseSize = 25 + Math.sin(time / 200) * 5;
        const pulseOpacity = 0.3 + Math.sin(time / 200) * 0.2;

        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseOpacity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 TARGET', x, y - 35);
    };

    // 적(아리) 그리기
    const drawTarget = (ctx, target, isSelected) => {
        const x = target.x * CELL_SIZE;
        const y = (MAP_SIZE - target.y) * CELL_SIZE;

        const fillColor = isSelected ? '#ff5555' : '#e74c3c';
        const shadowColor = isSelected ? 'rgba(255, 85, 85, 1)' : 'rgba(231, 76, 60, 0.8)';

        ctx.fillStyle = fillColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = isSelected ? 20 : 15;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(target.name || '아리', x, y + 30);

        if (target.hp !== undefined) {
            drawHealthBar(ctx, x, y - 25, target.hp);
        }
    };

    const drawHoveredCell = (ctx, cell) => {
        const x = cell.x * CELL_SIZE;
        const y = (MAP_SIZE - cell.y) * CELL_SIZE;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            `(${cell.x}, ${cell.y})`,
            x + 10,
            y - 5
        );
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const currentTime = Date.now();

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#1a1d23';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawGrid(ctx);
        drawCoordinates(ctx);

        if (obstacles && obstacles.length > 0) {
            drawObstacles(ctx, obstacles);
        }

        // 🆕 AGV 경로를 먼저 그리기 (실제 주행/계획 경로)
        if (agvPath && agvPath.length > 0) {
            drawAGVPath(ctx, agvPath);
        }

        // 사용자 경로 (클릭으로 생성된 경로)
        if (path && path.length > 0) {
            drawPath(ctx, path);
        }

        if (targets && targets.length > 0) {
            targets.forEach(target => {
                const isSelected = targetEnemy && (
                    targetEnemy.id === target.id ||
                    (targetEnemy.x === target.x && targetEnemy.y === target.y)
                );

                if (isSelected) {
                    drawTargetHighlight(ctx, target, currentTime);
                }

                drawTarget(ctx, target, isSelected);
            });
        }

        if (agvPosition) {
            drawAGV(ctx, agvPosition);
        }

        if (hoveredCell) {
            drawHoveredCell(ctx, hoveredCell);
        }

        if (targetEnemy) {
            const animationFrame = requestAnimationFrame(() => {
                // 재렌더링 트리거
            });
            return () => cancelAnimationFrame(animationFrame);
        }

    }, [agvPosition, targets, targetEnemy, obstacles, path, agvPath, hoveredCell]);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (mouseX < 0 || mouseY < 0 || mouseX >= CANVAS_WIDTH || mouseY >= CANVAS_HEIGHT) {
            setHoveredCell(null);
            return;
        }

        const x = Math.round(mouseX / CELL_SIZE);
        const canvasY = Math.round(mouseY / CELL_SIZE);
        const y = MAP_SIZE - canvasY;

        if (x >= 0 && x <= MAP_SIZE && y >= 0 && y <= MAP_SIZE) {
            setHoveredCell({x, y});
        } else {
            setHoveredCell(null);
        }
    };

    const handleMouseLeave = () => {
        setHoveredCell(null);
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const x = (e.clientX - rect.left) / CELL_SIZE;
        const y = MAP_SIZE - (e.clientY - rect.top) / CELL_SIZE;

        if (onMapClick) {
            onMapClick({x, y});
        }
    };

    return (
        <div className="map-container" style={{
            background: '#0f1115',
            borderRadius: '12px',
            padding: '20px',
            display: 'inline-block'
        }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: 'crosshair',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                }}
            />
        </div>
    );
};

export default MapCanvas
