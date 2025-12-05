/**
 * Snow Game Logic Module
 * 테스트 가능한 순수 게임 로직 함수들
 */

// ==================== 게임 상수 ====================
const SNOWBALL_SIZE = 70;
const INITIAL_WIDTH = 200;
const INITIAL_SPEED = 2.5;
const SPEED_INCREMENT = 0.02;
const MAX_SPEED = 4;
const GROUND_HEIGHT = 120;
const BACKGROUND_TRANSITION_SPEED = 0.005;

// ==================== 눈덩이 클래스 ====================
class Snowball {
    constructor(x, y, width, isBase = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.isBase = isBase;
    }

    getRadius() {
        return Math.min(this.width, SNOWBALL_SIZE) / 2;
    }

    getCenter() {
        const radius = this.getRadius();
        return {
            x: this.x + this.width / 2,
            y: this.y + radius
        };
    }
}

// ==================== 겹침 계산 ====================
/**
 * 두 눈덩이의 겹침 영역을 계산
 * @param {Object} current - 현재 떨어지는 눈덩이 {x, width}
 * @param {Snowball} previous - 이전 눈덩이
 * @returns {Object} - {overlapStart, overlapEnd, overlapWidth}
 */
function calculateOverlap(current, previous) {
    const overlapStart = Math.max(current.x, previous.x);
    const overlapEnd = Math.min(current.x + current.width, previous.x + previous.width);
    const overlapWidth = overlapEnd - overlapStart;

    return {
        overlapStart,
        overlapEnd,
        overlapWidth
    };
}

/**
 * 눈덩이 배치가 성공인지 확인
 * @param {number} overlapWidth - 겹침 너비
 * @returns {boolean}
 */
function isValidPlacement(overlapWidth) {
    return overlapWidth > 0;
}

// ==================== 새 눈덩이 생성 ====================
/**
 * 새 눈덩이의 Y 위치 계산
 * @param {Snowball} prevSnowball - 이전 눈덩이
 * @param {number} newWidth - 새 눈덩이 너비
 * @returns {number} - 새 눈덩이의 Y 좌표
 */
function calculateNewSnowballY(prevSnowball, newWidth) {
    const newRadius = Math.min(newWidth, SNOWBALL_SIZE) / 2;
    return prevSnowball.y - (newRadius * 2);
}

/**
 * 베이스 눈덩이 생성
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 * @returns {Snowball}
 */
function createBaseSnowball(canvasWidth, canvasHeight) {
    return new Snowball(
        (canvasWidth - INITIAL_WIDTH) / 2,
        canvasHeight - GROUND_HEIGHT - SNOWBALL_SIZE,
        INITIAL_WIDTH,
        true
    );
}

// ==================== 속도 계산 ====================
/**
 * 새로운 속도 계산
 * @param {number} currentSpeed - 현재 속도
 * @returns {number} - 새 속도 (최대 속도 제한 적용)
 */
function calculateNewSpeed(currentSpeed) {
    return Math.min(currentSpeed + SPEED_INCREMENT, MAX_SPEED);
}

// ==================== 배경 진행도 ====================
/**
 * 점수에 따른 배경 진행도 계산
 * @param {number} score - 현재 점수
 * @returns {number} - 0 ~ 1 사이의 진행도
 */
function calculateBackgroundProgress(score) {
    return Math.min(score / 40, 1);
}

// ==================== 스크롤 오프셋 ====================
/**
 * 스크롤 오프셋 계산
 * @param {number} stackTop - 스택 최상단 Y 좌표
 * @param {number} currentOffset - 현재 스크롤 오프셋
 * @param {number} canvasHeight - 캔버스 높이
 * @returns {number} - 새 스크롤 오프셋
 */
function calculateScrollOffset(stackTop, currentOffset, canvasHeight) {
    const viewThreshold = canvasHeight * 0.35;
    if (stackTop - currentOffset < viewThreshold) {
        return stackTop - viewThreshold;
    }
    return currentOffset;
}

// ==================== 현재 눈덩이 이동 ====================
/**
 * 현재 눈덩이의 새 위치와 방향 계산
 * @param {Object} current - {x, width, direction}
 * @param {number} speed - 이동 속도
 * @param {number} canvasWidth - 캔버스 너비
 * @returns {Object} - {x, direction}
 */
function updateCurrentSnowballPosition(current, speed, canvasWidth) {
    let newX = current.x + speed * current.direction;
    let newDirection = current.direction;

    if (newX + current.width > canvasWidth) {
        newDirection = -1;
        newX = canvasWidth - current.width;
    } else if (newX < 0) {
        newDirection = 1;
        newX = 0;
    }

    return { x: newX, direction: newDirection };
}

// ==================== 색상 보간 함수 ====================
/**
 * Hex 색상을 RGB로 변환
 * @param {string} hex - Hex 색상 코드
 * @returns {Object} - {r, g, b}
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * 두 색상 사이 보간
 * @param {string} color1 - 시작 색상 (hex)
 * @param {string} color2 - 끝 색상 (hex)
 * @param {number} t - 보간 비율 (0 ~ 1)
 * @returns {string} - RGB 색상 문자열
 */
function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 부드러운 전환 함수 (smoothstep)
 * @param {number} edge0 - 시작 경계
 * @param {number} edge1 - 끝 경계
 * @param {number} x - 입력값
 * @returns {number} - 0 ~ 1 사이의 부드럽게 보간된 값
 */
function smoothStep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// ==================== 게임 상태 관리 ====================
/**
 * 게임 상태 초기화
 * @param {number} canvasWidth - 캔버스 너비
 * @param {number} canvasHeight - 캔버스 높이
 * @returns {Object} - 초기 게임 상태
 */
function initializeGameState(canvasWidth, canvasHeight) {
    const baseSnowball = createBaseSnowball(canvasWidth, canvasHeight);

    return {
        snowballs: [baseSnowball],
        score: 0,
        speed: INITIAL_SPEED,
        scrollOffset: 0,
        backgroundProgress: 0,
        targetBackgroundProgress: 0,
        gameRunning: true
    };
}

/**
 * 눈덩이 배치 후 게임 상태 업데이트
 * @param {Object} state - 현재 게임 상태
 * @param {Object} currentSnowball - 현재 떨어지는 눈덩이
 * @param {number} canvasHeight - 캔버스 높이
 * @returns {Object} - 업데이트된 상태 또는 null (게임 오버)
 */
function placeSnowballAndUpdateState(state, currentSnowball, canvasHeight) {
    const prevSnowball = state.snowballs[state.snowballs.length - 1];
    const { overlapStart, overlapWidth } = calculateOverlap(currentSnowball, prevSnowball);

    if (!isValidPlacement(overlapWidth)) {
        return null; // 게임 오버
    }

    const newY = calculateNewSnowballY(prevSnowball, overlapWidth);
    const newSnowball = new Snowball(overlapStart, newY, overlapWidth);

    const newScore = state.score + 1;
    const newSpeed = calculateNewSpeed(state.speed);
    const newTargetProgress = calculateBackgroundProgress(newScore);
    const newScrollOffset = calculateScrollOffset(currentSnowball.y, state.scrollOffset, canvasHeight);

    return {
        ...state,
        snowballs: [...state.snowballs, newSnowball],
        score: newScore,
        speed: newSpeed,
        targetBackgroundProgress: newTargetProgress,
        scrollOffset: newScrollOffset
    };
}

// ==================== 리사이즈 위치 보정 ====================
/**
 * 화면 리사이즈 시 눈사람들의 위치를 보정
 * @param {Snowball[]} snowballs - 눈사람 배열
 * @param {Object|null} currentSnowball - 현재 이동 중인 눈덩이
 * @param {number} scrollOffset - 현재 스크롤 오프셋
 * @param {number} prevWidth - 이전 캔버스 너비
 * @param {number} prevHeight - 이전 캔버스 높이
 * @param {number} newWidth - 새 캔버스 너비
 * @param {number} newHeight - 새 캔버스 높이
 * @returns {Object} - {snowballs, currentSnowball, scrollOffset}
 */
function adjustPositionsOnResize(snowballs, currentSnowball, scrollOffset, prevWidth, prevHeight, newWidth, newHeight) {
    if (prevWidth <= 0 || prevHeight <= 0 || snowballs.length === 0) {
        return { snowballs, currentSnowball, scrollOffset };
    }

    const scaleX = newWidth / prevWidth;

    // 베이스 눈덩이의 기준점 (땅 위)
    const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
    const newBaseY = newHeight - GROUND_HEIGHT - SNOWBALL_SIZE;

    // 눈사람들 복사 및 위치 보정
    const adjustedSnowballs = snowballs.map(ball => {
        const newBall = new Snowball(ball.x, ball.y, ball.width, ball.isBase);
        newBall.x *= scaleX;
        newBall.width *= scaleX;
        const relativeY = ball.y - prevBaseY;
        newBall.y = newBaseY + relativeY;
        return newBall;
    });

    // 현재 눈덩이 보정
    let adjustedCurrentSnowball = null;
    if (currentSnowball) {
        adjustedCurrentSnowball = { ...currentSnowball };
        adjustedCurrentSnowball.x *= scaleX;
        adjustedCurrentSnowball.width *= scaleX;
        const relativeY = currentSnowball.y - prevBaseY;
        adjustedCurrentSnowball.y = newBaseY + relativeY;
    }

    // 스크롤 오프셋 보정
    const deltaBaseY = newBaseY - prevBaseY;
    const adjustedScrollOffset = scrollOffset + deltaBaseY;

    return {
        snowballs: adjustedSnowballs,
        currentSnowball: adjustedCurrentSnowball,
        scrollOffset: adjustedScrollOffset
    };
}

// ==================== 내보내기 ====================
module.exports = {
    // 상수
    SNOWBALL_SIZE,
    INITIAL_WIDTH,
    INITIAL_SPEED,
    SPEED_INCREMENT,
    MAX_SPEED,
    GROUND_HEIGHT,
    BACKGROUND_TRANSITION_SPEED,

    // 클래스
    Snowball,

    // 함수
    calculateOverlap,
    isValidPlacement,
    calculateNewSnowballY,
    createBaseSnowball,
    calculateNewSpeed,
    calculateBackgroundProgress,
    calculateScrollOffset,
    updateCurrentSnowballPosition,
    hexToRgb,
    lerpColor,
    smoothStep,
    initializeGameState,
    placeSnowballAndUpdateState,
    adjustPositionsOnResize
};
