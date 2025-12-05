const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restartBtn');

// Game Constants
const COIN_HEIGHT = 30;
const INITIAL_WIDTH = 150;
const INITIAL_SPEED = 3;
const SPEED_INCREMENT = 0.2;
const COLORS = ['#f1c40f', '#e67e22', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'];

// Game State
let coins = [];
let currentCoin = null;
let score = 0;
let highScore = 0;
let gameRunning = false;
let scrollOffset = 0;
let direction = 1; // 1 for right, -1 for left
let speed = INITIAL_SPEED;

// Resize canvas
function resizeCanvas() {
    canvas.width = 400;
    canvas.height = 600;
}
resizeCanvas();

class Coin {
    constructor(x, y, width, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = COIN_HEIGHT;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - scrollOffset, this.width, this.height);

        // 3D effect / Bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x, this.y - scrollOffset, this.width, 5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + this.width - 5, this.y - scrollOffset, 5, this.height);
        ctx.fillRect(this.x, this.y + this.height - 5 - scrollOffset, this.width, 5);
    }
}

function initGame() {
    coins = [];
    score = 0;
    speed = INITIAL_SPEED;
    scrollOffset = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    restartBtn.style.display = 'none';

    // Base coin
    const baseCoin = new Coin(
        (canvas.width - INITIAL_WIDTH) / 2,
        canvas.height - COIN_HEIGHT,
        INITIAL_WIDTH,
        COLORS[0]
    );
    coins.push(baseCoin);

    spawnNextCoin();
    animate();
}

function spawnNextCoin() {
    const prevCoin = coins[coins.length - 1];
    const newColor = COLORS[coins.length % COLORS.length];

    // Start position depends on direction or random side? 
    // Let's start from left (0) or right (canvas.width - width) alternating or random?
    // Standard stacker: swings back and forth.

    currentCoin = {
        x: 0,
        y: prevCoin.y - COIN_HEIGHT,
        width: prevCoin.width,
        color: newColor,
        direction: 1
    };

    // Ensure it starts off-screen or at edge
    // Let's implement simple left-to-right bounce
}

function gameOver() {
    gameRunning = false;
    restartBtn.style.display = 'block';
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }

    // Visual effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

function placeCoin() {
    if (!gameRunning) return;

    const prevCoin = coins[coins.length - 1];

    // Calculate overlap
    const overlapStart = Math.max(currentCoin.x, prevCoin.x);
    const overlapEnd = Math.min(currentCoin.x + currentCoin.width, prevCoin.x + prevCoin.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
        gameOver();
        return;
    }

    // Success: Create the new stacked coin
    const newCoin = new Coin(
        overlapStart,
        currentCoin.y,
        overlapWidth,
        currentCoin.color
    );

    coins.push(newCoin);
    score++;
    scoreElement.textContent = score;

    // Increase speed slightly
    speed += SPEED_INCREMENT;

    // Scroll down if stack gets too high
    if (coins.length > 10) {
        scrollOffset = (coins.length - 10) * COIN_HEIGHT;
    }

    spawnNextCoin();
}

function update() {
    if (!gameRunning) return;

    // Move current coin
    currentCoin.x += speed * currentCoin.direction;

    // Bounce off walls
    // Allow it to go slightly off screen to make it harder? 
    // Standard stacker: bounces when it hits the edge of the screen (or defined bounds)
    if (currentCoin.x + currentCoin.width > canvas.width) {
        currentCoin.direction = -1;
    } else if (currentCoin.x < 0) {
        currentCoin.direction = 1;
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stack
    coins.forEach(coin => coin.draw());

    // Draw current moving coin
    if (gameRunning && currentCoin) {
        ctx.fillStyle = currentCoin.color;
        ctx.fillRect(currentCoin.x, currentCoin.y - scrollOffset, currentCoin.width, COIN_HEIGHT);

        // 3D effect for moving coin
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(currentCoin.x, currentCoin.y - scrollOffset, currentCoin.width, 5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(currentCoin.x + currentCoin.width - 5, currentCoin.y - scrollOffset, 5, COIN_HEIGHT);
        ctx.fillRect(currentCoin.x, currentCoin.y + COIN_HEIGHT - 5 - scrollOffset, currentCoin.width, 5);
    }
}

function animate() {
    update();
    draw();
    if (gameRunning) {
        requestAnimationFrame(animate);
    }
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameRunning) {
            placeCoin();
        } else if (restartBtn.style.display === 'block') {
            initGame();
        }
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (gameRunning) {
        placeCoin();
    }
});

restartBtn.addEventListener('click', initGame);

// Start game
initGame();
