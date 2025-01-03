import { Application, Assets, AnimatedSprite, TilingSprite,Sprite} from "pixi.js";
import { createTank } from "./tank";
import { setupInput, cleanupInput } from "./input";
import { createStartScreen } from "./startScreen";
import { showGameOverScreen } from "./gameOverScreen";
import { Bullet } from "./bullet";

const config = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0xffffff,
};

async function initPixiApp() {
	const app = new Application();
	await app.init(config);

	document.body.appendChild(app.canvas);

	const backgroundTexture = await Assets.load(
		"graphics/background/test.png"
	);
	const background = new TilingSprite({
        texture: backgroundTexture,
        width: app.screen.width,
        height: app.screen.height,
    });
	app.stage.addChild(background);

	// Funkcia na prispôsobenie veľkosti plátna a pozadia
	function resizeCanvas() {
        config.width = window.innerWidth; // Aktualizácia šírky
        config.height = window.innerHeight; // Aktualizácia výšky

        // Zmena veľkosti vykresľovača (renderer)
        app.renderer.resize(config.width, config.height);

        // Prispôsobenie pozadia
        background.width = app.screen.width;
        background.height = app.screen.height;
    }

    // Prvé prispôsobenie po inicializácii
    resizeCanvas();

    // Pridanie event listenera na "resize" (zmena veľkosti okna)
    window.addEventListener("resize", resizeCanvas);

	createStartScreen(app, async () => {
		await startGame(app);
	});

	return app;
}

async function addExplosionEffect(app, x, y) {
    // Load explosion textures
    const explosionFrames = [];
    for (let i = 1; i <= 6; i++) {
        const texture = await Assets.load(`graphics/explosions/explosion${i}.png`);
        explosionFrames.push(texture);
    }

    // Create an animated sprite
    const explosion = new AnimatedSprite(explosionFrames);
    explosion.x = x;
    explosion.y = y;
	explosion.width = 20;
	explosion.height = 20;
    explosion.anchor.set(0.5);
    explosion.animationSpeed = 0.3; // Adjust speed
    explosion.loop = false; // Play once

    // Add to stage and play
    app.stage.addChild(explosion);
    explosion.play();

    // Remove explosion after animation finishes
    explosion.onComplete = () => {
        app.stage.removeChild(explosion);
        explosion.destroy(); // Clean up resources
    };
}

async function startGame(app) {
	app.ticker.start();

	await Assets.load("graphics/bullets/bullet.png");

	const tank = await createTank(app);
	let bullets = [];

	const obstacles = await loadObstacles();
	const difficulty = await loadDifficulty();

	const currentLevel = 1;
	const numberOfObstacles = difficulty[currentLevel].obstacleCount;
	const selectedObstacles = getRandomItems(obstacles, numberOfObstacles);
	renderEntities(app, selectedObstacles, { randomRotation: true });

	const enemyTanks = await loadEnemyTanks();
	const selectedEnemies = getRandomItems(enemyTanks, 3);
	renderEntities(app, selectedEnemies);

	setupInput(app, tank, bullets);

	app.ticker.add(() => {
		// Rotate obstacles (if applicable)
		updateObstaclesRotation(selectedObstacles);
	
		for (let i = bullets.length - 1; i >= 0; i--) {
			const bullet = bullets[i];
	
			// Remove bullets that are off-screen
			if (!bullet.update()) {
				console.log("Bullet removed (out of screen)");
				app.stage.removeChild(bullet.sprite);
				bullets.splice(i, 1);
				continue;
			}
	
			// Bullet-Obstacle Collision Check
			for (const obstacle of selectedObstacles) {
				const obstacleRect = {
					x: obstacle.x - obstacle.width / 2, // Adjust for anchor
					y: obstacle.y - obstacle.height / 2, // Adjust for anchor
					width: obstacle.width,
					height: obstacle.height,
				};
	
				const bulletRect = {
					x: bullet.sprite.x - bullet.sprite.width / 2, // Adjust for anchor
					y: bullet.sprite.y - bullet.sprite.height / 2, // Adjust for anchor
					width: bullet.sprite.width,
					height: bullet.sprite.height,
				};
	
				if (checkCollision(bulletRect, obstacleRect)) {
					console.log("Bullet hit an obstacle.");
					addExplosionEffect(app, bullet.x, bullet.y);
					app.stage.removeChild(bullet.sprite); // Remove bullet sprite
					bullets.splice(i, 1); // Remove bullet from array
					break; // Exit obstacle collision loop
				}
			}
	
			if (bullet.isEnemy) {
				// Enemy bullet hitting the player's tank
				if (checkBulletCollision(bullet, tank)) {
					console.log("Player hit by enemy bullet! Game over.");
					app.stage.removeChild(tank);
					cleanupGame(app, tank, selectedEnemies);
					return; // Exit ticker
				}
			} else {
				// Player bullet hitting enemy tanks
				for (let j = selectedEnemies.length - 1; j >= 0; j--) {
					const enemy = selectedEnemies[j];
					if (enemy.sprite && checkBulletCollision(bullet, enemy.sprite)) {
						console.log("Enemy tank destroyed by player's bullet!");
	
						app.stage.removeChild(enemy.sprite);
						selectedEnemies.splice(j, 1);
	
						app.stage.removeChild(bullet.sprite);
						bullets.splice(i, 1);
	
						// Optional: Add an explosion effect or update the score
						// addExplosionEffect(app, enemy.sprite.x, enemy.sprite.y);
						break;
					}
				}
			}
		}
	
		// Check Tank-Obstacle Collisions
		selectedObstacles.forEach((obstacle) => {
			const obstacleRect = {
				x: obstacle.x,
				y: obstacle.y,
				width: obstacle.width,
				height: obstacle.height,
			};
	
			const tankRect = {
				x: tank.x,
				y: tank.y,
				width: tank.width,
				height: tank.height,
			};
	
			if (checkCollision(tankRect, obstacleRect)) {
				console.log("Tank collided with an obstacle! Game over.");
				app.stage.removeChild(tank);
				cleanupGame(app, tank, selectedEnemies);
				return;
			}
		});
	
		// Check Tank-Enemy Collisions
		selectedEnemies.forEach((enemy) => {
			if (enemy.sprite) {
				const enemyRect = {
					x: enemy.sprite.x,
					y: enemy.sprite.y,
					width: enemy.sprite.width,
					height: enemy.sprite.height,
				};
	
				const tankRect = {
					x: tank.x,
					y: tank.y,
					width: tank.width,
					height: tank.height,
				};
	
				if (checkCollision(tankRect, enemyRect)) {
					console.log("Collision with enemy tank! Game over.");
					app.stage.removeChild(tank);
					cleanupGame(app, tank, selectedEnemies);
					return;
				}
	
				// Enemy Shooting Logic
				const enemyShootCooldown = 500;
				const shootDistance = 1000;
				const distance = Math.sqrt(
					(enemy.sprite.x - tank.x) ** 2 + (enemy.sprite.y - tank.y) ** 2
				);
	
				if (distance < shootDistance) {
					shoot(app, enemy, bullets, enemyShootCooldown);
				}
			}
		});
	});
	
}
function cleanupGame (app,tank,selectedEnemies){
	resetTankPosition(tank, app);
	clearEnemies(app,selectedEnemies);
	cleanupInput(app);
	endGame(app); 
}
function clearEnemies(app, enemies) {
    enemies.forEach((enemy) => {
        if (enemy.sprite) {
            app.stage.removeChild(enemy.sprite);
            enemy.sprite.destroy(); // Destroy PIXI resources
        }
    });
    enemies.length = 0; // Clear the array
}


function checkBulletCollision(bullet, tank) {
    const bulletRect = {
        x: bullet.x,
        y: bullet.y,
        width: bullet.width,
        height: bullet.height,
    };

    const tankRect = {
        x: tank.x,
        y: tank.y,
        width: tank.width,
        height: tank.height,
    };

    return checkCollision(bulletRect, tankRect);
}

function resetTankPosition(tank, app) {
    tank.x = app.screen.width / 2;
    tank.y = app.screen.height / 2;
}


function endGame(app) {
	showGameOverScreen(app, () => restartGame(app));
}

function restartGame(app) {
	console.log("Game restarting...");

    app.stage.removeChildren();
	
	const backgroundTexture = Assets.get("graphics/background/test.png");
    const background = new TilingSprite({
        texture: backgroundTexture,
        width: app.screen.width,
        height: app.screen.height,
    });
    background.width = app.screen.width;
    background.height = app.screen.height;
    app.stage.addChild(background); 

	startGame(app);
}

async function loadObstacles() {
	const response = await fetch("/data/obstacles.json");
	const data = await response.json();
	return data.obstacles;
}

async function loadDifficulty() {
	const response = await fetch("/data/difficulty.json");
	const data = await response.json();
	return data.difficulty;
}

function checkCollision(rect1, rect2) {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
}

function updateObstaclesRotation(obstacles) {
	obstacles.forEach((obstacle) => {
		if (obstacle.sprite) {
			obstacle.sprite.rotation += 0.02;
		}
	});
}

async function loadEnemyTanks() {
	const response = await fetch("/data/enemyTanks.json");
	const data = await response.json();
	return data.enemyTanks;
}

function getRandomItems(items, count) {
	const shuffled = items.sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

async function renderEntities(app, entities, options = {}) {
	for (const entity of entities) {
		try {
			const texture = await Assets.load(entity.image);
			const sprite = new Sprite(texture);

			sprite.x = entity.x;
			sprite.y = entity.y;
			sprite.width = entity.width;
			sprite.height = entity.height;
			sprite.anchor.set(0.5, 0.5);
			
			if (options.randomRotation) {
				sprite.rotation = Math.random() * Math.PI * 2;
			} else if (entity.direction !== undefined) {
				sprite.rotation = (entity.direction * Math.PI) / 180;
			}

			app.stage.addChild(sprite);
			entity.sprite = sprite;

			entity.lastShotTime = 0;
		} catch (error) {
			console.error("Error rendering entity:", error, entity);
		}
	}
}

function shoot(app, enemy, bullets, cooldown) {
    const currentTime = Date.now(); 

    if (currentTime - enemy.lastShotTime < cooldown) {
        return;
    }
    const bullet = new Bullet(
        app,       
        enemy.sprite.x,  
        enemy.sprite.y,  
        enemy.sprite.rotation,
        1
    );
    bullet.sprite.width = 10;
    bullet.sprite.height = 10;
    bullets.push(bullet);
    enemy.lastShotTime = currentTime;
}

const appPromise = initPixiApp();
export { appPromise, config };