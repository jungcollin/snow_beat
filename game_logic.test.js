/**
 * Snow Game Logic Tests
 */

const {
    SNOWBALL_SIZE,
    INITIAL_WIDTH,
    INITIAL_SPEED,
    SPEED_INCREMENT,
    MAX_SPEED,
    GROUND_HEIGHT,
    Snowball,
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
} = require('./game_logic');

// ==================== Snowball 클래스 테스트 ====================
describe('Snowball', () => {
    test('should create a snowball with correct properties', () => {
        const snowball = new Snowball(100, 200, 150);

        expect(snowball.x).toBe(100);
        expect(snowball.y).toBe(200);
        expect(snowball.width).toBe(150);
        expect(snowball.isBase).toBe(false);
    });

    test('should create a base snowball', () => {
        const snowball = new Snowball(100, 200, 150, true);

        expect(snowball.isBase).toBe(true);
    });

    test('getRadius should return correct radius (limited by SNOWBALL_SIZE)', () => {
        const smallSnowball = new Snowball(0, 0, 50);
        const largeSnowball = new Snowball(0, 0, 200);

        expect(smallSnowball.getRadius()).toBe(25); // 50 / 2
        expect(largeSnowball.getRadius()).toBe(SNOWBALL_SIZE / 2); // 제한됨
    });

    test('getCenter should return correct center coordinates', () => {
        const snowball = new Snowball(100, 200, 60);
        const center = snowball.getCenter();

        expect(center.x).toBe(130); // 100 + 60/2
        expect(center.y).toBe(230); // 200 + 30 (radius)
    });
});

// ==================== 겹침 계산 테스트 ====================
describe('calculateOverlap', () => {
    test('should calculate full overlap when perfectly aligned', () => {
        const current = { x: 100, width: 100 };
        const previous = new Snowball(100, 0, 100);

        const result = calculateOverlap(current, previous);

        expect(result.overlapWidth).toBe(100);
        expect(result.overlapStart).toBe(100);
        expect(result.overlapEnd).toBe(200);
    });

    test('should calculate partial overlap (left side)', () => {
        const current = { x: 50, width: 100 };
        const previous = new Snowball(100, 0, 100);

        const result = calculateOverlap(current, previous);

        expect(result.overlapWidth).toBe(50);
        expect(result.overlapStart).toBe(100);
        expect(result.overlapEnd).toBe(150);
    });

    test('should calculate partial overlap (right side)', () => {
        const current = { x: 150, width: 100 };
        const previous = new Snowball(100, 0, 100);

        const result = calculateOverlap(current, previous);

        expect(result.overlapWidth).toBe(50);
        expect(result.overlapStart).toBe(150);
        expect(result.overlapEnd).toBe(200);
    });

    test('should return zero or negative overlap when no intersection', () => {
        const current = { x: 300, width: 100 };
        const previous = new Snowball(100, 0, 100);

        const result = calculateOverlap(current, previous);

        expect(result.overlapWidth).toBeLessThanOrEqual(0);
    });
});

// ==================== 배치 유효성 테스트 ====================
describe('isValidPlacement', () => {
    test('should return true for positive overlap', () => {
        expect(isValidPlacement(50)).toBe(true);
        expect(isValidPlacement(1)).toBe(true);
    });

    test('should return false for zero overlap', () => {
        expect(isValidPlacement(0)).toBe(false);
    });

    test('should return false for negative overlap', () => {
        expect(isValidPlacement(-10)).toBe(false);
    });
});

// ==================== 새 눈덩이 Y 위치 계산 테스트 ====================
describe('calculateNewSnowballY', () => {
    test('should calculate Y position based on previous snowball', () => {
        const prevSnowball = new Snowball(100, 500, 100);
        const newWidth = 80;

        const newY = calculateNewSnowballY(prevSnowball, newWidth);

        // newRadius = min(80, 70) / 2 = 35
        // newY = 500 - 35 * 2 = 430
        expect(newY).toBe(430);
    });

    test('should respect SNOWBALL_SIZE limit for radius', () => {
        const prevSnowball = new Snowball(100, 500, 200);
        const newWidth = 200;

        const newY = calculateNewSnowballY(prevSnowball, newWidth);

        // newRadius = min(200, 70) / 2 = 35
        // newY = 500 - 35 * 2 = 430
        expect(newY).toBe(430);
    });
});

// ==================== 베이스 눈덩이 생성 테스트 ====================
describe('createBaseSnowball', () => {
    test('should create base snowball at correct position', () => {
        const canvasWidth = 800;
        const canvasHeight = 600;

        const base = createBaseSnowball(canvasWidth, canvasHeight);

        expect(base.isBase).toBe(true);
        expect(base.width).toBe(INITIAL_WIDTH);
        expect(base.x).toBe((canvasWidth - INITIAL_WIDTH) / 2);
        expect(base.y).toBe(canvasHeight - GROUND_HEIGHT - SNOWBALL_SIZE);
    });

    test('should center horizontally for different canvas widths', () => {
        const base1 = createBaseSnowball(400, 600);
        const base2 = createBaseSnowball(1200, 600);

        expect(base1.x).toBe(100); // (400 - 200) / 2
        expect(base2.x).toBe(500); // (1200 - 200) / 2
    });
});

// ==================== 속도 계산 테스트 ====================
describe('calculateNewSpeed', () => {
    test('should increase speed by increment', () => {
        const newSpeed = calculateNewSpeed(INITIAL_SPEED);

        expect(newSpeed).toBeCloseTo(INITIAL_SPEED + SPEED_INCREMENT);
    });

    test('should not exceed MAX_SPEED', () => {
        const newSpeed = calculateNewSpeed(MAX_SPEED);

        expect(newSpeed).toBe(MAX_SPEED);
    });

    test('should cap at MAX_SPEED when close to limit', () => {
        const newSpeed = calculateNewSpeed(MAX_SPEED - 0.01);

        expect(newSpeed).toBe(MAX_SPEED);
    });
});

// ==================== 배경 진행도 테스트 ====================
describe('calculateBackgroundProgress', () => {
    test('should return 0 for score 0', () => {
        expect(calculateBackgroundProgress(0)).toBe(0);
    });

    test('should return 0.5 for score 20', () => {
        expect(calculateBackgroundProgress(20)).toBe(0.5);
    });

    test('should return 1 for score 40', () => {
        expect(calculateBackgroundProgress(40)).toBe(1);
    });

    test('should cap at 1 for scores above 40', () => {
        expect(calculateBackgroundProgress(100)).toBe(1);
        expect(calculateBackgroundProgress(1000)).toBe(1);
    });
});

// ==================== 스크롤 오프셋 테스트 ====================
describe('calculateScrollOffset', () => {
    test('should update offset when stack is above threshold', () => {
        const canvasHeight = 600;
        const viewThreshold = canvasHeight * 0.35; // 210
        const stackTop = 100;
        const currentOffset = 0;

        const newOffset = calculateScrollOffset(stackTop, currentOffset, canvasHeight);

        expect(newOffset).toBe(stackTop - viewThreshold);
    });

    test('should keep current offset when stack is below threshold', () => {
        const canvasHeight = 600;
        const stackTop = 400;
        const currentOffset = 0;

        const newOffset = calculateScrollOffset(stackTop, currentOffset, canvasHeight);

        expect(newOffset).toBe(0);
    });
});

// ==================== 눈덩이 이동 테스트 ====================
describe('updateCurrentSnowballPosition', () => {
    test('should move right when direction is 1', () => {
        const current = { x: 100, width: 100, direction: 1 };
        const speed = 5;
        const canvasWidth = 800;

        const result = updateCurrentSnowballPosition(current, speed, canvasWidth);

        expect(result.x).toBe(105);
        expect(result.direction).toBe(1);
    });

    test('should move left when direction is -1', () => {
        const current = { x: 100, width: 100, direction: -1 };
        const speed = 5;
        const canvasWidth = 800;

        const result = updateCurrentSnowballPosition(current, speed, canvasWidth);

        expect(result.x).toBe(95);
        expect(result.direction).toBe(-1);
    });

    test('should bounce at right edge', () => {
        const current = { x: 700, width: 100, direction: 1 };
        const speed = 5;
        const canvasWidth = 800;

        const result = updateCurrentSnowballPosition(current, speed, canvasWidth);

        expect(result.direction).toBe(-1);
        expect(result.x).toBe(700); // 캔버스 가장자리에 고정
    });

    test('should bounce at left edge', () => {
        const current = { x: 2, width: 100, direction: -1 };
        const speed = 5;
        const canvasWidth = 800;

        const result = updateCurrentSnowballPosition(current, speed, canvasWidth);

        expect(result.direction).toBe(1);
        expect(result.x).toBe(0);
    });
});

// ==================== 색상 함수 테스트 ====================
describe('hexToRgb', () => {
    test('should convert hex to RGB', () => {
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('should handle hex without #', () => {
        expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    test('should return black for invalid hex', () => {
        expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
    });
});

describe('lerpColor', () => {
    test('should return first color at t=0', () => {
        const result = lerpColor('#000000', '#ffffff', 0);
        expect(result).toBe('rgb(0, 0, 0)');
    });

    test('should return second color at t=1', () => {
        const result = lerpColor('#000000', '#ffffff', 1);
        expect(result).toBe('rgb(255, 255, 255)');
    });

    test('should interpolate at t=0.5', () => {
        const result = lerpColor('#000000', '#ffffff', 0.5);
        expect(result).toBe('rgb(128, 128, 128)');
    });
});

describe('smoothStep', () => {
    test('should return 0 when x <= edge0', () => {
        expect(smoothStep(0.2, 0.8, 0)).toBe(0);
        expect(smoothStep(0.2, 0.8, 0.2)).toBe(0);
    });

    test('should return 1 when x >= edge1', () => {
        expect(smoothStep(0.2, 0.8, 1)).toBe(1);
        expect(smoothStep(0.2, 0.8, 0.8)).toBe(1);
    });

    test('should return 0.5 at midpoint', () => {
        expect(smoothStep(0, 1, 0.5)).toBe(0.5);
    });

    test('should return smooth interpolation', () => {
        const result = smoothStep(0, 1, 0.25);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(0.5);
    });
});

// ==================== 게임 상태 테스트 ====================
describe('initializeGameState', () => {
    test('should initialize game with correct default values', () => {
        const state = initializeGameState(800, 600);

        expect(state.snowballs).toHaveLength(1);
        expect(state.snowballs[0].isBase).toBe(true);
        expect(state.score).toBe(0);
        expect(state.speed).toBe(INITIAL_SPEED);
        expect(state.scrollOffset).toBe(0);
        expect(state.backgroundProgress).toBe(0);
        expect(state.targetBackgroundProgress).toBe(0);
        expect(state.gameRunning).toBe(true);
    });
});

describe('placeSnowballAndUpdateState', () => {
    test('should add new snowball on valid placement', () => {
        const state = initializeGameState(800, 600);
        const currentSnowball = {
            x: state.snowballs[0].x,
            y: state.snowballs[0].y - SNOWBALL_SIZE,
            width: state.snowballs[0].width
        };

        const newState = placeSnowballAndUpdateState(state, currentSnowball, 600);

        expect(newState).not.toBeNull();
        expect(newState.snowballs).toHaveLength(2);
        expect(newState.score).toBe(1);
        expect(newState.speed).toBeGreaterThan(state.speed);
    });

    test('should return null on game over (no overlap)', () => {
        const state = initializeGameState(800, 600);
        const currentSnowball = {
            x: 700, // 완전히 다른 위치
            y: state.snowballs[0].y - SNOWBALL_SIZE,
            width: 50
        };

        const newState = placeSnowballAndUpdateState(state, currentSnowball, 600);

        expect(newState).toBeNull();
    });

    test('should calculate correct overlap width for new snowball', () => {
        const state = initializeGameState(800, 600);
        const prevSnowball = state.snowballs[0];

        // 50% 겹침
        const currentSnowball = {
            x: prevSnowball.x + prevSnowball.width / 2,
            y: prevSnowball.y - SNOWBALL_SIZE,
            width: prevSnowball.width
        };

        const newState = placeSnowballAndUpdateState(state, currentSnowball, 600);

        expect(newState).not.toBeNull();
        expect(newState.snowballs[1].width).toBe(prevSnowball.width / 2);
    });
});

// ==================== 상수 테스트 ====================
describe('Game Constants', () => {
    test('should have valid initial values', () => {
        expect(SNOWBALL_SIZE).toBeGreaterThan(0);
        expect(INITIAL_WIDTH).toBeGreaterThan(0);
        expect(INITIAL_SPEED).toBeGreaterThan(0);
        expect(MAX_SPEED).toBeGreaterThan(INITIAL_SPEED);
        expect(SPEED_INCREMENT).toBeGreaterThan(0);
        expect(GROUND_HEIGHT).toBeGreaterThan(0);
    });

    test('should have sensible relationships', () => {
        expect(INITIAL_WIDTH).toBeGreaterThanOrEqual(SNOWBALL_SIZE);
        expect(MAX_SPEED).toBeGreaterThan(INITIAL_SPEED);
    });
});

// ==================== 리사이즈 위치 보정 테스트 ====================
describe('adjustPositionsOnResize', () => {
    test('should return unchanged values when previous dimensions are zero', () => {
        const snowballs = [new Snowball(100, 400, 200, true)];
        const result = adjustPositionsOnResize(snowballs, null, 0, 0, 0, 800, 600);

        expect(result.snowballs).toBe(snowballs);
        expect(result.scrollOffset).toBe(0);
    });

    test('should return unchanged values when snowballs array is empty', () => {
        const result = adjustPositionsOnResize([], null, 0, 800, 600, 400, 300);

        expect(result.snowballs).toHaveLength(0);
        expect(result.scrollOffset).toBe(0);
    });

    test('should scale X positions when width is halved', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 400;
        const newHeight = 600;

        const baseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(300, baseY, 200, true)];

        const result = adjustPositionsOnResize(snowballs, null, 0, prevWidth, prevHeight, newWidth, newHeight);

        // X should be halved: 300 * 0.5 = 150
        expect(result.snowballs[0].x).toBe(150);
        // Width should be halved: 200 * 0.5 = 100
        expect(result.snowballs[0].width).toBe(100);
    });

    test('should scale X positions when width is doubled', () => {
        const prevWidth = 400;
        const prevHeight = 600;
        const newWidth = 800;
        const newHeight = 600;

        const baseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(100, baseY, 100, true)];

        const result = adjustPositionsOnResize(snowballs, null, 0, prevWidth, prevHeight, newWidth, newHeight);

        // X should be doubled: 100 * 2 = 200
        expect(result.snowballs[0].x).toBe(200);
        // Width should be doubled: 100 * 2 = 200
        expect(result.snowballs[0].width).toBe(200);
    });

    test('should adjust Y positions relative to ground when height changes', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 800;
        const newHeight = 400;

        const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(300, prevBaseY, 200, true)];

        const result = adjustPositionsOnResize(snowballs, null, 0, prevWidth, prevHeight, newWidth, newHeight);

        // New base Y should be relative to new height
        const newBaseY = newHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        expect(result.snowballs[0].y).toBe(newBaseY);
    });

    test('should maintain relative Y offset for stacked snowballs', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 800;
        const newHeight = 400;

        const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const stackOffset = -70; // 위에 쌓인 눈덩이
        const snowballs = [
            new Snowball(300, prevBaseY, 200, true),
            new Snowball(300, prevBaseY + stackOffset, 180, false)
        ];

        const result = adjustPositionsOnResize(snowballs, null, 0, prevWidth, prevHeight, newWidth, newHeight);

        const newBaseY = newHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        // 두 번째 눈덩이도 같은 상대적 위치 유지
        expect(result.snowballs[1].y).toBe(newBaseY + stackOffset);
    });

    test('should adjust currentSnowball position', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 400;
        const newHeight = 600;

        const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(300, prevBaseY, 200, true)];
        const currentSnowball = { x: 200, y: prevBaseY - 70, width: 200, direction: 1 };

        const result = adjustPositionsOnResize(snowballs, currentSnowball, 0, prevWidth, prevHeight, newWidth, newHeight);

        expect(result.currentSnowball.x).toBe(100); // 200 * 0.5
        expect(result.currentSnowball.width).toBe(100); // 200 * 0.5
        expect(result.currentSnowball.direction).toBe(1); // unchanged
    });

    test('should adjust scrollOffset based on height change', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 800;
        const newHeight = 400;

        const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(300, prevBaseY, 200, true)];
        const initialScrollOffset = 100;

        const result = adjustPositionsOnResize(snowballs, null, initialScrollOffset, prevWidth, prevHeight, newWidth, newHeight);

        const deltaBaseY = (newHeight - GROUND_HEIGHT - SNOWBALL_SIZE) - prevBaseY;
        expect(result.scrollOffset).toBe(initialScrollOffset + deltaBaseY);
    });

    test('should handle null currentSnowball', () => {
        const prevWidth = 800;
        const prevHeight = 600;
        const newWidth = 400;
        const newHeight = 600;

        const prevBaseY = prevHeight - GROUND_HEIGHT - SNOWBALL_SIZE;
        const snowballs = [new Snowball(300, prevBaseY, 200, true)];

        const result = adjustPositionsOnResize(snowballs, null, 0, prevWidth, prevHeight, newWidth, newHeight);

        expect(result.currentSnowball).toBeNull();
    });
});
