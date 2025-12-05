const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const gameMessage = document.getElementById('game-message');
const gameOverModal = document.getElementById('gameOverModal');
const restartBtn = document.getElementById('restartBtn');
const skipBtn = document.getElementById('skipBtn');
const saveScoreBtn = document.getElementById('save-score-btn');
const usernameInput = document.getElementById('username');
const leaderboard = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const closeLeaderboardBtn = document.getElementById('closeLeaderboard');

// ==================== 게임 상수 ====================
const SNOWBALL_SIZE = 70; // 더 큰 눈덩이
const INITIAL_WIDTH = 200; // 넓은 시작 크기
const INITIAL_SPEED = 2.5; // 적당한 시작 속도
const SPEED_INCREMENT = 0.02; // 아주 작은 속도 증가
const MAX_SPEED = 4; // 최대 속도 제한
const GROUND_HEIGHT = 120;

// ==================== 배경 상태 ====================
let backgroundProgress = 0; // 0 ~ 1 (지상 ~ 우주 끝)
let targetBackgroundProgress = 0;
const BACKGROUND_TRANSITION_SPEED = 0.005; // 부드러운 전환 속도

// ==================== 눈송이 ====================
const snowflakes = [];
const NUM_SNOWFLAKES = 200;

// ==================== 별 ====================
let stars = [];
const MAX_STARS = 500;

// ==================== 게임 상태 ====================
let snowballs = [];
let currentSnowball = null;
let score = 0;
let highScore = parseInt(localStorage.getItem('snowman_high_score') || '0');
let gameRunning = false;
let scrollOffset = 0;
let targetScrollOffset = 0; // 목표 스크롤 (부드러운 전환용)
let speed = INITIAL_SPEED;
let prevCanvasWidth = 0;
let prevCanvasHeight = 0;

// ==================== 캔버스 리사이즈 ====================
function resizeCanvas() {
    // 모바일에서 실제 뷰포트 크기 사용
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;

    // 이전 크기가 있고 게임 중이면 눈사람 위치 보정
    if (prevCanvasWidth > 0 && prevCanvasHeight > 0 && snowballs.length > 0) {
        const scaleX = vw / prevCanvasWidth;

        // 베이스 눈덩이의 기준점 (땅 위)
        const prevBaseY = prevCanvasHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const newBaseY = vh - GROUND_HEIGHT - SNOWBALL_SIZE;

        // 모든 눈사람 위치 보정
        for (const ball of snowballs) {
            // X: 비율로 스케일
            ball.x *= scaleX;
            ball.width *= scaleX;

            // Y: 베이스 기준으로 상대적 위치 유지
            const relativeY = ball.y - prevBaseY;
            ball.y = newBaseY + relativeY;
        }

        // 현재 이동 중인 눈덩이도 보정
        if (currentSnowball) {
            currentSnowball.x *= scaleX;
            currentSnowball.width *= scaleX;

            const relativeY = currentSnowball.y - prevBaseY;
            currentSnowball.y = newBaseY + relativeY;
        }

        // 스크롤 오프셋 보정 (Y 변화량 반영)
        const deltaBaseY = newBaseY - prevBaseY;
        scrollOffset += deltaBaseY;
    }

    // 이전 크기 저장
    prevCanvasWidth = vw;
    prevCanvasHeight = vh;

    canvas.width = vw;
    canvas.height = vh;
    initStars();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
}
resizeCanvas();

// ==================== 별 초기화 ====================
function initStars() {
    stars = [];
    for (let i = 0; i < MAX_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            color: Math.random() > 0.9 ? 'rgba(200, 220, 255,' : 'rgba(255, 255, 255,'
        });
    }
}

// ==================== 눈송이 초기화 ====================
function initSnowflakes() {
    snowflakes.length = 0;
    for (let i = 0; i < NUM_SNOWFLAKES; i++) {
        snowflakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1.5 + 0.5,
            wind: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.6 + 0.3
        });
    }
}

function updateSnowflakes() {
    for (const flake of snowflakes) {
        flake.y += flake.speed;
        flake.x += flake.wind + Math.sin(flake.y / 30) * 0.5;
        if (flake.y > canvas.height) {
            flake.y = -5;
            flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
    }
}

function drawSnowflakes(opacity) {
    for (const flake of snowflakes) {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * opacity})`;
        ctx.fill();
    }
}

// ==================== 별 그리기 ====================
function drawStars(opacity) {
    for (const star of stars) {
        star.twinkle += star.twinkleSpeed;
        const brightness = (0.4 + Math.sin(star.twinkle) * 0.6) * opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * opacity, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${brightness})`;
        ctx.fill();
    }
}

// ==================== 배경 요소들 ====================

// 달 그리기
function drawMoon(opacity, size) {
    if (opacity <= 0) return;

    const moonX = canvas.width - 120;
    const moonY = 100;
    const moonRadius = 50 * size;

    ctx.save();
    ctx.globalAlpha = opacity;

    // 달 glow
    ctx.shadowColor = '#fffde7';
    ctx.shadowBlur = 40;

    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        moonX - moonRadius / 3, moonY - moonRadius / 3, 0,
        moonX, moonY, moonRadius
    );
    gradient.addColorStop(0, '#fffef5');
    gradient.addColorStop(0.5, '#fff8dc');
    gradient.addColorStop(1, '#f0e68c');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
}

// 지구 그리기 (실제 지구 형상)
function drawEarth(opacity, yOffset) {
    if (opacity <= 0) return;

    const earthX = canvas.width / 2;
    const earthY = canvas.height + 100 - yOffset;
    const earthRadius = 180;

    if (earthY - earthRadius > canvas.height) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    // 대기 glow
    ctx.shadowColor = '#87CEEB';
    ctx.shadowBlur = 60;

    // 바다 (기본 배경)
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
    const oceanGradient = ctx.createRadialGradient(
        earthX - earthRadius * 0.3, earthY - earthRadius * 0.3, 0,
        earthX, earthY, earthRadius
    );
    oceanGradient.addColorStop(0, '#4FC3F7');
    oceanGradient.addColorStop(0.3, '#29B6F6');
    oceanGradient.addColorStop(0.6, '#0288D1');
    oceanGradient.addColorStop(1, '#01579B');
    ctx.fillStyle = oceanGradient;
    ctx.fill();

    ctx.shadowBlur = 0;

    // 클리핑 마스크 설정 (지구 원 안에서만 대륙 그리기)
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius - 2, 0, Math.PI * 2);
    ctx.clip();

    // 대륙들 (간략화된 형태)
    ctx.fillStyle = '#4CAF50';

    // 아시아/유럽 대륙
    ctx.beginPath();
    ctx.ellipse(earthX + earthRadius * 0.3, earthY - earthRadius * 0.2,
        earthRadius * 0.5, earthRadius * 0.35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 아프리카
    ctx.beginPath();
    ctx.ellipse(earthX + earthRadius * 0.1, earthY + earthRadius * 0.3,
        earthRadius * 0.2, earthRadius * 0.35, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 북아메리카
    ctx.beginPath();
    ctx.ellipse(earthX - earthRadius * 0.5, earthY - earthRadius * 0.15,
        earthRadius * 0.3, earthRadius * 0.4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 남아메리카
    ctx.beginPath();
    ctx.ellipse(earthX - earthRadius * 0.35, earthY + earthRadius * 0.4,
        earthRadius * 0.15, earthRadius * 0.3, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 호주
    ctx.beginPath();
    ctx.ellipse(earthX + earthRadius * 0.6, earthY + earthRadius * 0.4,
        earthRadius * 0.12, earthRadius * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // 구름 (흰색 반투명)
    ctx.globalAlpha = opacity * 0.4;
    ctx.fillStyle = '#FFFFFF';

    const cloudPositions = [
        { x: 0.2, y: -0.3, rx: 0.2, ry: 0.06 },
        { x: -0.4, y: 0.1, rx: 0.25, ry: 0.05 },
        { x: 0.5, y: 0.2, rx: 0.15, ry: 0.04 },
        { x: -0.2, y: -0.5, rx: 0.18, ry: 0.05 },
        { x: 0.3, y: 0.5, rx: 0.22, ry: 0.06 }
    ];

    for (const cloud of cloudPositions) {
        ctx.beginPath();
        ctx.ellipse(
            earthX + cloud.x * earthRadius,
            earthY + cloud.y * earthRadius,
            cloud.rx * earthRadius,
            cloud.ry * earthRadius,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();

    // 대기층 테두리
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
}

// 은하 그리기
function drawGalaxy(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const centerX = canvas.width * 0.75;
    const centerY = canvas.height * 0.25;

    // 나선 은하
    for (let arm = 0; arm < 2; arm++) {
        const armOffset = arm * Math.PI;
        for (let i = 0; i < 150; i++) {
            const angle = i * 0.08 + armOffset;
            const radius = i * 1.2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.35;

            const starSize = Math.random() * 2 + 0.5;
            const brightness = 0.2 + Math.random() * 0.5;

            ctx.beginPath();
            ctx.arc(x, y, starSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${200 + Math.random() * 55}, ${180 + Math.random() * 75}, 255, ${brightness})`;
            ctx.fill();
        }
    }

    // 은하 중심
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
    coreGradient.addColorStop(0, 'rgba(255, 250, 200, 0.9)');
    coreGradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.5)');
    coreGradient.addColorStop(1, 'rgba(255, 180, 100, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.restore();
}

// 성운 그리기
function drawNebula(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    const nebulaData = [
        { x: 0.15, y: 0.3, color: '#ff006630', size: 150 },
        { x: 0.4, y: 0.2, color: '#9900ff25', size: 120 },
        { x: 0.6, y: 0.7, color: '#00ff9920', size: 100 },
        { x: 0.85, y: 0.5, color: '#ff990025', size: 130 }
    ];

    for (const nebula of nebulaData) {
        const x = canvas.width * nebula.x;
        const y = canvas.height * nebula.y;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, nebula.size);
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, nebula.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.restore();
}

// 먼 은하들
function drawDistantGalaxies(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const galaxies = [
        { x: 0.1, y: 0.15 }, { x: 0.25, y: 0.6 }, { x: 0.45, y: 0.1 },
        { x: 0.65, y: 0.55 }, { x: 0.85, y: 0.25 }, { x: 0.3, y: 0.85 },
        { x: 0.7, y: 0.8 }, { x: 0.55, y: 0.35 }
    ];

    for (let i = 0; i < galaxies.length; i++) {
        const g = galaxies[i];
        const x = canvas.width * g.x;
        const y = canvas.height * g.y;
        const angle = i * 0.5;

        ctx.beginPath();
        ctx.ellipse(x, y, 10 + i * 2, 4 + i, angle, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${200 + i * 5}, ${200 + i * 5}, 255, ${0.4 + i * 0.05})`;
        ctx.fill();
    }

    ctx.restore();
}

// 블랙홀 그리기
function drawBlackHole(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const centerX = canvas.width * 0.3;
    const centerY = canvas.height * 0.35;
    const radius = 60;

    // 강착원반 (accretion disk)
    for (let i = 5; i > 0; i--) {
        const diskRadius = radius + i * 25;
        const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, diskRadius);
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0)');
        gradient.addColorStop(0.3, `rgba(255, ${150 - i * 20}, ${50 - i * 10}, ${0.3 - i * 0.04})`);
        gradient.addColorStop(0.6, `rgba(255, ${200 - i * 30}, ${100 - i * 15}, ${0.2 - i * 0.03})`);
        gradient.addColorStop(1, 'rgba(255, 200, 150, 0)');

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, diskRadius, diskRadius * 0.3, Math.PI * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // 블랙홀 중심 (완전한 검정)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // 이벤트 호라이즌 테두리
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 150, 50, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
}

// 퀘이사 그리기
function drawQuasar(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const centerX = canvas.width * 0.8;
    const centerY = canvas.height * 0.2;

    // 제트 (위아래로 뿜어져 나오는 빛)
    const jetGradient1 = ctx.createLinearGradient(centerX, centerY - 200, centerX, centerY);
    jetGradient1.addColorStop(0, 'rgba(100, 150, 255, 0)');
    jetGradient1.addColorStop(0.5, 'rgba(150, 200, 255, 0.3)');
    jetGradient1.addColorStop(1, 'rgba(200, 220, 255, 0.6)');

    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY);
    ctx.lineTo(centerX - 3, centerY - 200);
    ctx.lineTo(centerX + 3, centerY - 200);
    ctx.lineTo(centerX + 8, centerY);
    ctx.fillStyle = jetGradient1;
    ctx.fill();

    const jetGradient2 = ctx.createLinearGradient(centerX, centerY, centerX, centerY + 200);
    jetGradient2.addColorStop(0, 'rgba(200, 220, 255, 0.6)');
    jetGradient2.addColorStop(0.5, 'rgba(150, 200, 255, 0.3)');
    jetGradient2.addColorStop(1, 'rgba(100, 150, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY);
    ctx.lineTo(centerX - 3, centerY + 200);
    ctx.lineTo(centerX + 3, centerY + 200);
    ctx.lineTo(centerX + 8, centerY);
    ctx.fillStyle = jetGradient2;
    ctx.fill();

    // 중심 광원
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
    coreGradient.addColorStop(0.6, 'rgba(150, 180, 255, 0.4)');
    coreGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.restore();
}

// 우주 먼지/암흑 성운 그리기
function drawCosmicDust(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity * 0.4;

    const dustClouds = [
        { x: 0.2, y: 0.5, size: 200, color: 'rgba(20, 10, 30, 0.5)' },
        { x: 0.6, y: 0.3, size: 150, color: 'rgba(30, 15, 40, 0.4)' },
        { x: 0.8, y: 0.7, size: 180, color: 'rgba(15, 10, 25, 0.5)' },
        { x: 0.4, y: 0.8, size: 120, color: 'rgba(25, 12, 35, 0.4)' }
    ];

    for (const dust of dustClouds) {
        const x = canvas.width * dust.x;
        const y = canvas.height * dust.y;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, dust.size);
        gradient.addColorStop(0, dust.color);
        gradient.addColorStop(0.5, dust.color.replace('0.5', '0.3').replace('0.4', '0.2'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, dust.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.restore();
}

// 은하 필라멘트 (우주 거대 구조)
function drawCosmicWeb(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    ctx.strokeStyle = 'rgba(100, 80, 150, 0.3)';
    ctx.lineWidth = 1;

    // 노드들 (은하단)
    const nodes = [
        { x: 0.1, y: 0.2 }, { x: 0.3, y: 0.1 }, { x: 0.5, y: 0.25 },
        { x: 0.7, y: 0.15 }, { x: 0.9, y: 0.3 }, { x: 0.2, y: 0.5 },
        { x: 0.4, y: 0.45 }, { x: 0.6, y: 0.5 }, { x: 0.8, y: 0.55 },
        { x: 0.15, y: 0.75 }, { x: 0.35, y: 0.8 }, { x: 0.55, y: 0.7 },
        { x: 0.75, y: 0.85 }, { x: 0.95, y: 0.7 }
    ];

    // 필라멘트 연결선
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 8],
        [5, 6], [6, 7], [7, 8], [5, 9], [6, 10], [7, 11], [8, 13],
        [9, 10], [10, 11], [11, 12], [12, 13]
    ];

    for (const [i, j] of connections) {
        const x1 = canvas.width * nodes[i].x;
        const y1 = canvas.height * nodes[i].y;
        const x2 = canvas.width * nodes[j].x;
        const y2 = canvas.height * nodes[j].y;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        // 곡선으로 연결
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 30;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 30;
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();
    }

    // 노드에 작은 빛점
    for (const node of nodes) {
        const x = canvas.width * node.x;
        const y = canvas.height * node.y;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 130, 200, 0.5)';
        ctx.fill();
    }

    ctx.restore();
}

// 빅뱅 잔광 (CMB - 우주 마이크로파 배경)
function drawCMB(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity * 0.15;

    // 미세한 온도 변화를 나타내는 노이즈 패턴
    const cellSize = 20;
    for (let x = 0; x < canvas.width; x += cellSize) {
        for (let y = 0; y < canvas.height; y += cellSize) {
            const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01) + Math.random() * 0.5;
            const temp = Math.floor(128 + noise * 60);
            const r = temp + 30;
            const g = temp - 20;
            const b = temp + 50;

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    ctx.restore();
}

// 다중 우주 (멀티버스) 거품
function drawMultiverse(opacity) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const bubbles = [
        { x: 0.15, y: 0.3, r: 80, color: 'rgba(100, 50, 150, 0.2)' },
        { x: 0.5, y: 0.2, r: 100, color: 'rgba(50, 100, 150, 0.2)' },
        { x: 0.85, y: 0.4, r: 70, color: 'rgba(150, 50, 100, 0.2)' },
        { x: 0.3, y: 0.7, r: 90, color: 'rgba(100, 150, 50, 0.2)' },
        { x: 0.7, y: 0.75, r: 75, color: 'rgba(150, 100, 50, 0.2)' }
    ];

    for (const bubble of bubbles) {
        const x = canvas.width * bubble.x;
        const y = canvas.height * bubble.y;

        // 거품 내부 (다른 우주)
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, bubble.r);
        innerGradient.addColorStop(0, bubble.color.replace('0.2', '0.4'));
        innerGradient.addColorStop(0.7, bubble.color);
        innerGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, bubble.r, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();

        // 거품 테두리 (막)
        ctx.beginPath();
        ctx.arc(x, y, bubble.r, 0, Math.PI * 2);
        ctx.strokeStyle = bubble.color.replace('0.2', '0.5');
        ctx.lineWidth = 2;
        ctx.stroke();

        // 내부에 작은 별들 (다른 우주의 별)
        for (let i = 0; i < 5; i++) {
            const starX = x + (Math.random() - 0.5) * bubble.r * 1.2;
            const starY = y + (Math.random() - 0.5) * bubble.r * 1.2;
            const dist = Math.sqrt((starX - x) ** 2 + (starY - y) ** 2);

            if (dist < bubble.r * 0.8) {
                ctx.beginPath();
                ctx.arc(starX, starY, 1, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

// ==================== 양옆 오브젝트 그리기 ====================
function drawSideObjects(progress, groundYOffset) {
    ctx.save();

    // 오브젝트는 땅과 함께 아래로 내려감 (배경 진행도에 따라)
    // groundYOffset은 양수이고, Y에 더하면 아래로 이동
    const baseY = groundYOffset;

    // 1. 겨울 밤 ~ 높은 하늘: 나무, 집
    if (progress < 0.2) {
        const opacity = 1 - smoothStep(0.1, 0.2, progress);
        ctx.globalAlpha = opacity;

        // 왼쪽 나무들
        drawTree(-30, canvas.height - 200 + baseY, 1);
        drawTree(40, canvas.height - 180 + baseY, 0.8);

        // 오른쪽 집
        drawHouse(canvas.width - 100, canvas.height - 160 + baseY, 0.7);

        // 오른쪽 나무
        drawTree(canvas.width - 50, canvas.height - 190 + baseY, 0.9);
    }

    // 2. 성층권: 구름, 비행기
    if (progress > 0.1 && progress < 0.35) {
        const opacity = smoothStep(0.1, 0.18, progress) * (1 - smoothStep(0.28, 0.35, progress));
        ctx.globalAlpha = opacity;

        // 구름들
        drawCloud(50, 100 + baseY, 60);
        drawCloud(canvas.width - 120, 150 + baseY, 50);
        drawCloud(30, 250 + baseY, 40);
        drawCloud(canvas.width - 80, 200 + baseY, 45);

        // 비행기
        drawAirplane(canvas.width - 150, 180 + baseY);
    }

    // 3. 우주 진입 ~ 깊은 우주: 위성, 우주선
    if (progress > 0.2 && progress < 0.5) {
        const opacity = smoothStep(0.2, 0.28, progress) * (1 - smoothStep(0.42, 0.5, progress));
        ctx.globalAlpha = opacity;

        // 위성
        drawSatellite(80, 150 + baseY);
        drawSatellite(canvas.width - 100, 300 + baseY);

        // 우주 정거장
        drawSpaceStation(canvas.width - 180, 120 + baseY);
    }

    // 4. 은하계: 행성들
    if (progress > 0.35 && progress < 0.65) {
        const opacity = smoothStep(0.35, 0.42, progress) * (1 - smoothStep(0.58, 0.65, progress));
        ctx.globalAlpha = opacity;

        // 행성들
        drawPlanet(60, 180 + baseY, 35, '#e74c3c', true);
        drawPlanet(canvas.width - 80, 130 + baseY, 50, '#f39c12', false);
        drawPlanet(40, 350 + baseY, 25, '#3498db', false);
        drawPlanet(canvas.width - 60, 320 + baseY, 30, '#9b59b6', true);
    }

    // 5. 은하 외곽 ~ 태양계 밖: 소행성대
    if (progress > 0.45 && progress < 0.7) {
        const opacity = smoothStep(0.45, 0.52, progress) * (1 - smoothStep(0.63, 0.7, progress));
        ctx.globalAlpha = opacity;

        // 소행성들
        for (let i = 0; i < 8; i++) {
            const x = (i % 2 === 0) ? 20 + i * 15 : canvas.width - 30 - i * 12;
            const y = 80 + i * 55 + baseY;
            drawAsteroid(x, y, 8 + i * 2);
        }
    }

    // 6. 블랙홀 지대: 빨려들어가는 물질
    if (progress > 0.6 && progress < 0.8) {
        const opacity = smoothStep(0.6, 0.67, progress) * (1 - smoothStep(0.73, 0.8, progress));
        ctx.globalAlpha = opacity;

        // 빨려들어가는 잔해들
        for (let i = 0; i < 6; i++) {
            const angle = (Date.now() / 2000 + i) % (Math.PI * 2);
            const x = (i % 2 === 0) ? 60 + Math.cos(angle) * 20 : canvas.width - 60 + Math.sin(angle) * 20;
            const y = 120 + i * 65 + baseY;
            drawDebris(x, y, 5 + i * 2, angle);
        }
    }

    // 7. 퀘이사 ~ 우주 거대구조: 에너지 파동
    if (progress > 0.7 && progress < 0.9) {
        const opacity = smoothStep(0.7, 0.76, progress) * (1 - smoothStep(0.84, 0.9, progress));
        ctx.globalAlpha = opacity;

        // 에너지 파동
        drawEnergyWave(40, 180 + baseY);
        drawEnergyWave(canvas.width - 60, 300 + baseY);
    }

    // 8. 빅뱅 잔광 ~ 다중우주: 시공간 왜곡
    if (progress > 0.85) {
        const opacity = smoothStep(0.85, 0.92, progress);
        ctx.globalAlpha = opacity;

        // 시공간 균열
        drawSpacetimeRift(30, 150 + baseY);
        drawSpacetimeRift(canvas.width - 50, 280 + baseY);
        drawSpacetimeRift(50, 400 + baseY);
    }

    ctx.restore();
}

// 개별 오브젝트 그리기 함수들
function drawTree(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 나무 줄기
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-8, -20, 16, 60);

    // 나뭇잎 (삼각형 3개)
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(-35, -40);
    ctx.lineTo(35, -40);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(-30, -20);
    ctx.lineTo(30, -20);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(-25, 0);
    ctx.lineTo(25, 0);
    ctx.fill();

    // 눈
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -98);
    ctx.lineTo(-15, -60);
    ctx.lineTo(15, -60);
    ctx.fill();

    ctx.restore();
}

function drawHouse(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 집 본체
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-40, -40, 80, 60);

    // 지붕
    ctx.fillStyle = '#A52A2A';
    ctx.beginPath();
    ctx.moveTo(-50, -40);
    ctx.lineTo(0, -80);
    ctx.lineTo(50, -40);
    ctx.fill();

    // 눈 덮인 지붕
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-48, -42);
    ctx.lineTo(0, -78);
    ctx.lineTo(48, -42);
    ctx.lineTo(0, -50);
    ctx.fill();

    // 창문
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-25, -25, 18, 18);
    ctx.fillRect(7, -25, 18, 18);

    // 문
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-10, -10, 20, 30);

    ctx.restore();
}

function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawAirplane(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // 동체
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 날개
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-15, -25);
    ctx.lineTo(10, -25);
    ctx.lineTo(5, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-15, 25);
    ctx.lineTo(10, 25);
    ctx.lineTo(5, 0);
    ctx.fill();

    // 꼬리 날개
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-35, -12);
    ctx.lineTo(-28, 0);
    ctx.fill();

    // 창문
    ctx.fillStyle = '#3498db';
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-15 + i * 10, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawSatellite(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // 본체
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(-10, -8, 20, 16);

    // 태양 전지판
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-40, -5, 25, 10);
    ctx.fillRect(15, -5, 25, 10);

    // 전지판 무늬
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-38 + i * 7, -5);
        ctx.lineTo(-38 + i * 7, 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(17 + i * 7, -5);
        ctx.lineTo(17 + i * 7, 5);
        ctx.stroke();
    }

    // 안테나
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -22, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawSpaceStation(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // 중앙 모듈
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(-15, -10, 30, 20);

    // 측면 모듈
    ctx.fillRect(-50, -8, 30, 16);
    ctx.fillRect(20, -8, 30, 16);

    // 태양 전지판
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(-80, -25, 25, 50);
    ctx.fillRect(55, -25, 25, 50);

    // 전지판 프레임
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(-80, -25, 25, 50);
    ctx.strokeRect(55, -25, 25, 50);

    ctx.restore();
}

function drawPlanet(x, y, radius, color, hasRing) {
    ctx.save();

    // 행성 본체
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkenColor(color, 30));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 고리 (있는 경우)
    if (hasRing) {
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.8, radius * 0.4, Math.PI * 0.1, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawAsteroid(x, y, size) {
    ctx.save();
    ctx.fillStyle = '#7f8c8d';

    ctx.beginPath();
    ctx.moveTo(x + size, y);
    for (let i = 1; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = size * (0.7 + Math.sin(i * 3) * 0.3);
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // 크레이터
    ctx.fillStyle = '#5d6d7e';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawDebris(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, size * 0.5);
    ctx.lineTo(-size * 0.7, size * 0.5);
    ctx.closePath();
    ctx.fill();

    // 불꽃 효과
    ctx.fillStyle = 'rgba(255, 200, 50, 0.6)';
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.3);
    ctx.lineTo(size, size * 1.5);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, size * 1.5);
    ctx.lineTo(-size * 0.5, size * 0.3);
    ctx.fill();

    ctx.restore();
}

function drawEnergyWave(x, y) {
    ctx.save();

    for (let i = 0; i < 3; i++) {
        const radius = 20 + i * 15 + (Date.now() / 50 % 30);
        const alpha = 0.5 - i * 0.15;

        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 중심 광원
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    coreGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();

    ctx.restore();
}

function drawSpacetimeRift(x, y) {
    ctx.save();

    // 균열 효과
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    gradient.addColorStop(0, 'rgba(150, 50, 200, 0.8)');
    gradient.addColorStop(0.5, 'rgba(100, 0, 150, 0.4)');
    gradient.addColorStop(1, 'rgba(50, 0, 100, 0)');

    ctx.beginPath();
    ctx.ellipse(x, y, 40, 15, Math.PI * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 가장자리 빛
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 17, Math.PI * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // 내부 왜곡선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x, y, 30 - i * 10, 10 - i * 3, Math.PI * 0.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// 색상 유틸리티 함수
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
}

// ==================== 땅과 산 그리기 ====================
function drawGround(opacity, yOffset) {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const baseGroundY = canvas.height - GROUND_HEIGHT + yOffset;

    // 뒤쪽 산 (더 높이, 더 어둡게)
    ctx.fillStyle = '#5D6D7E';
    ctx.beginPath();
    ctx.moveTo(0, baseGroundY);
    ctx.lineTo(0, baseGroundY - 180 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.15, baseGroundY - 280 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.25, baseGroundY - 200 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.35, baseGroundY - 320 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.5, baseGroundY - 250 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.6, baseGroundY - 350 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.75, baseGroundY - 280 + yOffset * 0.5);
    ctx.lineTo(canvas.width * 0.85, baseGroundY - 220 + yOffset * 0.5);
    ctx.lineTo(canvas.width, baseGroundY - 180 + yOffset * 0.5);
    ctx.lineTo(canvas.width, baseGroundY + 200);
    ctx.lineTo(0, baseGroundY + 200);
    ctx.closePath();
    ctx.fill();

    // 앞쪽 산 (더 낮게, 더 밝게)
    ctx.fillStyle = '#7F8C8D';
    ctx.beginPath();
    ctx.moveTo(0, baseGroundY);
    ctx.lineTo(0, baseGroundY - 100 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.1, baseGroundY - 150 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.2, baseGroundY - 100 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.3, baseGroundY - 180 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.45, baseGroundY - 120 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.55, baseGroundY - 200 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.7, baseGroundY - 140 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.8, baseGroundY - 100 + yOffset * 0.3);
    ctx.lineTo(canvas.width * 0.9, baseGroundY - 160 + yOffset * 0.3);
    ctx.lineTo(canvas.width, baseGroundY - 80 + yOffset * 0.3);
    ctx.lineTo(canvas.width, baseGroundY + 200);
    ctx.lineTo(0, baseGroundY + 200);
    ctx.closePath();
    ctx.fill();

    // 눈 덮인 땅
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(0, baseGroundY, canvas.width, GROUND_HEIGHT + 200);

    // 물결 모양 눈
    ctx.beginPath();
    ctx.moveTo(0, baseGroundY);
    for (let x = 0; x <= canvas.width; x += 60) {
        const waveHeight = Math.sin(x / 40) * 20 + Math.cos(x / 80) * 10;
        ctx.lineTo(x, baseGroundY - waveHeight - 15);
    }
    ctx.lineTo(canvas.width, baseGroundY);
    ctx.lineTo(canvas.width, baseGroundY + 200);
    ctx.lineTo(0, baseGroundY + 200);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 눈 반짝임
    for (let i = 0; i < 20; i++) {
        const sparkleX = (canvas.width / 20) * i + 10;
        const sparkleY = baseGroundY - Math.sin(sparkleX / 30) * 15 - 5;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
    }

    ctx.restore();
}

// ==================== 배경 그리기 (부드러운 전환) ====================
function drawBackground() {
    // 배경 진행도 부드럽게 전환
    if (backgroundProgress < targetBackgroundProgress) {
        backgroundProgress = Math.min(backgroundProgress + BACKGROUND_TRANSITION_SPEED, targetBackgroundProgress);
    }

    const p = backgroundProgress; // 0 ~ 1

    // 하늘 색상 보간 - 더 다양한 색상 변화 (확장된 스테이지)
    const skyColors = [
        { pos: 0.0, top: '#1a1a2e', mid: '#16213e', bot: '#0f3460' },   // 겨울 밤 (파란 톤)
        { pos: 0.08, top: '#0f0f23', mid: '#1a1a3e', bot: '#2d132c' },  // 높은 하늘 (보라 톤)
        { pos: 0.16, top: '#0d0d1a', mid: '#1f0f30', bot: '#3d1a4a' },  // 성층권 (자주색)
        { pos: 0.24, top: '#050510', mid: '#0a0a20', bot: '#15102a' },  // 우주 진입 (어두운 남색)
        { pos: 0.32, top: '#020208', mid: '#0a0520', bot: '#150a30' },  // 깊은 우주 (검은 보라)
        { pos: 0.40, top: '#030010', mid: '#100028', bot: '#1a0040' },  // 은하계 (진한 보라)
        { pos: 0.48, top: '#050008', mid: '#0f0018', bot: '#180028' },  // 은하 외곽 (어두운 자주)
        { pos: 0.56, top: '#000005', mid: '#050010', bot: '#0a001a' },  // 태양계 밖 (거의 검정)
        { pos: 0.64, top: '#02000a', mid: '#08001a', bot: '#100025' },  // 블랙홀 지대 (검은 남색)
        { pos: 0.72, top: '#000008', mid: '#050015', bot: '#0a0020' },  // 퀘이사 영역 (어두운 파랑)
        { pos: 0.80, top: '#030005', mid: '#080010', bot: '#0d0018' },  // 우주 거대구조 (암흑)
        { pos: 0.88, top: '#020003', mid: '#050008', bot: '#080010' },  // 빅뱅 잔광 (미세한 빛)
        { pos: 1.0, top: '#010002', mid: '#030005', bot: '#050008' }    // 다중우주 경계 (거의 무)
    ];

    // 현재 위치에 맞는 색상 보간
    let colorSet = skyColors[0];
    for (let i = 1; i < skyColors.length; i++) {
        if (p <= skyColors[i].pos) {
            const prev = skyColors[i - 1];
            const next = skyColors[i];
            const t = (p - prev.pos) / (next.pos - prev.pos);
            colorSet = {
                top: lerpColor(prev.top, next.top, t),
                mid: lerpColor(prev.mid, next.mid, t),
                bot: lerpColor(prev.bot, next.bot, t)
            };
            break;
        }
        if (i === skyColors.length - 1) colorSet = skyColors[i];
    }

    // 배경 그라데이션
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, colorSet.top);
    skyGradient.addColorStop(0.5, colorSet.mid);
    skyGradient.addColorStop(1, colorSet.bot);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 각 요소들 (진행도에 따라 opacity 조절) - 13개 스테이지

    // 초반 요소들
    drawStars(smoothStep(0.08, 0.2, p));                                      // 별: 일찍 등장
    drawMoon(1 - smoothStep(0.12, 0.28, p), 1 - p * 0.8);                     // 달: 점점 작아지며 사라짐

    // 중반 요소들
    drawGalaxy(smoothStep(0.28, 0.4, p) * (1 - smoothStep(0.55, 0.65, p)));   // 은하: 우주 진입~은하 외곽
    drawNebula(smoothStep(0.35, 0.5, p) * (1 - smoothStep(0.6, 0.72, p)));    // 성운: 깊은 우주~태양계 밖
    drawDistantGalaxies(smoothStep(0.42, 0.55, p) * (1 - smoothStep(0.68, 0.8, p))); // 먼 은하들
    drawCosmicDust(smoothStep(0.48, 0.6, p) * (1 - smoothStep(0.75, 0.88, p))); // 우주 먼지

    // 후반 요소들 (새로운 스테이지)
    drawBlackHole(smoothStep(0.56, 0.68, p) * (1 - smoothStep(0.78, 0.88, p)));  // 블랙홀
    drawQuasar(smoothStep(0.64, 0.76, p) * (1 - smoothStep(0.85, 0.95, p)));     // 퀘이사
    drawCosmicWeb(smoothStep(0.72, 0.84, p) * (1 - smoothStep(0.92, 1.0, p)));   // 우주 거대구조
    drawCMB(smoothStep(0.8, 0.92, p));                                           // 빅뱅 잔광 (계속 유지)
    drawMultiverse(smoothStep(0.88, 1.0, p));                                    // 다중우주 (마지막)

    // 눈송이 (지상에서만)
    const snowOpacity = 1 - smoothStep(0.04, 0.12, p);
    if (snowOpacity > 0) {
        updateSnowflakes();
        drawSnowflakes(snowOpacity);
    }

    // 땅과 산 (아래로 스크롤) - 더 빨리 사라지도록
    const groundYOffset = p * 1200;
    drawGround(1 - smoothStep(0.06, 0.16, p), groundYOffset);

    // 양옆 오브젝트 (땅과 함께 내려감)
    drawSideObjects(p, groundYOffset);

    // 현재 위치 표시 - 13개 스테이지
    const stageNames = [
        '🌙 겨울 밤',        // 0.00 - 0.08
        '⛅ 높은 하늘',      // 0.08 - 0.16
        '🌌 성층권',         // 0.16 - 0.24
        '🌠 우주 진입',      // 0.24 - 0.32
        '🌑 깊은 우주',      // 0.32 - 0.40
        '🌀 은하계',         // 0.40 - 0.48
        '✨ 은하 외곽',      // 0.48 - 0.56
        '🚀 태양계 밖',      // 0.56 - 0.64
        '🕳️ 블랙홀 지대',   // 0.64 - 0.72
        '💫 퀘이사 영역',    // 0.72 - 0.80
        '🕸️ 우주 거대구조', // 0.80 - 0.88
        '🔥 빅뱅 잔광',      // 0.88 - 0.96
        '🌈 다중우주 경계'   // 0.96 - 1.00
    ];
    let stageName = stageNames[0];
    if (p >= 0.96) stageName = stageNames[12];
    else if (p >= 0.88) stageName = stageNames[11];
    else if (p >= 0.80) stageName = stageNames[10];
    else if (p >= 0.72) stageName = stageNames[9];
    else if (p >= 0.64) stageName = stageNames[8];
    else if (p >= 0.56) stageName = stageNames[7];
    else if (p >= 0.48) stageName = stageNames[6];
    else if (p >= 0.40) stageName = stageNames[5];
    else if (p >= 0.32) stageName = stageNames[4];
    else if (p >= 0.24) stageName = stageNames[3];
    else if (p >= 0.16) stageName = stageNames[2];
    else if (p >= 0.08) stageName = stageNames[1];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(stageName, 20, canvas.height - 20);
}

// 색상 보간 함수
function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// 부드러운 전환 함수
function smoothStep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// ==================== 고퀄리티 눈덩이 그리기 ====================
function drawSnowballShape(x, y, width) {
    const radius = Math.min(width, SNOWBALL_SIZE) / 2;
    const centerX = x + width / 2;
    const centerY = y + radius; // 실제 반지름 기준으로 중앙 계산

    ctx.save();

    // 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;

    // 메인 눈덩이
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    // 다중 그라데이션으로 입체감
    const mainGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX + radius * 0.1, centerY + radius * 0.1, radius
    );
    mainGradient.addColorStop(0, '#ffffff');
    mainGradient.addColorStop(0.3, '#f8fcff');
    mainGradient.addColorStop(0.6, '#e8f4fc');
    mainGradient.addColorStop(0.85, '#d0e8f5');
    mainGradient.addColorStop(1, '#b8d8ed');

    ctx.fillStyle = mainGradient;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 테두리 (부드러운)
    ctx.strokeStyle = 'rgba(150, 190, 210, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 하이라이트 (큰 반짝임)
    ctx.beginPath();
    ctx.ellipse(
        centerX - radius * 0.35,
        centerY - radius * 0.35,
        radius * 0.25,
        radius * 0.15,
        -Math.PI / 4,
        0, Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // 작은 하이라이트
    ctx.beginPath();
    ctx.arc(
        centerX - radius * 0.15,
        centerY - radius * 0.5,
        radius * 0.08,
        0, Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    // 눈 결정 텍스처 (미세한 점들)
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Date.now() / 5000;
        const dist = radius * 0.4 + Math.sin(i * 2) * radius * 0.2;
        const sparkleX = centerX + Math.cos(angle) * dist;
        const sparkleY = centerY + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    ctx.restore();
}

// ==================== 눈덩이 클래스 ====================
class Snowball {
    constructor(x, y, width, isBase = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.isBase = isBase;
    }

    draw(groundOffset = 0) {
        drawSnowballShape(this.x, this.y - scrollOffset + groundOffset, this.width);
    }
}

// ==================== 게임 초기화 ====================
function initGame() {
    snowballs = [];
    score = 0;
    speed = INITIAL_SPEED;
    scrollOffset = 0;
    targetScrollOffset = 0;
    backgroundProgress = 0;
    targetBackgroundProgress = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameRunning = true;
    gameOverModal.classList.add('hidden');
    gameMessage.textContent = '클릭 또는 스페이스바로 눈을 떨어뜨리세요!';

    initSnowflakes();
    initStars();

    // 베이스 눈덩이
    const baseSnowball = new Snowball(
        (canvas.width - INITIAL_WIDTH) / 2,
        canvas.height - GROUND_HEIGHT - SNOWBALL_SIZE,
        INITIAL_WIDTH,
        true
    );
    snowballs.push(baseSnowball);

    spawnNextSnowball();
    animate();
}

function spawnNextSnowball() {
    const prevSnowball = snowballs[snowballs.length - 1];

    // 이전 눈덩이의 실제 높이 계산
    const prevRadius = Math.min(prevSnowball.width, SNOWBALL_SIZE) / 2;
    const prevHeight = prevRadius * 2;

    // 다음 눈덩이의 예상 높이 (같은 너비 가정)
    const nextRadius = Math.min(prevSnowball.width, SNOWBALL_SIZE) / 2;
    const nextHeight = nextRadius * 2;

    currentSnowball = {
        x: 0,
        y: prevSnowball.y - nextHeight, // 실제 높이 기준으로 배치
        width: prevSnowball.width,
        direction: 1
    };
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snowman_high_score', highScore.toString());
        highScoreElement.textContent = highScore;
    }

    gameOverModal.classList.remove('hidden');
}

// 무게중심 계산: 새 눈덩이가 아래 눈덩이 위에 안정적으로 놓일 수 있는지 확인
function checkBalanceStability(newBall, prevBall) {
    // 새 눈덩이의 중심
    const newCenterX = newBall.x + newBall.width / 2;

    // 이전 눈덩이의 지지 범위 (중심에서 양쪽으로 일정 비율)
    const prevCenterX = prevBall.x + prevBall.width / 2;
    const supportRadius = prevBall.width * 0.25; // 25% 범위 내에 중심이 있어야 안정

    const offset = Math.abs(newCenterX - prevCenterX);

    // 안정성 비율 반환 (0 = 불안정, 1 = 완벽히 안정)
    if (offset <= supportRadius) {
        return 1;
    }

    // 지지 범위를 벗어난 정도
    const maxOffset = prevBall.width / 2;
    const instability = (offset - supportRadius) / (maxOffset - supportRadius);

    return Math.max(0, 1 - instability);
}

function placeSnowball() {
    if (!gameRunning || !currentSnowball) return;

    const prevSnowball = snowballs[snowballs.length - 1];

    // 겹침 계산
    const overlapStart = Math.max(currentSnowball.x, prevSnowball.x);
    const overlapEnd = Math.min(currentSnowball.x + currentSnowball.width, prevSnowball.x + prevSnowball.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
        gameOver();
        return;
    }

    // 관대한 겹침 판정: 70% 이상 겹치면 이전 크기 유지
    const overlapRatio = overlapWidth / prevSnowball.width;
    const finalWidth = overlapRatio >= 0.7 ? prevSnowball.width : overlapWidth;
    const finalX = overlapRatio >= 0.7 ? prevSnowball.x : overlapStart;

    // 임시 눈덩이로 균형 체크
    const tempBall = { x: finalX, width: finalWidth };
    const stability = checkBalanceStability(tempBall, prevSnowball);

    // 안정성이 30% 미만이면 무너짐
    if (stability < 0.3) {
        gameMessage.textContent = '균형을 잃었습니다!';
        gameOver();
        return;
    }

    // 새 눈덩이의 실제 반지름
    const newRadius = Math.min(finalWidth, SNOWBALL_SIZE) / 2;

    // 새 눈덩이의 Y 위치 = 이전 눈덩이 상단 - 새 눈덩이 높이
    const newY = prevSnowball.y - (newRadius * 2);

    // 성공
    const newSnowball = new Snowball(
        finalX,
        newY,
        finalWidth
    );

    snowballs.push(newSnowball);
    score++;
    scoreElement.textContent = score;

    // 균형 상태 메시지
    if (stability >= 0.8) {
        gameMessage.textContent = '완벽한 균형!';
    } else if (stability >= 0.5) {
        gameMessage.textContent = '균형 양호';
    } else {
        gameMessage.textContent = '균형 위험!';
    }

    // 속도 증가 (최대 제한)
    speed = Math.min(speed + SPEED_INCREMENT, MAX_SPEED);

    // 배경 진행도 업데이트 (점수에 따라)
    // 50점에서 완전히 우주 끝에 도달 (더 많은 스테이지)
    targetBackgroundProgress = Math.min(score / 50, 1);

    // 눈사람이 화면 중간 이상 쌓이면 아래로 밀기
    const baseSnowball = snowballs[0];
    const groundYOffset = backgroundProgress * 1200;
    const baseDrawY = canvas.height - GROUND_HEIGHT - SNOWBALL_SIZE + groundYOffset;

    // 방금 쌓인 눈덩이(마지막 눈덩이)의 화면상 Y 위치
    const lastSnowball = snowballs[snowballs.length - 1];
    const relativeY = lastSnowball.y - baseSnowball.y;
    const lastDrawY = baseDrawY + relativeY + scrollOffset;

    // 마지막 눈덩이가 화면 50% 위치보다 위로 올라가면 스크롤
    const targetScreenY = canvas.height * 0.5;

    if (lastDrawY < targetScreenY) {
        // 딱 화면 중간에 오도록 스크롤 오프셋 설정
        targetScrollOffset = scrollOffset + (targetScreenY - lastDrawY);
    }

    spawnNextSnowball();
}

function update() {
    if (!gameRunning || !currentSnowball) return;

    currentSnowball.x += speed * currentSnowball.direction;

    if (currentSnowball.x + currentSnowball.width > canvas.width) {
        currentSnowball.direction = -1;
    } else if (currentSnowball.x < 0) {
        currentSnowball.direction = 1;
    }

    // 스크롤을 부드럽게 목표값으로 전환
    const scrollSpeed = 0.08;
    scrollOffset += (targetScrollOffset - scrollOffset) * scrollSpeed;
}

function drawCurrentSnowball(groundOffset = 0) {
    if (!currentSnowball) return;
    drawSnowballShape(currentSnowball.x, currentSnowball.y - scrollOffset + groundOffset, currentSnowball.width);
}


function draw() {
    drawBackground();

    // 배경과 동일한 오프셋 (땅과 함께 내려감)
    const groundYOffset = backgroundProgress * 1200;

    // 베이스 눈덩이 기준 위치 (땅 위)
    const baseSnowball = snowballs[0];
    // groundYOffset: 배경 진행에 따라 내려감
    // scrollOffset: 눈사람이 화면 중간 넘으면 추가로 내려감
    const baseDrawY = canvas.height - GROUND_HEIGHT - SNOWBALL_SIZE + groundYOffset + scrollOffset;

    // 눈덩이들 그리기
    snowballs.forEach(ball => {
        // 베이스와의 상대적 Y 거리 유지
        const relativeY = ball.y - baseSnowball.y;
        const drawY = baseDrawY + relativeY;
        drawSnowballShape(ball.x, drawY, ball.width);
    });

    // 현재 이동 중인 눈덩이
    if (gameRunning && currentSnowball) {
        const relativeY = currentSnowball.y - baseSnowball.y;
        const drawY = baseDrawY + relativeY;
        drawSnowballShape(currentSnowball.x, drawY, currentSnowball.width);
    }
}

function animate() {
    update();
    draw();
    if (gameRunning) {
        requestAnimationFrame(animate);
    }
}

// ==================== 입력 처리 ====================
function handleInput(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (gameRunning) {
        placeSnowball();
    } else {
        initGame();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning) {
            placeSnowball();
        }
    }
});

// 터치 이벤트 (모바일)
canvas.addEventListener('touchstart', handleInput, { passive: false });

// 마우스 이벤트 (데스크톱)
canvas.addEventListener('mousedown', handleInput);

// 더블탭 줌 방지
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// ==================== UI 이벤트 ====================
restartBtn.addEventListener('click', initGame);
skipBtn.addEventListener('click', initGame);

saveScoreBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('닉네임을 입력해주세요!');
        return;
    }

    const scores = JSON.parse(localStorage.getItem('snowman_scores') || '[]');
    scores.push({
        username: username,
        score: score,
        created_at: new Date().toISOString()
    });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('snowman_scores', JSON.stringify(scores.slice(0, 10)));

    usernameInput.value = '';
    showLeaderboard();
});

function showLeaderboard() {
    gameOverModal.classList.add('hidden');
    leaderboard.classList.remove('hidden');

    const scores = JSON.parse(localStorage.getItem('snowman_scores') || '[]');
    leaderboardList.innerHTML = '';

    scores.slice(0, 10).forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank">${index + 1}위</span> <span>${entry.username}</span> <span>${entry.score}점</span>`;
        leaderboardList.appendChild(li);
    });
}

closeLeaderboardBtn.addEventListener('click', () => {
    leaderboard.classList.add('hidden');
    initGame();
});

// ==================== 시작 화면 ====================
function backgroundLoop() {
    if (!gameRunning) {
        drawBackground();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛄ 눈사람 쌓기 ⛄', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '22px Arial';
        ctx.fillText('클릭하여 시작하세요', canvas.width / 2, canvas.height / 2 + 10);

        requestAnimationFrame(backgroundLoop);
    }
}

// 초기 설정
highScoreElement.textContent = highScore;
initSnowflakes();
initStars();

backgroundLoop();
