const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let score = 0;
let snowballs = [];
let stack = [];
let lives = 3;
let gameSpeed = 1;
let spawnRate = 2000; // ms
let lastSpawnTime = 0;
let animationId;

// Constants
const HORIZON_Y = window.innerHeight * 0.3; // Horizon line
const BOTTOM_Y = window.innerHeight * 0.9; // Where we catch
const MAX_STACK_HEIGHT = 10; // Number of balls before camera shifts

// Resize canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Add lives display
const livesDisplay = document.createElement('div');
livesDisplay.id = 'lives';
livesDisplay.style.position = 'absolute';
livesDisplay.style.top = '20px';
livesDisplay.style.right = '20px';
livesDisplay.style.fontSize = '24px';
livesDisplay.style.color = 'white';
livesDisplay.style.fontWeight = 'bold';
livesDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
document.getElementById('ui-layer').appendChild(livesDisplay);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

class Snowball {
    constructor() {
        // Start at horizon, random X
        this.x = Math.random() * canvas.width;
        this.y = HORIZON_Y;

        // Target is bottom center (where the stack is)
        // But to make it harder, maybe they fly towards the player's general area?
        // For now, let's make them fly towards the bottom center where the stack is.
        this.targetX = canvas.width / 2;
        this.targetY = BOTTOM_Y;

        this.z = 100; // Depth: 100 is far, 0 is near
        this.speed = 0.5 + Math.random() * 0.5; // Random speed

        this.radius = 10; // Base radius
        this.caught = false;
        this.color = '#FFFFFF';
    }

    update() {
        this.z -= this.speed * gameSpeed;

        // Perspective projection
        // As Z decreases, object gets bigger and moves from source to target
        const progress = (100 - this.z) / 100; // 0 to 1

        // Linear interpolation for position
        this.currentX = this.x + (this.targetX - this.x) * progress;
        this.currentY = this.y + (this.targetY - this.y) * progress;

        // Scale increases as it gets closer
        this.currentRadius = this.radius * (1 + progress * 4); // Max 5x size
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, this.currentRadius, 0, Math.PI * 2);

        // Gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            this.currentX - this.currentRadius / 3,
            this.currentY - this.currentRadius / 3,
            this.currentRadius / 10,
            this.currentX,
            this.currentY,
            this.currentRadius
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, '#ddd');

        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }

    isClickInside(x, y) {
        const dx = x - this.currentX;
        const dy = y - this.currentY;
        return Math.sqrt(dx * dx + dy * dy) <= this.currentRadius;
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    snowballs = [];
    stack = [];
    gameSpeed = 1;
    scoreDisplay.innerText = `Score: ${score}`;
    livesDisplay.innerText = `Lives: ${lives}`;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastSpawnTime = performance.now();

    // Initial base snowball
    stack.push({
        x: canvas.width / 2,
        y: BOTTOM_Y,
        radius: 50
    });

    cancelAnimationFrame(animationId);
    gameLoop(performance.now());
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background (Sky/Ground)
    ctx.fillStyle = '#87CEEB'; // Sky
    ctx.fillRect(0, 0, canvas.width, HORIZON_Y);
    ctx.fillStyle = '#E0F7FA'; // Snow ground
    ctx.fillRect(0, HORIZON_Y, canvas.width, canvas.height - HORIZON_Y);

    // Spawn Snowballs
    if (timestamp - lastSpawnTime > spawnRate / gameSpeed) {
        snowballs.push(new Snowball());
        lastSpawnTime = timestamp;
        // Increase difficulty
        gameSpeed += 0.01;
    }

    // Draw Stack
    drawStack();

    // Update and Draw Snowballs
    // Sort by Z (depth) so far ones are drawn first
    snowballs.sort((a, b) => b.z - a.z);

    for (let i = snowballs.length - 1; i >= 0; i--) {
        const ball = snowballs[i];
        ball.update();
        ball.draw();

        // Missed condition
        if (ball.z <= 0) {
            snowballs.splice(i, 1);
            lives--;
            livesDisplay.innerText = `Lives: ${lives}`;
            if (lives <= 0) {
                gameOver();
            }
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    finalScoreDisplay.innerText = score;
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

function drawStack() {
    // Calculate stack offset (camera movement)
    let yOffset = 0;
    if (stack.length > 5) {
        yOffset = (stack.length - 5) * 40;
    }

    for (let i = 0; i < stack.length; i++) {
        const ball = stack[i];
        const drawY = ball.y + yOffset; // Move down as we go up? No, we want to see the top.
        // Actually, if stack grows UP, y decreases.
        // We want the top of the stack to stay somewhat visible.

        // We need to store just the radius in the stack, and calculate positions dynamically?
        // Or store positions.
    }

    // Better stack rendering:
    // The base is at BOTTOM_Y + yOffset.
    // Each ball is stacked on top.
    let currentY = BOTTOM_Y + yOffset;

    for (let i = 0; i < stack.length; i++) {
        const ball = stack[i];

        ctx.beginPath();
        ctx.arc(canvas.width / 2, currentY, ball.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            canvas.width / 2 - ball.radius / 3,
            currentY - ball.radius / 3,
            ball.radius / 10,
            canvas.width / 2,
            currentY,
            ball.radius
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, '#ccc');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.stroke();
        ctx.closePath();

        // Prepare Y for next ball (on top)
        // Overlap slightly (0.8 * radius)
        if (i < stack.length - 1) {
            currentY -= (ball.radius + stack[i + 1].radius) * 0.6;
        }
    }
}

// Click handler for catching
window.addEventListener('mousedown', (e) => {
    if (!gameRunning) return;

    const clickX = e.clientX;
    const clickY = e.clientY;

    // Check if clicked on any snowball
    // We should check from front (closest) to back
    // snowballs is sorted far to near (b.z - a.z), so reverse iterate?
    // Actually we want to catch the one closest to screen (lowest Z)

    // Let's find all clickable balls
    let caughtIndex = -1;

    // Filter balls that are "close enough" to be caught (z < 20?)
    // User said "timing", so maybe they have to be close.

    for (let i = 0; i < snowballs.length; i++) {
        const ball = snowballs[i];
        // Only catchable if close enough?
        if (ball.z > 30) continue;

        if (ball.isClickInside(clickX, clickY)) {
            caughtIndex = i;
            break; // Catch the first valid one
        }
    }

    if (caughtIndex !== -1) {
        const caughtBall = snowballs[caughtIndex];
        snowballs.splice(caughtIndex, 1);

        // Add to stack
        stack.push({
            radius: caughtBall.currentRadius,
            // We don't really need x/y for stack as it's centered
        });

        score += 10;
        scoreDisplay.innerText = `Score: ${score}`;

        // Check win/lose or just infinite?
        // User said "climb higher into the sky". Infinite.
    }
});
