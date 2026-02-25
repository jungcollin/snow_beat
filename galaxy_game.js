const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const hpFillElement = document.getElementById('hp-fill');
const startScreen = document.getElementById('start-screen');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

// Game State
let gameRunning = false;
let score = 0;
let level = 1;
let lastTime = 0;
let enemySpawnTimer = 0;
let enemySpawnInterval = 1000;

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input Handling
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false,
    ' ': false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = false;
    }
});

// Mouse Input
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousedown', () => mouseDown = true);
window.addEventListener('mouseup', () => mouseDown = false);


// Classes
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 40;
        this.height = 50;
        this.speed = 5;
        this.color = '#0ff';
        this.hp = 100;
        this.maxHp = 100;
        this.lastShot = 0;
        this.shootDelay = 200;
    }

    update() {
        // Keyboard Movement
        if (keys.ArrowUp || keys.w) this.y -= this.speed;
        if (keys.ArrowDown || keys.s) this.y += this.speed;
        if (keys.ArrowLeft || keys.a) this.x -= this.speed;
        if (keys.ArrowRight || keys.d) this.x += this.speed;

        // Boundary Check
        if (this.x < this.width/2) this.x = this.width/2;
        if (this.x > canvas.width - this.width/2) this.x = canvas.width - this.width/2;
        if (this.y < this.height/2) this.y = this.height/2;
        if (this.y > canvas.height - this.height/2) this.y = canvas.height - this.height/2;

        // Shooting
        if (keys[' '] || mouseDown) {
             if (performance.now() - this.lastShot > this.shootDelay) {
                 bullets.push(new Bullet(this.x, this.y - this.height/2));
                 playSound('shoot');
                 this.lastShot = performance.now();
             }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ship Body
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // Engine Flame
        if (Math.random() > 0.5) {
            ctx.beginPath();
            ctx.moveTo(-5, this.height / 3);
            ctx.lineTo(5, this.height / 3);
            ctx.lineTo(0, this.height / 3 + 15 + Math.random() * 10);
            ctx.closePath();
            ctx.fillStyle = '#f00';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-3, this.height / 3);
            ctx.lineTo(3, this.height / 3);
            ctx.lineTo(0, this.height / 3 + 8 + Math.random() * 5);
            ctx.closePath();
            ctx.fillStyle = '#ff0';
            ctx.fill();
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.radius = 5;
        this.color = '#ff0';
        this.markedForDeletion = false;
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Enemy {
    constructor(type) {
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width) + this.width / 2;
        this.y = -this.height;
        this.markedForDeletion = false;

        if (type === 'basic') {
            this.speed = 2 + Math.random();
            this.hp = 1;
            this.color = '#f00';
            this.scoreValue = 10;
        } else if (type === 'fast') {
            this.speed = 4 + Math.random();
            this.hp = 1;
            this.color = '#f0f';
            this.width = 30;
            this.height = 30;
            this.scoreValue = 20;
        } else if (type === 'tank') {
            this.speed = 1 + Math.random() * 0.5;
            this.hp = 5;
            this.color = '#0f0';
            this.width = 60;
            this.height = 60;
            this.scoreValue = 50;
        }
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.markedForDeletion = true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Simple face/details
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 10, this.y - 5, 5, 5);
        ctx.fillRect(this.x + 5, this.y - 5, 5, 5);
        ctx.fillRect(this.x - 5, this.y + 10, 10, 3);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Star {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 3 + 1;
        this.brightness = Math.random();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Objects
const player = new Player();
let bullets = [];
let enemies = [];
let particles = [];
const stars = [];

for (let i = 0; i < 100; i++) {
    stars.push(new Star());
}

function spawnEnemy() {
    const rand = Math.random();
    let type = 'basic';
    if (rand < 0.2 && level > 1) type = 'fast';
    if (rand < 0.1 && level > 2) type = 'tank';

    enemies.push(new Enemy(type));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
    playSound('explosion');
}

function checkCollisions() {
    // Bullets vs Enemies
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (!bullet.markedForDeletion && !enemy.markedForDeletion) {
                 const dx = bullet.x - enemy.x;
                 const dy = bullet.y - enemy.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);
                 if (distance < bullet.radius + enemy.width / 2) {
                     bullet.markedForDeletion = true;
                     enemy.hp--;
                     createExplosion(bullet.x, bullet.y, '#ff0');

                     if (enemy.hp <= 0) {
                         enemy.markedForDeletion = true;
                         createExplosion(enemy.x, enemy.y, enemy.color);
                         score += enemy.scoreValue;
                         scoreElement.textContent = score;

                         // Level Progression
                         if (score > level * 500) {
                             level++;
                             levelElement.textContent = level;
                             enemySpawnInterval = Math.max(200, 1000 - (level * 100));
                         }
                     }
                 }
            }
        });
    });

    // Enemies vs Player
    enemies.forEach(enemy => {
        if (!enemy.markedForDeletion) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < enemy.width / 2 + player.width / 2) {
                enemy.markedForDeletion = true;
                createExplosion(enemy.x, enemy.y, enemy.color);
                player.hp -= 20;
                const hpPercent = (player.hp / player.maxHp) * 100;
                hpFillElement.style.width = `${Math.max(0, hpPercent)}%`;

                if (player.hp <= 0) {
                    createExplosion(player.x, player.y, '#0ff');
                    gameOver();
                }
            }
        }
    });
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// Game Loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update & Draw Stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    // Spawn Enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    // Update & Draw Player
    player.update();
    player.draw();

    // Update & Draw Bullets
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();
    });
    bullets = bullets.filter(bullet => !bullet.markedForDeletion);

    // Update & Draw Enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });
    enemies = enemies.filter(enemy => !enemy.markedForDeletion);

    // Update & Draw Particles
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    particles = particles.filter(particle => particle.life > 0);

    checkCollisions();

    requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    player.hp = 100;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    bullets = [];
    enemies = [];
    particles = [];
    enemySpawnInterval = 1000;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    hpFillElement.style.width = '100%';

    startScreen.classList.add('hidden');
    gameOverModal.classList.add('hidden');

    // Resume Audio Context if needed
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial Draw for background
function initialDraw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        star.draw();
    });
}
initialDraw();
