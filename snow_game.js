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

// ==================== Supabase 설정 ====================
const SUPABASE_URL = 'https://hfjwrxudlwsckqemxzty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmandyeHVkbHdzY2txZW14enR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTA0MTQsImV4cCI6MjA4MDQ4NjQxNH0.1KsnS3r_xBjqZrlC71unWEGoNv45u--hgI8zMq8KrV0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 엔딩 모달 요소
const endingModal = document.getElementById('endingModal');
const endingFinalScore = document.getElementById('ending-final-score');
const endingUsernameInput = document.getElementById('ending-username');
const endingSaveScoreBtn = document.getElementById('ending-save-score-btn');
const endingRestartBtn = document.getElementById('endingRestartBtn');

// 엔딩 상수
const ENDING_SCORE = 500;

// ==================== 게임 상수 ====================
const SNOWBALL_SIZE = 70; // 더 큰 눈덩이
const INITIAL_WIDTH = 200; // 넓은 시작 크기
const GROUND_HEIGHT = 120;

// 속도는 점수 구간별로 계산 (getSpeedForScore 함수 사용)

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
let speed = 2.5;
let prevCanvasWidth = 0;
let prevCanvasHeight = 0;

// 점수 구간별 속도 계산
// 0-100: 2.5 → 3.0, 100-300: 3.0 → 3.5, 300-500: 3.5 → 4.0
function getSpeedForScore(s) {
    if (s <= 100) {
        return 2.5 + (s / 100) * 0.5;           // 2.5 → 3.0
    } else if (s <= 300) {
        return 3.0 + ((s - 100) / 200) * 0.5;   // 3.0 → 3.5
    } else {
        return 3.5 + ((s - 300) / 200) * 0.5;   // 3.5 → 4.0
    }
}

// ==================== 스테이지 이름 ====================
const STAGE_NAMES = [
    '🌙 겨울 밤', '⛅ 높은 하늘', '🌌 성층권', '🌠 우주 진입', '🌑 깊은 우주',
    '🌀 은하계', '✨ 은하 외곽', '🚀 태양계 밖', '🕳️ 블랙홀 지대', '💫 퀘이사 영역',
    '🕸️ 우주 거대구조', '🔥 빅뱅 잔광', '🌈 다중우주 경계', '🔮 옴니버스', '⚡ 초월 공간',
    '♾️ 무한의 끝', '💠 존재의 근원', '🌑 절대 무', '✴️ 창조의 빛', '🎭 의식의 바다',
    '⏳ 시간의 무덤', '🔷 차원의 틈', '🌀 혼돈의 소용돌이', '💎 결정화된 시공', '🎇 에테르 평원',
    '🌟 항성의 요람', '🔥 초신성 잔해', '❄️ 우주의 동결점', '⚫ 암흑 에너지 해', '🌊 중력파 폭풍',
    '💫 반물질 구역', '🔆 감마선 폭발', '🌌 초은하단', '🕳️ 화이트홀 출구', '⭐ 펄서 벨트',
    '🌑 마그네타 영역', '💠 양자 거품', '🔮 끈 이론 공간', '♾️ 무한 차원', '✨ 순수 에너지',
    '🌈 스펙트럼 너머', '🎆 초월의 문', '🌟 영원의 빛', '🔱 신들의 영역', '👁️ 전지의 눈',
    '🌸 열반의 정원', '⚜️ 황금 비율', '🎪 환상의 서커스', '🏛️ 무한 도서관', '🌺 에덴의 끝',
    '🔲 플라톤 동굴', '⚖️ 운명의 저울', '🎭 페르소나 극장', '📜 아카식 레코드', '🔔 존재의 종소리',
    '🌊 레테의 강', '⛰️ 올림푸스 정상', '🌙 셀레네의 꿈', '☀️ 헬리오스의 길', '🌌 아스트랄 평면',
    '∞ 알레프 널', '🔢 칸토어 집합', '📐 프랙탈 심연', '🌀 만델브로트', '⭕ 오일러 항등식',
    '📊 리만 가설', '🔺 파스칼 삼각형', '🎲 확률의 바다', '📈 지수적 폭발', '🔄 괴델 루프',
    '⚛️ 플랑크 스케일', '🌡️ 절대 영도', '💥 특이점 코어', '🔬 힉스 필드', '⚡ 진공 에너지',
    '🌑 사건의 지평선', '💫 호킹 복사', '🔭 관측 한계', '🌐 홀로그램 경계', '🎯 불확정성 원리',
    '🌌 열죽음', '💀 빅 립', '🔄 빅 바운스', '❄️ 빅 프리즈', '🌑 빅 크런치',
    '⏰ 시간 종말', '🕳️ 정보 역설', '🎭 볼츠만 뇌', '🔮 시뮬레이션 끝', '♾️ 영원 회귀',
    '🌟 최후의 별', '⚫ 최후의 블랙홀', '💨 최후의 입자', '🔊 최후의 진동', '💭 최후의 생각',
    '❤️ 최후의 감정', '🎵 최후의 화음', '🌸 최후의 아름다움', '✨ 최후의 희망', '🙏 최후의 기도',
    '👑 절대자의 왕좌'
];

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

// ==================== 확장 스테이지 배경 효과 (14-41) ====================

// 14. 옴니버스 - 모든 다중우주를 포함하는 거대한 구체들
function drawOmniverse(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    // 거대한 빛나는 구체들
    const spheres = [
        { x: 0.2, y: 0.3, r: 120, color: '#8B5CF6' },
        { x: 0.8, y: 0.5, r: 100, color: '#06B6D4' },
        { x: 0.5, y: 0.7, r: 80, color: '#F59E0B' }
    ];

    for (const s of spheres) {
        const x = canvas.width * s.x;
        const y = canvas.height * s.y;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, s.r);
        gradient.addColorStop(0, s.color + '60');
        gradient.addColorStop(0.5, s.color + '30');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.restore();
}

// 15. 초월 공간 - 빛나는 기하학적 패턴
function drawTranscendence(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.6;

    const time = Date.now() / 3000;
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.5)';
    ctx.lineWidth = 1;

    // 회전하는 기하학적 패턴
    for (let i = 0; i < 6; i++) {
        const angle = time + (i * Math.PI / 3);
        const x = canvas.width / 2 + Math.cos(angle) * 100;
        const y = canvas.height / 2 + Math.sin(angle) * 100;

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// 16. 무한의 끝 - 어둠 속 희미한 빛줄기
function drawInfinityEdge(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;

    // 희미한 빛줄기들
    for (let i = 0; i < 5; i++) {
        const x = canvas.width * (0.1 + i * 0.2);
        const gradient = ctx.createLinearGradient(x, 0, x, canvas.height);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - 2, 0, 4, canvas.height);
    }

    ctx.restore();
}

// 17. 존재의 근원 - 중앙에서 퍼지는 동심원
function drawOrigin(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const time = Date.now() / 2000;

    for (let i = 0; i < 5; i++) {
        const r = 50 + i * 60 + (time % 1) * 60;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 200, 200, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();
}

// 18. 절대 무 - 거의 아무것도 없음, 미세한 입자만
function drawAbsoluteVoid(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;

    // 아주 희미한 입자들
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.fill();
    }

    ctx.restore();
}

// 19. 창조의 빛 - 황금빛 광선
function drawCreationLight(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.3;

    // 중앙에서 퍼지는 황금빛
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    gradient.addColorStop(0, 'rgba(255, 215, 100, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.3)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 빛줄기
    ctx.strokeStyle = 'rgba(255, 220, 100, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 400, cy + Math.sin(angle) * 400);
        ctx.stroke();
    }

    ctx.restore();
}

// 20. 의식의 바다 - 파동치는 파란색 물결
function drawConsciousnessSea(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    const time = Date.now() / 1000;

    for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < canvas.width; x += 10) {
            const wave = Math.sin(x * 0.02 + time + y * 0.01) * 10;
            ctx.lineTo(x, y + wave);
        }
        ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 - y / canvas.height * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.restore();
}

// 21. 시간의 무덤 - 떠다니는 시계/모래시계 형상
function drawTimeTomb(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    // 모래시계 형태들
    const hourglasses = [
        { x: 0.2, y: 0.4 }, { x: 0.5, y: 0.3 }, { x: 0.8, y: 0.6 }
    ];

    ctx.strokeStyle = 'rgba(180, 150, 100, 0.6)';
    ctx.lineWidth = 2;

    for (const h of hourglasses) {
        const x = canvas.width * h.x;
        const y = canvas.height * h.y;

        ctx.beginPath();
        ctx.moveTo(x - 15, y - 25);
        ctx.lineTo(x + 15, y - 25);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 15, y + 25);
        ctx.lineTo(x - 15, y + 25);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}

// 22. 차원의 틈 - 공간이 찢어진 듯한 균열
function drawDimensionRift(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    // 균열들
    const rifts = [
        { x1: 0.3, y1: 0.2, x2: 0.35, y2: 0.7 },
        { x1: 0.7, y1: 0.1, x2: 0.65, y2: 0.6 }
    ];

    for (const r of rifts) {
        const gradient = ctx.createLinearGradient(
            canvas.width * r.x1, canvas.height * r.y1,
            canvas.width * r.x2, canvas.height * r.y2
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(150, 50, 255, 0.6)');
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(canvas.width * r.x1, canvas.height * r.y1);
        ctx.bezierCurveTo(
            canvas.width * (r.x1 + 0.1), canvas.height * (r.y1 + 0.2),
            canvas.width * (r.x2 - 0.1), canvas.height * (r.y2 - 0.2),
            canvas.width * r.x2, canvas.height * r.y2
        );
        ctx.stroke();
    }

    ctx.restore();
}

// 23. 혼돈의 소용돌이 - 붉은 회오리
function drawChaosVortex(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.6;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const time = Date.now() / 2000;

    ctx.strokeStyle = 'rgba(200, 50, 50, 0.5)';
    ctx.lineWidth = 3;

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
            const r = 20 + angle * 25;
            const x = cx + Math.cos(angle + time + i) * r;
            const y = cy + Math.sin(angle + time + i) * r;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.restore();
}

// 24. 결정화된 시공 - 육각형 결정 패턴
function drawCrystalizedSpacetime(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;

    ctx.strokeStyle = 'rgba(150, 220, 220, 0.5)';
    ctx.lineWidth = 1;

    const size = 40;
    for (let x = 0; x < canvas.width + size; x += size * 1.5) {
        for (let y = 0; y < canvas.height + size; y += size * 1.7) {
            const offsetX = (Math.floor(y / (size * 1.7)) % 2) * size * 0.75;
            drawHexagon(x + offsetX, y, size / 2);
        }
    }

    function drawHexagon(cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}

// 25. 에테르 평원 - 부드럽게 흐르는 안개
function drawEtherPlain(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;

    const time = Date.now() / 5000;

    for (let i = 0; i < 5; i++) {
        const y = canvas.height * (0.2 + i * 0.15);
        const offset = Math.sin(time + i) * 50;

        const gradient = ctx.createLinearGradient(0, y - 30, 0, y + 30);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(180, 200, 220, 0.3)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(offset, y - 30, canvas.width, 60);
    }

    ctx.restore();
}

// 26. 항성의 요람 - 오렌지빛 가스 구름
function drawStellarNursery(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    const clouds = [
        { x: 0.2, y: 0.3, r: 100 },
        { x: 0.6, y: 0.5, r: 120 },
        { x: 0.8, y: 0.2, r: 80 }
    ];

    for (const c of clouds) {
        const x = canvas.width * c.x;
        const y = canvas.height * c.y;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, c.r);
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
        gradient.addColorStop(0.6, 'rgba(255, 100, 30, 0.2)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - c.r, y - c.r, c.r * 2, c.r * 2);
    }

    ctx.restore();
}

// 27. 초신성 잔해 - 폭발하는 붉은 파편
function drawSupernovaRemnant(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const time = Date.now() / 1000;

    // 폭발 파편
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 50 + Math.sin(time * 2 + i) * 30 + 100;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${100 + i * 5}, 50, 0.6)`;
        ctx.fill();
    }

    // 중심 광원
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    gradient.addColorStop(0, 'rgba(255, 200, 150, 0.5)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - 60, cy - 60, 120, 120);

    ctx.restore();
}

// 28. 우주의 동결점 - 얼음 결정
function drawCosmicFreeze(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
    ctx.lineWidth = 1;

    // 눈송이/얼음 결정 패턴
    const crystals = [
        { x: 0.2, y: 0.3 }, { x: 0.5, y: 0.5 }, { x: 0.8, y: 0.4 },
        { x: 0.3, y: 0.7 }, { x: 0.7, y: 0.2 }
    ];

    for (const c of crystals) {
        const x = canvas.width * c.x;
        const y = canvas.height * c.y;

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);
            ctx.stroke();

            // 가지
            const midX = x + Math.cos(angle) * 15;
            const midY = y + Math.sin(angle) * 15;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX + Math.cos(angle + 0.5) * 10, midY + Math.sin(angle + 0.5) * 10);
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX + Math.cos(angle - 0.5) * 10, midY + Math.sin(angle - 0.5) * 10);
            ctx.stroke();
        }
    }

    ctx.restore();
}

// 29. 암흑 에너지 해 - 어두운 파동
function drawDarkEnergySea(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;

    const time = Date.now() / 2000;

    for (let i = 0; i < 8; i++) {
        const y = canvas.height * (0.1 + i * 0.1);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < canvas.width; x += 5) {
            const wave = Math.sin(x * 0.01 + time + i * 0.5) * 20;
            ctx.lineTo(x, y + wave);
        }
        ctx.strokeStyle = `rgba(30, 30, 50, ${0.5 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    ctx.restore();
}

// 30. 중력파 폭풍 - 동심원 파동
function drawGravityWaveStorm(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;

    const time = Date.now() / 1000;
    const sources = [
        { x: 0.3, y: 0.4 }, { x: 0.7, y: 0.6 }
    ];

    for (const s of sources) {
        const cx = canvas.width * s.x;
        const cy = canvas.height * s.y;

        for (let i = 0; i < 5; i++) {
            const r = ((time * 50 + i * 40) % 200);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(150, 150, 200, ${0.5 - r / 400})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    ctx.restore();
}

// ==================== 확장 배경 효과 함수들 (스테이지 42-101) ====================

// 배경용 우주 먼지 (사이드 오브젝트와 구분)
function drawCosmicDustBg(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 2000;
    for (let i = 0; i < 30; i++) {
        const x = (canvas.width * 0.1 + i * 30 + Math.sin(time + i) * 20) % canvas.width;
        const y = (canvas.height * 0.2 + i * 25 + Math.cos(time + i) * 15) % canvas.height;
        ctx.fillStyle = `rgba(200, 200, 220, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 배경용 혼돈 소용돌이 (사이드 오브젝트와 구분)
function drawChaosVortexBg(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 800;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, 50 + i * 30, time + i * 0.3, time + i * 0.3 + Math.PI * 1.5);
        ctx.strokeStyle = `hsla(${(time * 60 + i * 40) % 360}, 60%, 50%, ${0.4 - i * 0.05})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

// 양자 영역 (Quantum Realm)
function drawQuantumRealm(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 400;
    for (let i = 0; i < 20; i++) {
        const x = canvas.width * (0.2 + 0.6 * Math.random());
        const y = canvas.height * (0.2 + 0.6 * Math.random());
        const phase = (time + i * 0.5) % (Math.PI * 2);
        ctx.fillStyle = `rgba(150, 100, 255, ${0.3 + Math.sin(phase) * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.sin(phase) * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 현실 경계 (Reality Border)
function drawRealityBorder(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
        const y = canvas.height * (0.3 + i * 0.2);
        const wave = Math.sin(time + i) * 20;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.bezierCurveTo(canvas.width * 0.3, y - wave, canvas.width * 0.7, y + wave, canvas.width, y - wave);
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 - i * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

// 가능성의 바다 (Sea of Possibilities)
function drawPossibilitySea(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    const time = Date.now() / 1500;
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.4);
    gradient.addColorStop(0, `rgba(100, 150, 255, ${0.3 + Math.sin(time) * 0.1})`);
    gradient.addColorStop(0.5, `rgba(150, 100, 200, ${0.2 + Math.sin(time + 1) * 0.1})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// 영혼의 통로 (Soul Passage)
function drawSoulPassage(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 800;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 0.2;
        const r = 100 + Math.sin(time + i) * 30;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.strokeStyle = `rgba(200, 180, 255, ${0.4 - i * 0.04})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
}

// 신성의 문 (Divine Gate)
function drawDivineGate(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.6;
    const time = Date.now() / 1200;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.4;
    const glow = 0.5 + Math.sin(time) * 0.2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    gradient.addColorStop(0, `rgba(255, 223, 186, ${glow})`);
    gradient.addColorStop(0.5, `rgba(255, 200, 150, ${glow * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 우주적 각성 (Cosmic Awakening)
function drawCosmicAwakening(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 600;
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = canvas.width / 2 + Math.cos(angle + time * 0.3) * 150;
        const y = canvas.height / 2 + Math.sin(angle + time * 0.3) * 100;
        ctx.fillStyle = `hsla(${(i * 30 + time * 20) % 360}, 70%, 60%, 0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 초월적 인식 (Transcendent Mind)
function drawTranscendentMind(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 1000;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    // 눈 모양
    ctx.beginPath();
    ctx.ellipse(cx, cy, 60, 30, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 150, 255, ${0.5 + Math.sin(time) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 동공
    ctx.beginPath();
    ctx.arc(cx + Math.sin(time) * 10, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 50, 200, ${0.6 + Math.sin(time) * 0.2})`;
    ctx.fill();
    ctx.restore();
}

// 완전한 조화 (Perfect Harmony)
function drawPerfectHarmony(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1500;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time * 0.1;
        const x = cx + Math.cos(angle) * 80;
        const y = cy + Math.sin(angle) * 80;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${150 + i * 15}, ${200 - i * 10}, ${100 + i * 20}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

// 무한의 춤 (Infinite Dance)
function drawInfiniteDance(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 500;
    for (let i = 0; i < 10; i++) {
        const t = time + i * 0.3;
        const x = canvas.width / 2 + Math.cos(t) * (50 + i * 10);
        const y = canvas.height / 2 + Math.sin(t * 2) * (30 + i * 5);
        ctx.fillStyle = `hsla(${(t * 30) % 360}, 60%, 60%, 0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 영원의 불꽃 (Eternal Flame)
function drawEternalFlame(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 200;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.6;
    for (let i = 0; i < 8; i++) {
        const flicker = Math.sin(time + i * 2) * 5;
        const h = 50 + i * 10 + flicker;
        const gradient = ctx.createLinearGradient(cx, cy, cx, cy - h);
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx - 15 + i * 2, cy);
        ctx.quadraticCurveTo(cx + flicker, cy - h * 0.7, cx, cy - h);
        ctx.quadraticCurveTo(cx - flicker, cy - h * 0.7, cx + 15 - i * 2, cy);
        ctx.fill();
    }
    ctx.restore();
}

// 심연의 노래 (Song of the Abyss)
function drawAbyssSong(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 800;
    for (let i = 0; i < 5; i++) {
        const y = canvas.height * (0.3 + i * 0.1);
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 10) {
            const wave = Math.sin(x * 0.02 + time + i) * 15;
            if (x === 0) ctx.moveTo(x, y + wave);
            else ctx.lineTo(x, y + wave);
        }
        ctx.strokeStyle = `rgba(100, 50, 150, ${0.5 - i * 0.08})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

// 우주의 숨결 (Cosmic Breath)
function drawCosmicBreath(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    const time = Date.now() / 2000;
    const scale = 1 + Math.sin(time) * 0.2;
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.3 * scale);
    gradient.addColorStop(0, 'rgba(100, 150, 200, 0.4)');
    gradient.addColorStop(0.7, 'rgba(50, 100, 150, 0.2)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// 빛의 바다 (Ocean of Light)
function drawLightOcean(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1000;
    for (let i = 0; i < 20; i++) {
        const x = (time * 30 + i * 50) % (canvas.width + 100) - 50;
        const y = canvas.height * (0.3 + (i % 5) * 0.1) + Math.sin(time + i) * 10;
        ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 어둠의 왕좌 (Throne of Darkness)
function drawDarknessThrone(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.5;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(30, 0, 50, 0.5)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 최초의 기억 (First Memory)
function drawFirstMemory(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1500;
    for (let i = 0; i < 8; i++) {
        const x = canvas.width * (0.2 + (i % 4) * 0.2);
        const y = canvas.height * (0.3 + Math.floor(i / 4) * 0.3);
        const pulse = 0.5 + Math.sin(time + i) * 0.3;
        ctx.fillStyle = `rgba(255, 220, 180, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 마지막 속삭임 (Last Whisper)
function drawLastWhisper(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    const time = Date.now() / 2000;
    for (let i = 0; i < 15; i++) {
        const x = canvas.width * (0.1 + Math.random() * 0.8);
        const y = canvas.height * (0.1 + Math.random() * 0.8);
        const size = 1 + Math.sin(time + i) * 0.5;
        ctx.fillStyle = 'rgba(200, 200, 220, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 세계의 심장 (Heart of the World)
function drawWorldHeart(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 500;
    const beat = 1 + Math.sin(time * 3) * 0.15;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(beat, beat);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    gradient.addColorStop(0, 'rgba(255, 100, 150, 0.7)');
    gradient.addColorStop(0.5, 'rgba(200, 50, 100, 0.4)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.bezierCurveTo(-40, -30, -40, -50, 0, -25);
    ctx.bezierCurveTo(40, -50, 40, -30, 0, 15);
    ctx.fill();
    ctx.restore();
    ctx.restore();
}

// 운명의 실 (Thread of Fate)
function drawFateThread(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1000;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.3);
    for (let x = 0; x <= canvas.width; x += 20) {
        const y = canvas.height * 0.5 + Math.sin(x * 0.01 + time) * 50 + Math.cos(x * 0.02 + time * 0.5) * 30;
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// 절대자의 꿈 (Dream of the Absolute)
function drawAbsoluteDream(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1500;
    for (let i = 0; i < 5; i++) {
        const cx = canvas.width * (0.2 + i * 0.15);
        const cy = canvas.height * 0.5 + Math.sin(time + i) * 30;
        const r = 30 + Math.sin(time * 0.5 + i) * 10;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, `rgba(${150 + i * 20}, ${100 + i * 15}, ${200 - i * 10}, 0.5)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 천상의 정원 (Celestial Garden)
function drawCelestialGarden(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 1200;
    for (let i = 0; i < 12; i++) {
        const x = canvas.width * (0.1 + (i % 4) * 0.25);
        const y = canvas.height * (0.2 + Math.floor(i / 4) * 0.25);
        const bloom = 0.5 + Math.sin(time + i * 0.5) * 0.3;
        ctx.fillStyle = `hsla(${(i * 30) % 360}, 60%, 70%, ${bloom})`;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
            const angle = (p / 5) * Math.PI * 2;
            const px = x + Math.cos(angle) * 10;
            const py = y + Math.sin(angle) * 10;
            ctx.arc(px, py, 5, 0, Math.PI * 2);
        }
        ctx.fill();
    }
    ctx.restore();
}

// 신들의 안식처 (Rest of the Gods)
function drawGodsRest(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 2000;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `rgba(255, 223, 186, ${0.3 + Math.sin(time) * 0.1})`);
    gradient.addColorStop(0.5, `rgba(255, 200, 150, ${0.2 + Math.sin(time + 1) * 0.1})`);
    gradient.addColorStop(1, `rgba(200, 150, 255, ${0.3 + Math.sin(time + 2) * 0.1})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// 영원한 황혼 (Eternal Twilight)
function drawEternalTwilight(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(100, 50, 150, 0.4)');
    gradient.addColorStop(0.5, 'rgba(200, 100, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(50, 50, 100, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// 창세의 불꽃 (Flame of Genesis)
function drawGenesisFlame(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 300;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time * 0.1;
        const x = cx + Math.cos(angle) * 60;
        const y = cy + Math.sin(angle) * 60;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// 종말의 서곡 (Prelude to the Apocalypse)
function drawApocalypsePrelude(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    const time = Date.now() / 500;
    for (let i = 0; i < 8; i++) {
        const x = canvas.width * (0.1 + Math.random() * 0.8);
        const y = -50 + (time * 100 + i * 100) % (canvas.height + 100);
        ctx.strokeStyle = `rgba(255, ${100 + i * 15}, 50, ${0.5 - i * 0.05})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 20 - 10, y + 50);
        ctx.stroke();
    }
    ctx.restore();
}

// 궁극의 영역 (Ultimate Realm)
function drawUltimateRealm(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    const time = Date.now() / 1000;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 3; i++) {
        const r = 80 + i * 40 + Math.sin(time + i) * 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${200 - i * 30}, ${150 + i * 20}, 255, ${0.5 - i * 0.1})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
}

// 절대자의 왕좌 (Throne of the Absolute)
function drawAbsoluteThrone(opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.6;
    const time = Date.now() / 800;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.4;
    // 왕관
    ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time) * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy);
    ctx.lineTo(cx - 30, cy - 30);
    ctx.lineTo(cx - 15, cy - 10);
    ctx.lineTo(cx, cy - 40);
    ctx.lineTo(cx + 15, cy - 10);
    ctx.lineTo(cx + 30, cy - 30);
    ctx.lineTo(cx + 40, cy);
    ctx.closePath();
    ctx.fill();
    // 광채
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    gradient.addColorStop(0, `rgba(255, 255, 200, ${0.4 + Math.sin(time * 2) * 0.2})`);
    gradient.addColorStop(0.5, `rgba(255, 200, 100, ${0.2 + Math.sin(time * 2) * 0.1})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ==================== 양옆 오브젝트 그리기 ====================
function drawSideObjects(progress, groundYOffset) {
    ctx.save();

    const baseY = groundYOffset;
    const p = progress;

    // 1. 겨울 밤 ~ 높은 하늘 (0 ~ 0.04): 나무, 집
    if (p < 0.05) {
        const opacity = 1 - smoothStep(0.03, 0.05, p);
        ctx.globalAlpha = opacity;
        drawTree(-30, canvas.height - 200 + baseY, 1);
        drawTree(40, canvas.height - 180 + baseY, 0.8);
        drawHouse(canvas.width - 100, canvas.height - 160 + baseY, 0.7);
        drawTree(canvas.width - 50, canvas.height - 190 + baseY, 0.9);
    }

    // 2. 성층권 (0.04 ~ 0.08): 구름, 비행기
    if (p > 0.03 && p < 0.09) {
        const opacity = smoothStep(0.03, 0.04, p) * (1 - smoothStep(0.07, 0.09, p));
        ctx.globalAlpha = opacity;
        drawCloud(50, 100 + baseY, 60);
        drawCloud(canvas.width - 120, 150 + baseY, 50);
        drawAirplane(canvas.width - 150, 180 + baseY);
    }

    // 3. 우주 진입 (0.08 ~ 0.12): 위성, 우주선
    if (p > 0.07 && p < 0.13) {
        const opacity = smoothStep(0.07, 0.08, p) * (1 - smoothStep(0.11, 0.13, p));
        ctx.globalAlpha = opacity;
        drawSatellite(80, 150 + baseY);
        drawSatellite(canvas.width - 100, 300 + baseY);
        drawSpaceStation(canvas.width - 180, 120 + baseY);
    }

    // 4. 은하계 (0.12 ~ 0.18): 행성들
    if (p > 0.11 && p < 0.19) {
        const opacity = smoothStep(0.11, 0.12, p) * (1 - smoothStep(0.17, 0.19, p));
        ctx.globalAlpha = opacity;
        drawPlanet(60, 180 + baseY, 35, '#e74c3c', true);
        drawPlanet(canvas.width - 80, 130 + baseY, 50, '#f39c12', false);
    }

    // 5. 블랙홀/퀘이사 (0.18 ~ 0.24): 소행성, 잔해
    if (p > 0.17 && p < 0.25) {
        const opacity = smoothStep(0.17, 0.18, p) * (1 - smoothStep(0.23, 0.25, p));
        ctx.globalAlpha = opacity;
        for (let i = 0; i < 5; i++) {
            const x = (i % 2 === 0) ? 20 + i * 20 : canvas.width - 40 - i * 15;
            drawAsteroid(x, 100 + i * 70 + baseY, 10 + i * 3);
        }
    }

    // 6. 다중우주 (0.24 ~ 0.30): 에너지 파동, 시공간 균열
    if (p > 0.23 && p < 0.31) {
        const opacity = smoothStep(0.23, 0.24, p) * (1 - smoothStep(0.29, 0.31, p));
        ctx.globalAlpha = opacity;
        drawEnergyWave(40, 180 + baseY);
        drawSpacetimeRift(canvas.width - 50, 250 + baseY);
    }

    // 7. 옴니버스/초월 (0.30 ~ 0.36): 빛나는 구체들
    if (p > 0.29 && p < 0.37) {
        const opacity = smoothStep(0.29, 0.30, p) * (1 - smoothStep(0.35, 0.37, p));
        ctx.globalAlpha = opacity;
        drawGlowingOrb(50, 150 + baseY, 25, '#8B5CF6');
        drawGlowingOrb(canvas.width - 60, 280 + baseY, 30, '#06B6D4');
    }

    // 8. 무한/존재 (0.36 ~ 0.42): 희미한 빛줄기
    if (p > 0.35 && p < 0.43) {
        const opacity = smoothStep(0.35, 0.36, p) * (1 - smoothStep(0.41, 0.43, p));
        ctx.globalAlpha = opacity;
        drawLightBeam(30, baseY);
        drawLightBeam(canvas.width - 40, baseY);
    }

    // 9. 창조/의식 (0.42 ~ 0.48): 황금빛 입자
    if (p > 0.41 && p < 0.49) {
        const opacity = smoothStep(0.41, 0.42, p) * (1 - smoothStep(0.47, 0.49, p));
        ctx.globalAlpha = opacity;
        drawGoldenParticles(baseY);
    }

    // 10. 시간/차원 (0.48 ~ 0.54): 모래시계, 균열
    if (p > 0.47 && p < 0.55) {
        const opacity = smoothStep(0.47, 0.48, p) * (1 - smoothStep(0.53, 0.55, p));
        ctx.globalAlpha = opacity;
        drawFloatingHourglass(60, 200 + baseY);
        drawFloatingHourglass(canvas.width - 80, 350 + baseY);
    }

    // 11. 혼돈/결정 (0.54 ~ 0.60): 기하학적 패턴
    if (p > 0.53 && p < 0.61) {
        const opacity = smoothStep(0.53, 0.54, p) * (1 - smoothStep(0.59, 0.61, p));
        ctx.globalAlpha = opacity;
        drawGeometricPattern(40, 150 + baseY);
        drawGeometricPattern(canvas.width - 60, 300 + baseY);
    }

    // 12. 에테르/항성 (0.60 ~ 0.66): 가스 구름
    if (p > 0.59 && p < 0.67) {
        const opacity = smoothStep(0.59, 0.60, p) * (1 - smoothStep(0.65, 0.67, p));
        ctx.globalAlpha = opacity;
        drawGasCloud(50, 180 + baseY, '#FF9500');
        drawGasCloud(canvas.width - 70, 320 + baseY, '#00D4FF');
    }

    // 13. 동결/암흑 (0.66 ~ 0.72): 얼음 결정
    if (p > 0.65 && p < 0.73) {
        const opacity = smoothStep(0.65, 0.66, p) * (1 - smoothStep(0.71, 0.73, p));
        ctx.globalAlpha = opacity;
        drawIceCrystal(45, 200 + baseY);
        drawIceCrystal(canvas.width - 55, 280 + baseY);
    }

    // 14. 양자 입자 (0.72 ~ 0.78)
    if (p > 0.71 && p < 0.79) {
        const opacity = smoothStep(0.71, 0.72, p) * (1 - smoothStep(0.77, 0.79, p));
        ctx.globalAlpha = opacity;
        drawQuantumParticles(50, 150 + baseY, 'rgba(150, 100, 255, 0.7)');
        drawQuantumParticles(canvas.width - 50, 300 + baseY, 'rgba(100, 200, 255, 0.7)');
    }

    // 15. 차원 포탈 (0.78 ~ 0.84)
    if (p > 0.77 && p < 0.85) {
        const opacity = smoothStep(0.77, 0.78, p) * (1 - smoothStep(0.83, 0.85, p));
        ctx.globalAlpha = opacity;
        drawDimensionPortal(40, 200 + baseY, 30);
        drawDimensionPortal(canvas.width - 40, 350 + baseY, 25);
    }

    // 16. 별의 잔해 (0.84 ~ 0.90)
    if (p > 0.83 && p < 0.91) {
        const opacity = smoothStep(0.83, 0.84, p) * (1 - smoothStep(0.89, 0.91, p));
        ctx.globalAlpha = opacity;
        drawStellarDebris(60, 180 + baseY);
        drawStellarDebris(canvas.width - 60, 280 + baseY);
    }

    // 17. 신성 광선 (0.90 ~ 0.96)
    if (p > 0.89 && p < 0.97) {
        const opacity = smoothStep(0.89, 0.90, p) * (1 - smoothStep(0.95, 0.97, p));
        ctx.globalAlpha = opacity;
        drawDivineRay(25, baseY);
        drawDivineRay(canvas.width - 25, baseY);
    }

    // 18. 우주 먼지 (0.96 ~ 1.0)
    if (p > 0.95 && p <= 1.0) {
        const opacity = smoothStep(0.95, 0.96, p);
        ctx.globalAlpha = opacity;
        drawCosmicDust(baseY);
    }

    // 19. 에너지 고리 (0.66 ~ 0.70)
    if (p > 0.65 && p < 0.71) {
        const opacity = smoothStep(0.65, 0.66, p) * (1 - smoothStep(0.69, 0.71, p));
        ctx.globalAlpha = opacity;
        drawEnergyRing(55, 200 + baseY, 'rgba(255, 150, 50, 0.6)');
        drawEnergyRing(canvas.width - 55, 320 + baseY, 'rgba(50, 200, 255, 0.6)');
    }

    // 20. 시공간 왜곡 (0.70 ~ 0.74)
    if (p > 0.69 && p < 0.75) {
        const opacity = smoothStep(0.69, 0.70, p) * (1 - smoothStep(0.73, 0.75, p));
        ctx.globalAlpha = opacity;
        drawSpacetimeWarp(45, 180 + baseY);
        drawSpacetimeWarp(canvas.width - 45, 350 + baseY);
    }

    // 21. 초월의 눈 (0.74 ~ 0.78)
    if (p > 0.73 && p < 0.79) {
        const opacity = smoothStep(0.73, 0.74, p) * (1 - smoothStep(0.77, 0.79, p));
        ctx.globalAlpha = opacity;
        drawEyeOfTranscendence(50, 220 + baseY);
        drawEyeOfTranscendence(canvas.width - 50, 380 + baseY);
    }

    // 22. 빛나는 룬 (0.78 ~ 0.82)
    if (p > 0.77 && p < 0.83) {
        const opacity = smoothStep(0.77, 0.78, p) * (1 - smoothStep(0.81, 0.83, p));
        ctx.globalAlpha = opacity;
        drawGlowingRune(40, 200 + baseY, 'rgba(200, 180, 100, 0.7)');
        drawGlowingRune(canvas.width - 40, 340 + baseY, 'rgba(100, 180, 200, 0.7)');
    }

    // 23. 원시 불꽃 (0.82 ~ 0.86)
    if (p > 0.81 && p < 0.87) {
        const opacity = smoothStep(0.81, 0.82, p) * (1 - smoothStep(0.85, 0.87, p));
        ctx.globalAlpha = opacity;
        drawPrimordialFlame(30, canvas.height - 100 + baseY);
        drawPrimordialFlame(canvas.width - 30, canvas.height - 100 + baseY);
    }

    // 24. 절대자의 왕좌 (0.98 ~ 1.0): 최종 조합
    if (p > 0.98) {
        const opacity = smoothStep(0.98, 0.99, p);
        ctx.globalAlpha = opacity * 0.6;
        drawChainsOfEternity(20, baseY);
        drawChainsOfEternity(canvas.width - 20, baseY);
        drawInfinitySpiral(canvas.width / 2 - 80, 150 + baseY);
        drawInfinitySpiral(canvas.width / 2 + 80, 150 + baseY);
        drawCrownOfKings(canvas.width / 2, 80 + baseY);
    }

    ctx.restore();
}

// 추가 사이드 오브젝트 함수들
function drawGlowingOrb(x, y, r, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color + 'AA');
    gradient.addColorStop(0.5, color + '44');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawLightBeam(x, baseY) {
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY + canvas.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 3, baseY, 6, canvas.height);
}

function drawGoldenParticles(baseY) {
    const time = Date.now() / 1000;
    for (let i = 0; i < 10; i++) {
        const x = 20 + (i % 2) * (canvas.width - 60) + Math.sin(time + i) * 10;
        const y = 100 + i * 50 + baseY;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 100, 0.7)';
        ctx.fill();
    }
}

function drawFloatingHourglass(x, y) {
    ctx.strokeStyle = 'rgba(180, 150, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 20);
    ctx.lineTo(x + 12, y - 20);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 12, y + 20);
    ctx.lineTo(x - 12, y + 20);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
}

function drawGeometricPattern(x, y) {
    ctx.strokeStyle = 'rgba(150, 200, 220, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y, 15 + i * 10, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawGasCloud(x, y, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 40, y - 40, 80, 80);
}

function drawIceCrystal(x, y) {
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
        ctx.stroke();
    }
}

function drawFinalAscension(baseY) {
    const time = Date.now() / 2000;
    // 양쪽에서 중앙으로 수렴하는 빛
    for (let i = 0; i < 5; i++) {
        const y = 100 + i * 80 + baseY;
        const offset = Math.sin(time + i) * 20;

        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(canvas.width / 2, y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canvas.width, y - offset);
        ctx.lineTo(canvas.width / 2, y);
        ctx.stroke();
    }
}

// ==================== 확장 사이드 오브젝트 함수들 (스테이지 42-101) ====================

// 양자 입자 (Quantum Particles)
function drawQuantumParticles(x, y, color) {
    const time = Date.now() / 500;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const radius = 20 + Math.sin(time * 2 + i) * 10;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

// 차원 포탈 (Dimension Portal)
function drawDimensionPortal(x, y, size) {
    const time = Date.now() / 1000;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x, y, size - i * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${(time * 50 + i * 30) % 360}, 80%, 60%, ${0.6 - i * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 별의 잔해 (Stellar Debris)
function drawStellarDebris(x, y) {
    const time = Date.now() / 800;
    for (let i = 0; i < 6; i++) {
        const angle = time + i * 1.05;
        const dist = 15 + i * 5;
        const dx = x + Math.cos(angle) * dist;
        const dy = y + Math.sin(angle) * dist;
        ctx.fillStyle = `rgba(255, ${200 + i * 10}, ${100 + i * 20}, 0.7)`;
        ctx.beginPath();
        ctx.arc(dx, dy, 2 + i * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 신성 광선 (Divine Ray)
function drawDivineRay(x, baseY) {
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY + canvas.height);
    gradient.addColorStop(0, 'rgba(255, 223, 186, 0.5)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 150, 0.3)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - 15, baseY);
    ctx.lineTo(x + 15, baseY);
    ctx.lineTo(x + 5, baseY + canvas.height);
    ctx.lineTo(x - 5, baseY + canvas.height);
    ctx.fill();
}

// 우주 먼지 (Cosmic Dust)
function drawCosmicDust(baseY) {
    const time = Date.now() / 1200;
    for (let i = 0; i < 15; i++) {
        const side = i % 2 === 0;
        const x = side ? 10 + (i * 7) : canvas.width - 10 - (i * 7);
        const y = 80 + i * 40 + Math.sin(time + i) * 15 + baseY;
        ctx.fillStyle = `rgba(180, 180, 220, ${0.4 + Math.sin(time + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 에너지 고리 (Energy Ring)
function drawEnergyRing(x, y, color) {
    const time = Date.now() / 600;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// 시공간 왜곡 (Spacetime Warp)
function drawSpacetimeWarp(x, y) {
    const time = Date.now() / 700;
    for (let i = 0; i < 5; i++) {
        const warp = Math.sin(time + i * 0.5) * 5;
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 - i * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 20 + warp, y - 30 + i * 15);
        ctx.quadraticCurveTo(x + warp, y - 20 + i * 15, x + 20 - warp, y - 30 + i * 15);
        ctx.stroke();
    }
}

// 초월의 눈 (Eye of Transcendence)
function drawEyeOfTranscendence(x, y) {
    const time = Date.now() / 1000;
    // 외곽
    ctx.beginPath();
    ctx.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 동공
    ctx.beginPath();
    ctx.arc(x + Math.sin(time) * 5, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 50, 200, 0.8)';
    ctx.fill();
}

// 빛나는 룬 (Glowing Rune)
function drawGlowingRune(x, y, color) {
    const time = Date.now() / 800;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    // 삼각형 룬
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, 10);
    ctx.lineTo(-13, 10);
    ctx.closePath();
    ctx.stroke();
    // 내부 원
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// 원시 불꽃 (Primordial Flame)
function drawPrimordialFlame(x, y) {
    const time = Date.now() / 200;
    for (let i = 0; i < 5; i++) {
        const flicker = Math.sin(time + i * 2) * 3;
        const h = 20 + i * 5 + flicker;
        const gradient = ctx.createLinearGradient(x, y, x, y - h);
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.5)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - 8 + i * 2, y);
        ctx.quadraticCurveTo(x + flicker, y - h * 0.7, x, y - h);
        ctx.quadraticCurveTo(x - flicker, y - h * 0.7, x + 8 - i * 2, y);
        ctx.fill();
    }
}

// 영원의 사슬 (Chains of Eternity)
function drawChainsOfEternity(x, baseY) {
    const time = Date.now() / 500;
    ctx.strokeStyle = 'rgba(180, 160, 140, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const y = 80 + i * 60 + baseY;
        const wobble = Math.sin(time + i) * 5;
        ctx.beginPath();
        ctx.ellipse(x + wobble, y, 8, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 무한 나선 (Infinity Spiral)
function drawInfinitySpiral(x, y) {
    const time = Date.now() / 600;
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 4; t += 0.1) {
        const r = 5 + t * 2;
        const px = x + Math.cos(t + time) * r;
        const py = y + Math.sin(t + time) * r * 0.5;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
}

// 절대 영점 (Absolute Zero)
function drawAbsoluteZero(x, y) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.4)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    // 결정
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
        ctx.stroke();
    }
}

// 왕의 왕관 (Crown of Kings)
function drawCrownOfKings(x, y) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 15, y - 15);
    ctx.lineTo(x - 8, y - 5);
    ctx.lineTo(x, y - 20);
    ctx.lineTo(x + 8, y - 5);
    ctx.lineTo(x + 15, y - 15);
    ctx.lineTo(x + 20, y);
    ctx.closePath();
    ctx.fill();
    // 보석
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y - 12, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 심연의 촉수 (Abyss Tentacle)
function drawAbyssTentacle(x, baseY) {
    const time = Date.now() / 400;
    ctx.strokeStyle = 'rgba(80, 40, 120, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, baseY + canvas.height);
    for (let i = 0; i < 8; i++) {
        const y = baseY + canvas.height - i * 50;
        const wobble = Math.sin(time + i * 0.5) * (15 + i * 2);
        ctx.quadraticCurveTo(x + wobble, y + 25, x + wobble * 0.5, y);
    }
    ctx.stroke();
}

// 빛의 파편 (Light Shard)
function drawLightShard(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, -20, 0, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0.3)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// 혼돈의 소용돌이 (Chaos Vortex)
function drawChaosVortex(x, y) {
    const time = Date.now() / 300;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x, y, 10 + i * 8, time + i * 0.5, time + i * 0.5 + Math.PI);
        ctx.strokeStyle = `hsla(${(time * 100 + i * 50) % 360}, 70%, 50%, ${0.6 - i * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 성스러운 십자가 (Holy Cross)
function drawHolyCross(x, y) {
    const time = Date.now() / 1000;
    const glow = 0.5 + Math.sin(time * 2) * 0.2;
    ctx.fillStyle = `rgba(255, 223, 186, ${glow})`;
    ctx.fillRect(x - 3, y - 20, 6, 40);
    ctx.fillRect(x - 12, y - 8, 24, 6);
}

// 우주의 심장 (Heart of Universe)
function drawHeartOfUniverse(x, y) {
    const time = Date.now() / 500;
    const beat = 1 + Math.sin(time * 3) * 0.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(beat, beat);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    gradient.addColorStop(0, 'rgba(255, 100, 150, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 50, 100, 0.5)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-15, -10, -15, -20, 0, -10);
    ctx.bezierCurveTo(15, -20, 15, -10, 0, 5);
    ctx.fill();
    ctx.restore();
}

// 시간의 모래 (Sands of Time)
function drawSandsOfTime(x, baseY) {
    const time = Date.now() / 100;
    for (let i = 0; i < 20; i++) {
        const y = (baseY + (time + i * 30) % canvas.height);
        const wobble = Math.sin(time / 500 + i) * 3;
        ctx.fillStyle = `rgba(255, 220, 180, ${0.3 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + wobble, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
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

    // 하늘 색상 보간 - 41개 스테이지에 맞춘 색상 변화
    const skyColors = [
        // 1-10: 지구 → 우주 진입
        { pos: 0.00, top: '#1a1a2e', mid: '#16213e', bot: '#0f3460' },  // 1. 겨울 밤
        { pos: 0.01, top: '#0f0f23', mid: '#1a1a3e', bot: '#2d132c' },  // 2. 높은 하늘
        { pos: 0.02, top: '#0d0d1a', mid: '#1f0f30', bot: '#3d1a4a' },  // 3. 성층권
        { pos: 0.03, top: '#050510', mid: '#0a0a20', bot: '#15102a' },  // 4. 우주 진입
        { pos: 0.04, top: '#020208', mid: '#0a0520', bot: '#150a30' },  // 5. 깊은 우주
        { pos: 0.05, top: '#030010', mid: '#100028', bot: '#1a0040' },  // 6. 은하계
        { pos: 0.06, top: '#050008', mid: '#0f0018', bot: '#180028' },  // 7. 은하 외곽
        { pos: 0.07, top: '#000005', mid: '#050010', bot: '#0a001a' },  // 8. 태양계 밖
        { pos: 0.08, top: '#02000a', mid: '#08001a', bot: '#100025' },  // 9. 블랙홀 지대
        { pos: 0.09, top: '#000008', mid: '#050015', bot: '#0a0020' },  // 10. 퀘이사 영역
        // 11-20: 우주 심연
        { pos: 0.10, top: '#030005', mid: '#080010', bot: '#0d0018' },  // 11. 우주 거대구조
        { pos: 0.11, top: '#020003', mid: '#050008', bot: '#080010' },  // 12. 빅뱅 잔광
        { pos: 0.12, top: '#010002', mid: '#030005', bot: '#050008' },  // 13. 다중우주 경계
        { pos: 0.13, top: '#080015', mid: '#100030', bot: '#1a0050' },  // 14. 옴니버스
        { pos: 0.14, top: '#100820', mid: '#201040', bot: '#301860' },  // 15. 초월 공간
        { pos: 0.15, top: '#000000', mid: '#000000', bot: '#000005' },  // 16. 무한의 끝
        { pos: 0.16, top: '#0a0a0a', mid: '#151515', bot: '#202020' },  // 17. 존재의 근원
        { pos: 0.17, top: '#000000', mid: '#000000', bot: '#000000' },  // 18. 절대 무
        { pos: 0.18, top: '#201510', mid: '#302015', bot: '#40301a' },  // 19. 창조의 빛
        { pos: 0.19, top: '#0a1020', mid: '#152040', bot: '#203060' },  // 20. 의식의 바다
        // 21-30: 시공간 초월
        { pos: 0.20, top: '#15100a', mid: '#251a0f', bot: '#352515' },  // 21. 시간의 무덤
        { pos: 0.21, top: '#100520', mid: '#200a40', bot: '#300f60' },  // 22. 차원의 틈
        { pos: 0.22, top: '#150008', mid: '#2a0010', bot: '#400018' },  // 23. 혼돈의 소용돌이
        { pos: 0.23, top: '#0a1015', mid: '#152025', bot: '#203035' },  // 24. 결정화된 시공
        { pos: 0.24, top: '#101520', mid: '#182030', bot: '#202b40' },  // 25. 에테르 평원
        { pos: 0.25, top: '#181008', mid: '#281810', bot: '#382018' },  // 26. 항성의 요람
        { pos: 0.26, top: '#200808', mid: '#301010', bot: '#401818' },  // 27. 초신성 잔해
        { pos: 0.27, top: '#081520', mid: '#102030', bot: '#182b40' },  // 28. 우주의 동결점
        { pos: 0.28, top: '#05050a', mid: '#0a0a15', bot: '#0f0f20' },  // 29. 암흑 에너지 해
        { pos: 0.29, top: '#0a0810', mid: '#151020', bot: '#201830' },  // 30. 중력파 폭풍
        // 31-40: 극한 영역
        { pos: 0.30, top: '#100a15', mid: '#201428', bot: '#301e3b' },  // 31. 반물질 구역
        { pos: 0.31, top: '#181510', mid: '#282218', bot: '#382f20' },  // 32. 감마선 폭발
        { pos: 0.32, top: '#080510', mid: '#100a20', bot: '#180f30' },  // 33. 초은하단
        { pos: 0.33, top: '#101010', mid: '#181818', bot: '#202020' },  // 34. 화이트홀 출구
        { pos: 0.34, top: '#0a1010', mid: '#152020', bot: '#203030' },  // 35. 펄서 벨트
        { pos: 0.35, top: '#100808', mid: '#201010', bot: '#301818' },  // 36. 마그네타 영역
        { pos: 0.36, top: '#080a10', mid: '#101520', bot: '#182030' },  // 37. 양자 거품
        { pos: 0.37, top: '#0f0a15', mid: '#1e1428', bot: '#2d1e3b' },  // 38. 끈 이론 공간
        { pos: 0.38, top: '#050505', mid: '#0a0a0a', bot: '#0f0f0f' },  // 39. 무한 차원
        { pos: 0.39, top: '#151515', mid: '#252525', bot: '#353535' },  // 40. 순수 에너지
        // 41-50: 스펙트럼 너머
        { pos: 0.40, top: '#101018', mid: '#181828', bot: '#202038' },  // 41. 스펙트럼 너머
        { pos: 0.41, top: '#0a0515', mid: '#140a25', bot: '#1e0f35' },  // 42. 양자 영역
        { pos: 0.42, top: '#120810', mid: '#221018', bot: '#321820' },  // 43. 현실 경계
        { pos: 0.43, top: '#080a18', mid: '#101428', bot: '#181e38' },  // 44. 가능성의 바다
        { pos: 0.44, top: '#100810', mid: '#201018', bot: '#301820' },  // 45. 영혼의 통로
        { pos: 0.45, top: '#181210', mid: '#281a18', bot: '#382220' },  // 46. 신성의 문
        { pos: 0.46, top: '#0a0a12', mid: '#141420', bot: '#1e1e2e' },  // 47. 우주적 각성
        { pos: 0.47, top: '#100a08', mid: '#201410', bot: '#301e18' },  // 48. 초월적 인식
        { pos: 0.48, top: '#080a0a', mid: '#101414', bot: '#181e1e' },  // 49. 완전한 조화
        { pos: 0.49, top: '#0f0810', mid: '#1e1020', bot: '#2d1830' },  // 50. 무한의 춤
        // 51-60: 영원의 영역
        { pos: 0.50, top: '#180a08', mid: '#281410', bot: '#381e18' },  // 51. 영원의 불꽃
        { pos: 0.51, top: '#050812', mid: '#0a1022', bot: '#0f1832' },  // 52. 심연의 노래
        { pos: 0.52, top: '#0a0810', mid: '#141020', bot: '#1e1830' },  // 53. 우주의 숨결
        { pos: 0.53, top: '#120808', mid: '#221010', bot: '#321818' },  // 54. 빛의 바다
        { pos: 0.54, top: '#08080f', mid: '#10101e', bot: '#18182d' },  // 55. 어둠의 왕좌
        { pos: 0.55, top: '#100a10', mid: '#201420', bot: '#301e30' },  // 56. 최초의 기억
        { pos: 0.56, top: '#0a0a08', mid: '#141410', bot: '#1e1e18' },  // 57. 마지막 속삭임
        { pos: 0.57, top: '#0f0a12', mid: '#1e1422', bot: '#2d1e32' },  // 58. 세계의 심장
        { pos: 0.58, top: '#080a10', mid: '#101420', bot: '#181e30' },  // 59. 운명의 실
        { pos: 0.59, top: '#100808', mid: '#201010', bot: '#301818' },  // 60. 절대자의 꿈
        // 61-70: 신성 영역
        { pos: 0.60, top: '#0a0810', mid: '#141020', bot: '#1e1830' },  // 61. 천상의 정원
        { pos: 0.61, top: '#18100a', mid: '#281814', bot: '#38201e' },  // 62. 신들의 안식처
        { pos: 0.62, top: '#08080a', mid: '#101014', bot: '#18181e' },  // 63. 영원한 황혼
        { pos: 0.63, top: '#0f0810', mid: '#1e1020', bot: '#2d1830' },  // 64. 창세의 불꽃
        { pos: 0.64, top: '#0a0a10', mid: '#141420', bot: '#1e1e30' },  // 65. 종말의 서곡
        { pos: 0.65, top: '#100a08', mid: '#201410', bot: '#301e18' },  // 66. 우주의 심판
        { pos: 0.66, top: '#080810', mid: '#101020', bot: '#181830' },  // 67. 존재의 노래
        { pos: 0.67, top: '#120a0a', mid: '#221414', bot: '#321e1e' },  // 68. 무의 춤
        { pos: 0.68, top: '#0a080f', mid: '#14101e', bot: '#1e182d' },  // 69. 영원의 포옹
        { pos: 0.69, top: '#0f0a08', mid: '#1e1410', bot: '#2d1e18' },  // 70. 신성한 침묵
        // 71-80: 궁극의 경지
        { pos: 0.70, top: '#080a12', mid: '#101422', bot: '#181e32' },  // 71. 빛과 어둠의 경계
        { pos: 0.71, top: '#100808', mid: '#201010', bot: '#301818' },  // 72. 시간의 끝
        { pos: 0.72, top: '#0a0810', mid: '#141020', bot: '#1e1830' },  // 73. 공간의 시작
        { pos: 0.73, top: '#08100a', mid: '#102014', bot: '#18301e' },  // 74. 무한 루프
        { pos: 0.74, top: '#0f080a', mid: '#1e1014', bot: '#2d181e' },  // 75. 완전한 무
        { pos: 0.75, top: '#0a0a0a', mid: '#141414', bot: '#1e1e1e' },  // 76. 순수한 존재
        { pos: 0.76, top: '#100a10', mid: '#201420', bot: '#301e30' },  // 77. 우주의 꿈
        { pos: 0.77, top: '#080a08', mid: '#101410', bot: '#181e18' },  // 78. 현실의 끝
        { pos: 0.78, top: '#0a080a', mid: '#141014', bot: '#1e181e' },  // 79. 환상의 시작
        { pos: 0.79, top: '#0f0a0f', mid: '#1e141e', bot: '#2d1e2d' },  // 80. 모든 것의 하나
        // 81-90: 최고 영역
        { pos: 0.80, top: '#080808', mid: '#101010', bot: '#181818' },  // 81. 절대적 평화
        { pos: 0.81, top: '#0a0a10', mid: '#141420', bot: '#1e1e30' },  // 82. 영원의 문
        { pos: 0.82, top: '#100808', mid: '#201010', bot: '#301818' },  // 83. 무한의 열쇠
        { pos: 0.83, top: '#08100a', mid: '#102014', bot: '#18301e' },  // 84. 진리의 빛
        { pos: 0.84, top: '#0a080f', mid: '#14101e', bot: '#1e182d' },  // 85. 우주의 비밀
        { pos: 0.85, top: '#0f0808', mid: '#1e1010', bot: '#2d1818' },  // 86. 최후의 여정
        { pos: 0.86, top: '#080a0a', mid: '#101414', bot: '#181e1e' },  // 87. 영원한 귀환
        { pos: 0.87, top: '#0a0810', mid: '#141020', bot: '#1e1830' },  // 88. 궁극의 진화
        { pos: 0.88, top: '#100a08', mid: '#201410', bot: '#301e18' },  // 89. 완전한 깨달음
        { pos: 0.89, top: '#08080f', mid: '#10101e', bot: '#18182d' },  // 90. 모든 것의 끝
        // 91-101: 절대자의 영역
        { pos: 0.90, top: '#0f0a0a', mid: '#1e1414', bot: '#2d1e1e' },  // 91. 새로운 시작
        { pos: 0.91, top: '#0a0a08', mid: '#141410', bot: '#1e1e18' },  // 92. 원초의 힘
        { pos: 0.92, top: '#080a10', mid: '#101420', bot: '#181e30' },  // 93. 신의 눈물
        { pos: 0.93, top: '#0a0808', mid: '#141010', bot: '#1e1818' },  // 94. 우주의 심장
        { pos: 0.94, top: '#0f0a10', mid: '#1e1420', bot: '#2d1e30' },  // 95. 영원의 맹세
        { pos: 0.95, top: '#08080a', mid: '#101014', bot: '#18181e' },  // 96. 절대자의 눈
        { pos: 0.96, top: '#0a100a', mid: '#142014', bot: '#1e301e' },  // 97. 시간의 군주
        { pos: 0.97, top: '#100a0a', mid: '#201414', bot: '#301e1e' },  // 98. 공간의 지배자
        { pos: 0.98, top: '#0a0810', mid: '#141020', bot: '#1e1830' },  // 99. 존재의 왕
        { pos: 0.99, top: '#0f0f0f', mid: '#1e1e1e', bot: '#2d2d2d' },  // 100. 절대자의 꿈
        { pos: 1.00, top: '#151520', mid: '#252535', bot: '#35354a' },  // 101. 절대자의 왕좌
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

    // 각 요소들 (진행도에 따라 opacity 조절) - 101개 스테이지

    // 초반 요소들 (1-10 스테이지: 0 ~ 0.10)
    drawStars(smoothStep(0.01, 0.05, p));                                       // 별: 일찍 등장
    drawMoon(1 - smoothStep(0.02, 0.06, p), 1 - p * 10);                        // 달: 점점 작아지며 사라짐

    // 우주 요소들 (6-13 스테이지: 0.05 ~ 0.13)
    drawGalaxy(smoothStep(0.05, 0.07, p) * (1 - smoothStep(0.10, 0.14, p)));    // 은하
    drawNebula(smoothStep(0.06, 0.08, p) * (1 - smoothStep(0.11, 0.15, p)));    // 성운
    drawDistantGalaxies(smoothStep(0.07, 0.09, p) * (1 - smoothStep(0.12, 0.16, p))); // 먼 은하들
    drawCosmicDustBg(smoothStep(0.08, 0.10, p) * (1 - smoothStep(0.14, 0.18, p))); // 우주 먼지
    drawBlackHole(smoothStep(0.09, 0.11, p) * (1 - smoothStep(0.15, 0.19, p)));  // 블랙홀
    drawQuasar(smoothStep(0.10, 0.12, p) * (1 - smoothStep(0.16, 0.20, p)));     // 퀘이사
    drawCosmicWeb(smoothStep(0.11, 0.13, p) * (1 - smoothStep(0.17, 0.21, p)));  // 우주 거대구조
    drawCMB(smoothStep(0.12, 0.14, p) * (1 - smoothStep(0.18, 0.22, p)));        // 빅뱅 잔광
    drawMultiverse(smoothStep(0.13, 0.15, p) * (1 - smoothStep(0.19, 0.23, p))); // 다중우주

    // 확장 스테이지 요소들 (14-40 스테이지: 0.13 ~ 0.40)
    drawOmniverse(smoothStep(0.14, 0.16, p) * (1 - smoothStep(0.20, 0.24, p)));       // 옴니버스
    drawTranscendence(smoothStep(0.15, 0.17, p) * (1 - smoothStep(0.21, 0.25, p)));   // 초월 공간
    drawInfinityEdge(smoothStep(0.16, 0.18, p) * (1 - smoothStep(0.22, 0.26, p)));    // 무한의 끝
    drawOrigin(smoothStep(0.17, 0.19, p) * (1 - smoothStep(0.23, 0.27, p)));          // 존재의 근원
    drawAbsoluteVoid(smoothStep(0.18, 0.20, p) * (1 - smoothStep(0.24, 0.28, p)));    // 절대 무
    drawCreationLight(smoothStep(0.19, 0.21, p) * (1 - smoothStep(0.25, 0.29, p)));   // 창조의 빛
    drawConsciousnessSea(smoothStep(0.20, 0.22, p) * (1 - smoothStep(0.26, 0.30, p)));// 의식의 바다
    drawTimeTomb(smoothStep(0.22, 0.24, p) * (1 - smoothStep(0.28, 0.32, p)));        // 시간의 무덤
    drawDimensionRift(smoothStep(0.24, 0.26, p) * (1 - smoothStep(0.30, 0.34, p)));   // 차원의 틈
    drawChaosVortexBg(smoothStep(0.26, 0.28, p) * (1 - smoothStep(0.32, 0.36, p)));   // 혼돈의 소용돌이
    drawCrystalizedSpacetime(smoothStep(0.28, 0.30, p) * (1 - smoothStep(0.34, 0.38, p))); // 결정화된 시공
    drawEtherPlain(smoothStep(0.30, 0.32, p) * (1 - smoothStep(0.36, 0.40, p)));      // 에테르 평원
    drawStellarNursery(smoothStep(0.32, 0.34, p) * (1 - smoothStep(0.38, 0.42, p)));  // 항성의 요람
    drawSupernovaRemnant(smoothStep(0.34, 0.36, p) * (1 - smoothStep(0.40, 0.44, p))); // 초신성 잔해
    drawCosmicFreeze(smoothStep(0.36, 0.38, p) * (1 - smoothStep(0.42, 0.46, p)));    // 우주의 동결점
    drawDarkEnergySea(smoothStep(0.38, 0.40, p) * (1 - smoothStep(0.44, 0.48, p)));   // 암흑 에너지 해
    drawGravityWaveStorm(smoothStep(0.40, 0.42, p) * (1 - smoothStep(0.46, 0.50, p)));// 중력파 폭풍

    // 스펙트럼 너머 요소들 (41-60 스테이지: 0.40 ~ 0.60)
    drawQuantumRealm(smoothStep(0.42, 0.44, p) * (1 - smoothStep(0.48, 0.52, p)));    // 양자 영역
    drawRealityBorder(smoothStep(0.44, 0.46, p) * (1 - smoothStep(0.50, 0.54, p)));   // 현실 경계
    drawPossibilitySea(smoothStep(0.46, 0.48, p) * (1 - smoothStep(0.52, 0.56, p)));  // 가능성의 바다
    drawSoulPassage(smoothStep(0.48, 0.50, p) * (1 - smoothStep(0.54, 0.58, p)));     // 영혼의 통로
    drawDivineGate(smoothStep(0.50, 0.52, p) * (1 - smoothStep(0.56, 0.60, p)));      // 신성의 문
    drawCosmicAwakening(smoothStep(0.52, 0.54, p) * (1 - smoothStep(0.58, 0.62, p))); // 우주적 각성
    drawTranscendentMind(smoothStep(0.54, 0.56, p) * (1 - smoothStep(0.60, 0.64, p)));// 초월적 인식
    drawPerfectHarmony(smoothStep(0.56, 0.58, p) * (1 - smoothStep(0.62, 0.66, p)));  // 완전한 조화
    drawInfiniteDance(smoothStep(0.58, 0.60, p) * (1 - smoothStep(0.64, 0.68, p)));   // 무한의 춤

    // 영원의 영역 요소들 (61-80 스테이지: 0.60 ~ 0.80)
    drawEternalFlame(smoothStep(0.60, 0.62, p) * (1 - smoothStep(0.66, 0.70, p)));    // 영원의 불꽃
    drawAbyssSong(smoothStep(0.62, 0.64, p) * (1 - smoothStep(0.68, 0.72, p)));       // 심연의 노래
    drawCosmicBreath(smoothStep(0.64, 0.66, p) * (1 - smoothStep(0.70, 0.74, p)));    // 우주의 숨결
    drawLightOcean(smoothStep(0.66, 0.68, p) * (1 - smoothStep(0.72, 0.76, p)));      // 빛의 바다
    drawDarknessThrone(smoothStep(0.68, 0.70, p) * (1 - smoothStep(0.74, 0.78, p)));  // 어둠의 왕좌
    drawFirstMemory(smoothStep(0.70, 0.72, p) * (1 - smoothStep(0.76, 0.80, p)));     // 최초의 기억
    drawLastWhisper(smoothStep(0.72, 0.74, p) * (1 - smoothStep(0.78, 0.82, p)));     // 마지막 속삭임
    drawWorldHeart(smoothStep(0.74, 0.76, p) * (1 - smoothStep(0.80, 0.84, p)));      // 세계의 심장
    drawFateThread(smoothStep(0.76, 0.78, p) * (1 - smoothStep(0.82, 0.86, p)));      // 운명의 실
    drawAbsoluteDream(smoothStep(0.78, 0.80, p) * (1 - smoothStep(0.84, 0.88, p)));   // 절대자의 꿈

    // 최종 영역 요소들 (81-101 스테이지: 0.80 ~ 1.0)
    drawCelestialGarden(smoothStep(0.80, 0.82, p) * (1 - smoothStep(0.86, 0.90, p))); // 천상의 정원
    drawGodsRest(smoothStep(0.82, 0.84, p) * (1 - smoothStep(0.88, 0.92, p)));        // 신들의 안식처
    drawEternalTwilight(smoothStep(0.84, 0.86, p) * (1 - smoothStep(0.90, 0.94, p))); // 영원한 황혼
    drawGenesisFlame(smoothStep(0.86, 0.88, p) * (1 - smoothStep(0.92, 0.96, p)));    // 창세의 불꽃
    drawApocalypsePrelude(smoothStep(0.88, 0.90, p) * (1 - smoothStep(0.94, 0.98, p)));// 종말의 서곡
    drawUltimateRealm(smoothStep(0.92, 0.94, p));                                      // 궁극의 영역
    drawAbsoluteThrone(smoothStep(0.96, 1.0, p));                                      // 절대자의 왕좌

    // 눈송이 (지상에서만)
    const snowOpacity = 1 - smoothStep(0.04, 0.12, p);
    if (snowOpacity > 0) {
        updateSnowflakes();
        drawSnowflakes(snowOpacity);
    }

    // 땅과 산 (아래로 스크롤) - 더 빨리 사라지도록
    // 5점(스테이지 1개)마다 120픽셀씩 내려감 (500점에서 12000픽셀)
    const groundYOffset = p * 12000;
    drawGround(1 - smoothStep(0.06, 0.16, p), groundYOffset);

    // 양옆 오브젝트 (땅과 함께 내려감)
    drawSideObjects(p, groundYOffset);

    // 현재 스테이지 이름 표시 (화면 하단)
    const stageIndex = Math.min(Math.floor(score / 5), STAGE_NAMES.length - 1);
    const stageName = STAGE_NAMES[stageIndex];

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
    speed = getSpeedForScore(0);
    scrollOffset = 0;
    targetScrollOffset = 0;
    backgroundProgress = 0;
    targetBackgroundProgress = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameRunning = true;
    gameOverModal.classList.add('hidden');
    endingModal.classList.add('hidden');
    leaderboard.classList.add('hidden');
    stopEndingCelebration();
    gameMessage.textContent = '클릭 또는 스페이스바로 눈을 떨어뜨리세요!';

    // 랭킹 버튼 숨기기
    if (rankingBtn) rankingBtn.style.display = 'none';

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
        highScoreElement.textContent = highScore;
    }

    // 랭킹 버튼 다시 표시
    if (rankingBtn) rankingBtn.style.display = 'inline-block';

    gameOverModal.classList.remove('hidden');
}

// 엔딩 도달
function showEnding() {
    gameRunning = false;
    endingFinalScore.textContent = score;

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }

    // 랭킹 버튼 다시 표시
    if (rankingBtn) rankingBtn.style.display = 'inline-block';

    // 엔딩 모달 표시
    endingModal.classList.remove('hidden');

    // 축하 효과 시작
    startEndingCelebration();
}

// 엔딩 축하 효과
let endingParticles = [];
let endingAnimationId = null;

function startEndingCelebration() {
    endingParticles = [];
    // 초기 파티클 생성
    for (let i = 0; i < 50; i++) {
        endingParticles.push(createEndingParticle());
    }
    animateEndingParticles();
}

function createEndingParticle() {
    return {
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 8 - 4,
        size: Math.random() * 6 + 2,
        color: `hsl(${Math.random() * 60 + 40}, 100%, 60%)`, // 금색 ~ 노란색
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
}

function animateEndingParticles() {
    // 파티클 업데이트 및 그리기
    ctx.save();
    for (let i = endingParticles.length - 1; i >= 0; i--) {
        const p = endingParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // 중력
        p.alpha -= 0.005;
        p.rotation += p.rotationSpeed;

        if (p.alpha <= 0) {
            endingParticles.splice(i, 1);
            // 새 파티클 추가 (모달이 열려있는 동안)
            if (!endingModal.classList.contains('hidden')) {
                endingParticles.push(createEndingParticle());
            }
            continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // 별 모양 그리기
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
            const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * p.size;
            const y = Math.sin(angle) * p.size;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * (p.size * 0.4);
            const innerY = Math.sin(innerAngle) * (p.size * 0.4);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    // 모달이 열려있으면 계속 애니메이션
    if (!endingModal.classList.contains('hidden')) {
        endingAnimationId = requestAnimationFrame(animateEndingParticles);
    }
}

function stopEndingCelebration() {
    if (endingAnimationId) {
        cancelAnimationFrame(endingAnimationId);
        endingAnimationId = null;
    }
    endingParticles = [];
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

    // 엔딩 체크 - 500점 도달 시
    if (score >= ENDING_SCORE) {
        gameMessage.textContent = '🎊 절대자의 왕좌에 도달! 🎊';
        showEnding();
        return;
    }

    // 현재 스테이지 이름 표시
    const stageIndex = Math.min(Math.floor(score / 5), STAGE_NAMES.length - 1);
    gameMessage.textContent = STAGE_NAMES[stageIndex];

    // 점수 구간별 속도 적용
    speed = getSpeedForScore(score);

    // 배경 진행도: 500점에서 모든 배경 완료 (101개 스테이지 * 5점)
    targetBackgroundProgress = Math.min(score / 500, 1);

    // 눈사람이 화면 중간 이상 쌓이면 아래로 밀기
    const baseSnowball = snowballs[0];
    const groundYOffset = backgroundProgress * 12000;
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
    const groundYOffset = backgroundProgress * 12000;

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

    saveScoreBtn.disabled = true;
    saveScoreBtn.textContent = '저장 중...';

    try {
        const { error } = await supabase
            .from('rankings')
            .insert({
                username: username,
                score: score,
                is_ending: false
            });

        if (error) throw error;

        usernameInput.value = '';
        showLeaderboard();
    } catch (err) {
        console.error('점수 저장 실패:', err);
        alert('점수 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
        saveScoreBtn.disabled = false;
        saveScoreBtn.textContent = '점수 등록';
    }
});

async function showLeaderboard() {
    gameOverModal.classList.add('hidden');
    endingModal.classList.add('hidden');
    leaderboard.classList.remove('hidden');
    leaderboardList.innerHTML = '<li>로딩 중...</li>';

    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('username, score, is_ending')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        leaderboardList.innerHTML = '';
        if (data.length === 0) {
            leaderboardList.innerHTML = '<li>아직 기록이 없습니다</li>';
            return;
        }

        data.forEach((entry, index) => {
            const li = document.createElement('li');
            const crown = entry.is_ending ? ' 👑' : '';
            li.innerHTML = `<span class="rank">${index + 1}위</span> <span>${entry.username}${crown}</span> <span>${entry.score}점</span>`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        console.error('랭킹 로드 실패:', err);
        leaderboardList.innerHTML = '<li>랭킹을 불러올 수 없습니다</li>';
    }
}

closeLeaderboardBtn.addEventListener('click', () => {
    leaderboard.classList.add('hidden');
    initGame();
});

// ==================== 랭킹 조회 버튼 ====================
const rankingBtn = document.getElementById('ranking-btn');
if (rankingBtn) {
    rankingBtn.addEventListener('click', () => {
        showLeaderboard();
    });
}

// ==================== 엔딩 모달 이벤트 ====================
endingRestartBtn.addEventListener('click', () => {
    endingModal.classList.add('hidden');
    stopEndingCelebration();
    initGame();
});

endingSaveScoreBtn.addEventListener('click', async () => {
    const username = endingUsernameInput.value.trim();
    if (!username) {
        alert('닉네임을 입력해주세요!');
        return;
    }

    endingSaveScoreBtn.disabled = true;
    endingSaveScoreBtn.textContent = '저장 중...';

    try {
        const { error } = await supabase
            .from('rankings')
            .insert({
                username: username,
                score: score,
                is_ending: true
            });

        if (error) throw error;

        endingUsernameInput.value = '';
        endingModal.classList.add('hidden');
        stopEndingCelebration();
        showLeaderboard();
    } catch (err) {
        console.error('점수 저장 실패:', err);
        alert('점수 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
        endingSaveScoreBtn.disabled = false;
        endingSaveScoreBtn.textContent = '전설로 등록';
    }
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
initSnowflakes();
initStars();

// Supabase에서 최고 점수 로드
async function loadHighScore() {
    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('score')
            .order('score', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            highScore = data[0].score;
            highScoreElement.textContent = highScore;
        }
    } catch (err) {
        console.error('최고 점수 로드 실패:', err);
        // localStorage fallback
        highScoreElement.textContent = highScore;
    }
}

loadHighScore();
backgroundLoop();
