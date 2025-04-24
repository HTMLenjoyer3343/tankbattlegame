class Tank {
    constructor(x, y, type = 'shotgun') {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 3;
        this.type = type;
        this.health = 100;
        this.lastShot = 0;
        this.size = 30;

        // Tank type properties
        switch(type) {
            case 'shotgun':
                this.damage = 40;
                this.bulletSpeed = 7;
                this.fireRate = 800;
                this.bulletSpread = 3;
                this.bulletsPerShot = 5;
                break;
            case 'ak47':
                this.damage = 100;
                this.bulletSpeed = 10;
                this.fireRate = 200;
                this.bulletSpread = 1;
                this.bulletsPerShot = 1;
                break;
            case 'superCannon':
                this.damage = 100;
                this.bulletSpeed = 15;
                this.fireRate = 500;
                this.bulletSpread = 0;
                this.bulletsPerShot = 1;
                this.invincible = true;
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Tank body
        ctx.fillStyle = this.isPlayer ? '#4CAF50' : '#F44336';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

        // Tank cannon
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, this.size/2, 10);

        ctx.restore();

        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 25, this.y - 40, 50, 5);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x - 25, this.y - 40, (this.health/100) * 50, 5);
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.fireRate) {
            this.lastShot = now;
            let bullets = [];
            for (let i = 0; i < this.bulletsPerShot; i++) {
                const spread = (Math.random() - 0.5) * this.bulletSpread * Math.PI/180;
                bullets.push(new Bullet(
                    this.x + Math.cos(this.angle) * this.size,
                    this.y + Math.sin(this.angle) * this.size,
                    this.angle + spread,
                    this.bulletSpeed,
                    this.damage,
                    this.isPlayer
                ));
            }
            return bullets;
        }
        return [];
    }
}

class Bullet {
    constructor(x, y, angle, speed, damage, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.isPlayerBullet = isPlayerBullet;
        this.size = 5;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = this.isPlayerBullet ? '#FFF' : '#FF0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.player = new Tank(this.width/2, this.height - 50, 'shotgun');
        this.player.isPlayer = true;

        this.enemies = [];
        this.bullets = [];
        this.level = 1;
        this.coins = 0;
        this.currentTankType = 'shotgun';

        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.gameLoop = this.gameLoop.bind(this);

        this.setupEventListeners();
        this.startLevel();
        requestAnimationFrame(this.gameLoop);
    }

    setupEventListeners() {
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', () => {
            const bullets = this.player.shoot();
            this.bullets.push(...bullets);
        });
    }

    startLevel() {
        this.enemies = [];
        
        if (this.level === 20) {
            // Create boss tank
            const boss = new Tank(this.width/2, 150);
            boss.isPlayer = false;
            boss.size = 60; // Bigger size
            boss.health = 1000; // More health
            boss.damage *= 2; // More damage
            boss.speed *= 0.5; // Slower movement
            boss.hitsRequired = 10; // Track hits needed
            boss.hitsTaken = 0; // Track hits taken
            this.enemies.push(boss);
        } else {
            const enemyCount = Math.min(2 + Math.floor(this.level * 1.2), 10);
            
            for (let i = 0; i < enemyCount; i++) {
                const x = Math.random() * (this.width - 100) + 50;
                const y = Math.random() * 200 + 50;
                const enemy = new Tank(x, y);
                enemy.isPlayer = false;
                this.enemies.push(enemy);
            }

            // Increase enemy difficulty with level
            this.enemies.forEach(enemy => {
                if (this.level <= 10) {
                    enemy.damage *= 1 + (this.level * 0.01);
                    enemy.speed *= 1 + (this.level * 0.01);
                    enemy.health *= 1 + (this.level * 0.05);
                } else {
                    enemy.damage *= 1 + (this.level * 0.015);
                    enemy.speed *= 1 + (this.level * 0.015);
                    enemy.health *= 1 + (this.level * 0.075);
                }
            });
        }
    }

    update() {
        // Player movement
        if (this.keys['a'] || this.keys['ArrowLeft']) this.player.x -= this.player.speed;
        if (this.keys['d'] || this.keys['ArrowRight']) this.player.x += this.player.speed;
        if (this.keys['w'] || this.keys['ArrowUp']) this.player.y -= this.player.speed;
        if (this.keys['s'] || this.keys['ArrowDown']) this.player.y += this.player.speed;

        // Keep player in bounds
        this.player.x = Math.max(this.player.size/2, Math.min(this.width - this.player.size/2, this.player.x));
        this.player.y = Math.max(this.player.size/2, Math.min(this.height - this.player.size/2, this.player.y));

        // Player rotation
        const dx = this.mousePos.x - this.player.x;
        const dy = this.mousePos.y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);

        // Enemy AI
        this.enemies.forEach((enemy, index) => {
            // Check for collision with superCannon tank
            if (this.player.type === 'superCannon' && this.checkCollision(null, enemy)) {
                enemy.health = 0;
                this.enemies.splice(index, 1);
                this.coins += 20;
                document.getElementById('coins').textContent = `Coins: ${this.coins}`;
                return;
            }
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            enemy.angle = Math.atan2(dy, dx);

            // Move towards player
            enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3;

            // Enemy shooting
            if (Math.random() < 0.01) {  // Reduced shooting frequency
                const bullets = enemy.shoot();
                this.bullets.push(...bullets);
            }
        });

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());

        // Collision detection
        this.bullets = this.bullets.filter(bullet => {
            // Remove bullets out of bounds
            if (bullet.x < 0 || bullet.x > this.width || bullet.y < 0 || bullet.y > this.height) {
                return false;
            }

            // Check bullet collision with tanks
            if (bullet.isPlayerBullet) {
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    if (this.checkCollision(bullet, enemy)) {
                        if (this.level === 20) {
                            enemy.hitsTaken++;
                            if (enemy.hitsTaken >= enemy.hitsRequired) {
                                enemy.health = 0;
                                this.enemies.splice(i, 1);
                                this.coins += 100;
                                document.getElementById('coins').textContent = `Coins: ${this.coins}`;
                            }
                        } else {
                            enemy.health -= bullet.damage;
                            if (enemy.health <= 0) {
                                this.enemies.splice(i, 1);
                                this.coins += 20;
                                document.getElementById('coins').textContent = `Coins: ${this.coins}`;
                            }
                        }
                        return false;
                    }
                }
                return true;
            } else {
                if (this.checkCollision(bullet, this.player)) {
                    if (!this.player.invincible) {
                        this.player.health -= bullet.damage;
                        if (this.player.health <= 0) {
                            this.resetGame();
                        }
                    }
                    return false;
                }
                return true;
            }
            return true;
        });

        // Check level completion
        if (this.enemies.length === 0) {
            this.levelComplete();
        }
    }

    checkCollision(bullet, tank) {
        // Check if it's a bullet collision
        if (bullet) {
            return Math.abs(bullet.x - tank.x) < tank.size/2 &&
                   Math.abs(bullet.y - tank.y) < tank.size/2;
        }
        // Check tank-to-tank collision
        return Math.abs(this.player.x - tank.x) < (this.player.size/2 + tank.size/2) &&
               Math.abs(this.player.y - tank.y) < (this.player.size/2 + tank.size/2);
    }

    levelComplete() {
        if (this.level < 20) {
            this.level++;
            document.getElementById('level').textContent = `Level: ${this.level}`;
            this.coins += 100;
            document.getElementById('coins').textContent = `Coins: ${this.coins}`;
            this.player.health = 100;
            if (this.level === 20) {
                // Remove invincibility for level 20
                this.player.invincible = false;
            }
            this.startLevel();
        } else if (this.level === 20) {
            alert('Поздравляем! Вы прошли игру!');
            this.resetGame();
        }
    }

    resetGame() {
        if (this.player.health <= 0 && this.level === 20) {
            // Respawn at level 20
            this.player.health = 100;
            this.startLevel();
        } else {
            this.level = 1;
            document.getElementById('level').textContent = `Level: ${this.level}`;
            this.player.health = 100;
            this.startLevel();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

function buyTank(type) {
    const prices = {
        shotgun: 0,
        ak47: 100,
        superCannon: 3000,
    };

    const game = window.game;
    if (game.coins >= prices[type]) {
        game.coins -= prices[type];
        document.getElementById('coins').textContent = `Coins: ${game.coins}`;
        game.player.type = type;
        Object.assign(game.player, new Tank(game.player.x, game.player.y, type));
        game.player.isPlayer = true;
    }
}

function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('shop').style.right = '-200px';
}

function showLevelSelect() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'flex';
    document.querySelector('.level-select').style.display = 'flex';
}

function showShop() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('shop').style.right = '10px';
}

function startGame(level) {
    document.getElementById('levelSelect').style.display = 'none';
    if (!window.game) {
        window.game = new Game();
    }
    window.game.level = level;
    window.game.resetGame();
}

window.onload = () => {
    showMainMenu();
};