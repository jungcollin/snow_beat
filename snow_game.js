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
let speed = INITIAL_SPEED;

// ==================== 캔버스 리사이즈 ====================
function resizeCanvas() {
    // 모바일에서 실제 뷰포트 크기 사용
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
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

    // 하늘 색상 보간
    const skyColors = [
        { pos: 0.0, top: '#0f0c29', mid: '#302b63', bot: '#24243e' },  // 겨울 밤
        { pos: 0.2, top: '#1a0533', mid: '#2d1b4e', bot: '#0f0c29' },  // 성층권
        { pos: 0.4, top: '#050510', mid: '#0a0a1a', bot: '#000000' },  // 우주
        { pos: 0.7, top: '#0a0015', mid: '#1a0030', bot: '#050010' },  // 은하계
        { pos: 1.0, top: '#000005', mid: '#050015', bot: '#0a0020' }   // 태양계 밖
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

    // 각 요소들 (진행도에 따라 opacity 조절)
    drawNebula(smoothStep(0.7, 1.0, p));
    drawStars(smoothStep(0.15, 0.4, p));
    drawDistantGalaxies(smoothStep(0.8, 1.0, p));
    drawGalaxy(smoothStep(0.5, 0.8, p) * (1 - smoothStep(0.9, 1.0, p)));
    // 지구 제거됨
    drawMoon(1 - smoothStep(0.3, 0.5, p), 1 - p * 0.5);

    // 눈송이 (지상에서만)
    const snowOpacity = 1 - smoothStep(0.1, 0.3, p);
    if (snowOpacity > 0) {
        updateSnowflakes();
        drawSnowflakes(snowOpacity);
    }

    // 땅과 산 (아래로 스크롤)
    const groundYOffset = p * 800; // 위로 올라갈수록 땅이 아래로 내려감
    drawGround(1 - smoothStep(0.15, 0.35, p), groundYOffset);

    // 현재 위치 표시
    const stageNames = ['🌙 겨울 밤', '🌌 성층권', '🌍 우주', '🌀 은하계', '🚀 태양계 밖'];
    let stageName = stageNames[0];
    if (p >= 0.8) stageName = stageNames[4];
    else if (p >= 0.5) stageName = stageNames[3];
    else if (p >= 0.3) stageName = stageNames[2];
    else if (p >= 0.1) stageName = stageNames[1];

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

    // 이전 눈덩이의 실제 반지름
    const prevRadius = Math.min(prevSnowball.width, SNOWBALL_SIZE) / 2;
    // 새 눈덩이의 실제 반지름
    const newRadius = Math.min(overlapWidth, SNOWBALL_SIZE) / 2;

    // 새 눈덩이의 Y 위치 = 이전 눈덩이 상단 - 새 눈덩이 높이
    // 이전 눈덩이 상단 = prevSnowball.y (drawSnowballShape에서 y + radius가 중심이므로, y가 상단)
    const newY = prevSnowball.y - (newRadius * 2);

    // 성공
    const newSnowball = new Snowball(
        overlapStart,
        newY,
        overlapWidth
    );

    snowballs.push(newSnowball);
    score++;
    scoreElement.textContent = score;

    // 속도 증가 (최대 제한)
    speed = Math.min(speed + SPEED_INCREMENT, MAX_SPEED);

    // 배경 진행도 업데이트 (점수에 따라)
    // 100점에서 완전히 우주 끝에 도달
    targetBackgroundProgress = Math.min(score / 40, 1);

    // 스크롤
    const stackTop = currentSnowball.y;
    const viewThreshold = canvas.height * 0.35;
    if (stackTop - scrollOffset < viewThreshold) {
        scrollOffset = stackTop - viewThreshold;
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
}

function drawCurrentSnowball(groundOffset = 0) {
    if (!currentSnowball) return;
    drawSnowballShape(currentSnowball.x, currentSnowball.y - scrollOffset + groundOffset, currentSnowball.width);
}


function draw() {
    drawBackground();

    // 땅과 함께 이동하는 오프셋 계산
    // 땅이 사라지는 지점(0.35)까지만 이동, 그 이후에는 고정
    const maxGroundOffset = 0.35 * 800; // 땅이 완전히 사라지는 시점의 오프셋
    const groundYOffset = Math.min(backgroundProgress * 800, maxGroundOffset);

    snowballs.forEach(ball => ball.draw(groundYOffset));
    if (gameRunning) {
        drawCurrentSnowball(groundYOffset);
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
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning) {
            placeSnowball();
        }
    }
});

canvas.addEventListener('mousedown', () => {
    if (gameRunning) {
        placeSnowball();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        placeSnowball();
    }
}, { passive: false });

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

canvas.addEventListener('click', function () {
    if (!gameRunning) {
        initGame();
    }
});

canvas.addEventListener('touchstart', function (e) {
    if (!gameRunning) {
        e.preventDefault();
        initGame();
    }
}, { passive: false });

backgroundLoop();
