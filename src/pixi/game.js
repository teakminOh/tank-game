import { Application, Assets, TilingSprite, Sprite } from "pixi.js";
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

	const backgroundTexture = await Assets.load("graphics/background/test.png");
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

async function startGame(app) {
	app.ticker.start();

	await Assets.load("graphics/bullets/bullet.png");

	const tank = await createTank(app);
	let bullets = [];

	const obstacles = await loadObstacles();
	const difficulty = await loadDifficulty();
	const currentLevel = 1;

	const { enemyTanks, surroundedEnemyTanks } = await loadEnemyTanks();

	const selectedEnemyTanks = getRandomItems(enemyTanks, 5); // Select 5 from enemyTanks.json
	const selectedSurroundedEnemyTanks = getRandomItems(
		surroundedEnemyTanks,
		3
	); // Select 3 from surroundedEnemyTanks.json
	//createSurroundedObstaclesForTank(selectedSurroundedEnemyTanks, obstacles);
	selectedSurroundedEnemyTanks.forEach((tank) => {
		createSurroundedObstaclesForTank(tank, obstacles);
	});
	// Combine selected tanks into one array
	const selectedEnemies = [
		...selectedEnemyTanks,
		...selectedSurroundedEnemyTanks,
	];
	console.log(obstacles);

	const numberOfObstacles = difficulty[currentLevel].obstacleCount;
	const selectedObstacles = getRandomItems(obstacles, numberOfObstacles);
	renderEntities(app, selectedObstacles, { randomRotation: true });

	//const selectedEnemies = getRandomItems(enemyTanks, 3);
	renderEntities(app, selectedEnemies);

	setupInput(app, tank, bullets);

	app.ticker.add(() => {
		updateObstaclesRotation(selectedObstacles);
		for (let i = bullets.length - 1; i >= 0; i--) {
			const bullet = bullets[i];
			if (!bullet.update()) {
				bullets.splice(i, 1);
			}

			if (bullet.isEnemy) {
				// Check if the enemy bullet hits the player's tank
				if (checkBulletCollision(bullet, tank)) {
					console.log("Player hit by enemy bullet! Game over.");
					createExplosionEffect(app, tank.x, tank.y);
					app.stage.removeChild(tank);
					resetTankPosition(tank, app);
					resetGameState(app, selectedEnemies, bullets);
					cleanupInput(app);
					endGame(app);
					return;
				}
			} else {
				// Check if the player's bullet hits any enemy tank
				for (let j = selectedEnemies.length - 1; j >= 0; j--) {
					const enemy = selectedEnemies[j];
					if (
						enemy.sprite &&
						checkBulletCollision(bullet, enemy.sprite)
					) {
						console.log("Enemy tank destroyed by player's bullet!");
						createExplosionEffect(
							app,
							enemy.sprite.x,
							enemy.sprite.y
						);
						app.stage.removeChild(enemy.sprite);
						selectedEnemies.splice(j, 1);

						app.stage.removeChild(bullet.sprite);
						bullets.splice(i, 1);

						break;
					}
				}
			}
		}

		// Kontrola kolízií
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
				createExplosionEffect(app, tank.x, tank.y);
				app.stage.removeChild(tank);
				resetTankPosition(tank, app);
				resetGameState(app, selectedEnemies, bullets);
				cleanupInput(app);
				endGame(app);
			}
		});
		selectedEnemies.forEach((enemy) => {
			if (enemy.sprite) {
				if (
					checkCollision(
						{
							x: enemy.sprite.x,
							y: enemy.sprite.y,
							width: enemy.sprite.width,
							height: enemy.sprite.height,
						},
						{
							x: tank.x,
							y: tank.y,
							width: tank.width,
							height: tank.height,
						}
					)
				) {
					console.log("Collision with enemy tank! Game over.");
					app.stage.removeChild(tank);
					resetTankPosition(tank, app);
					resetGameState(app, selectedEnemies, bullets);
					cleanupInput(app);
					endGame(app);
					return;
				}
				const enemyShootCooldown = 500;
				const shootDistance = 1000;
				const distance = Math.sqrt(
					(enemy.sprite.x - tank.x) ** 2 +
						(enemy.sprite.y - tank.y) ** 2
				);

				if (distance < shootDistance) {
					shoot(app, enemy, bullets, enemyShootCooldown);
				}
			}
		});
	});
}

function createSurroundedObstaclesForTank(tank, obstacles) {
	if (Array.isArray(tank.surrounded) && tank.surrounded.length > 0) {
		tank.surrounded.forEach((position) => {
			const newObstacle = {
				x: tank.x + position.x,
				y: tank.y + position.y,
				width: 40,
				height: 40,
				image: "graphics/obstacles/trap1.png",
			};
			obstacles.push(newObstacle);
		});
	}
}

function resetGameState(app, enemies, bullets) {
	enemies.forEach((enemy) => {
		if (enemy.sprite) {
			app.stage.removeChild(enemy.sprite);
			enemy.sprite = null;
		}
	});
	bullets.forEach((bullet) => {
		if (bullet.sprite) {
			app.stage.removeChild(bullet.sprite);
		}
	});
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

async function createExplosionEffect(app, x, y) {
	try {
		const explosionTexture = await Assets.load(
			"graphics/explosion/explosion.png"
		);
		const explosionSprite = new Sprite(explosionTexture);

		explosionSprite.x = x;
		explosionSprite.y = y;
		explosionSprite.anchor.set(0.5, 0.5);

		app.stage.addChild(explosionSprite);

		// Start the explosion at a smaller scale
		explosionSprite.scale.set(0.1);

		// Adjust the maximum scale for the explosion
		const scaleTween = app.ticker.add(() => {
			explosionSprite.scale.x += 0.01;
			explosionSprite.scale.y += 0.01;

			// Set the maximum scale to 1.5 (or 1.2, depending on your preference)
			if (explosionSprite.scale.x >= 0.4) {
				app.stage.removeChild(explosionSprite);
				app.ticker.remove(scaleTween);
			}
		});

		// Optionally, play a sound effect here for explosion
		// If you have a sound library, you can play a sound effect here as well.
	} catch (error) {
		console.error("Error creating explosion effect:", error);
	}
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
	const enemyTanksResponse = await fetch("data/enemyTanks.json");
	const surroundedEnemyTanksResponse = await fetch(
		"data/surroundedEnemyTanks.json"
	);
	const enemyTanks = await enemyTanksResponse.json();
	const surroundedEnemyTanks = await surroundedEnemyTanksResponse.json();

	return {
		enemyTanks: enemyTanks.enemyTanks,
		surroundedEnemyTanks: surroundedEnemyTanks.surroundedEnemyTanks,
	};
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
