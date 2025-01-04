import {
	Application,
	Assets,
	AnimatedSprite,
	TilingSprite,
	Sprite,
	Text,
} from "pixi.js";
import { createTank } from "./tank";
import { setupInput, cleanupInput } from "./input";
import { createStartScreen } from "./startScreen";
import { showGameOverScreen } from "./gameOverScreen";
import { Bullet } from "./bullet";
import { displayCongratulations } from "./congratulationsScreen";
import { displayFinish } from "./finishGameScreen";
import { displayPauseScreen } from "./pauseScreen";

let currentLevel = 1;
let hit = 0;

const config = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0xffffff,
};

function saveProgress(level) {
	localStorage.setItem("currentLevel", level);
	console.log(`Progress saved: Level ${level}`);
}

function loadProgress() {
	const savedLevel = localStorage.getItem("currentLevel");
	if (savedLevel) {
		console.log(`Progress loaded: Level ${savedLevel}`);
		return parseInt(savedLevel, 10);
	} else {
		console.log("No saved progress found. Starting from Level 1");
		return 1; // Default to level 1 if no saved progress exists
	}
}

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

async function addExplosionEffect(app, x, y, string) {
	// Load explosion textures
	const explosionFrames = [];
	for (let i = 1; i <= 6; i++) {
		const texture = await Assets.load(
			`graphics/explosions/${string}${i}.png`
		);
		explosionFrames.push(texture);
	}

	// Create an animated sprite
	const explosion = new AnimatedSprite(explosionFrames);
	explosion.x = x;
	explosion.y = y;
	explosion.width = 30;
	explosion.height = 30;
	explosion.anchor.set(0.5, 0.5);
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
	// Display hint when level is 1
	currentLevel = loadProgress();
	console.log(`Starting game at Level ${currentLevel}`);

	let hintText = null;
	if (currentLevel === 1) {
		hintText = displayHint(app);
	}

	const tank = await createTank(app);
	const obstacles = await loadObstacles();

	/* 	const { enemyTanks, surroundedEnemyTanks } = await loadEnemyTanks(currentLevel);
	
	const selectedEnemyTanks = generateNonOverlappingObstacles(enemyTanks, tank, currentLevel); // Select 5 from enemyTanks.json
	const selectedSurroundedEnemyTanks =  generateNonOverlappingObstacles(surroundedEnemyTanks, tank, 1);
	selectedSurroundedEnemyTanks.forEach((tank) => {
		createSurroundedObstaclesForTank(tank, obstacles);
		});
	const selectedEnemies = [
		...selectedEnemyTanks,
		...selectedSurroundedEnemyTanks,
	renderEntities(app, selectedEnemies);
		]; 
*/
	const { enemyTanks, enemyTanksCount } = await loadEnemyTanks(currentLevel);
	const selectedEnemies = generateNonOverlappingObstacles(
		enemyTanks,
		tank,
		enemyTanksCount
	);
	renderEntities(app, selectedEnemies);

	app.ticker.start();

	const difficulty = await loadDifficulty();

	await Assets.load("graphics/bullets/bullet.png");
	let bullets = [];
	const numberOfObstacles = difficulty[currentLevel - 1].obstacleCount;
	const selectedObstacles = generateNonOverlappingObstacles(
		obstacles,
		tank,
		numberOfObstacles
	);
	renderEntities(app, selectedObstacles, { randomRotation: true });

	setupInput(app, tank, bullets);

	app.ticker.add(() => {
		// Listening for pause
		window.addEventListener("keydown", (event) => {
			if (event.code === "Escape") {
				if (app.ticker.started) {
					displayPauseScreen(app, () => {
						app.ticker.start(); // Resume the game
					});
				}
			}
		});

		// Rotate obstacles (if applicable)
		updateObstaclesRotation(selectedObstacles);

		for (let i = bullets.length - 1; i >= 0; i--) {
			const bullet = bullets[i];

			// Remove bullets that are off-screen
			if (!bullet.update()) {
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
					addExplosionEffect(app, bullet.x, bullet.y, "explosion");
					clearHint(app, hintText);
					app.stage.removeChild(bullet.sprite); // Remove bullet sprite
					bullets.splice(i, 1); // Remove bullet from array
					break; // Exit obstacle collision loop
				}
			}

			if (bullet.isEnemy) {
				// Enemy bullet hitting the player's tank
				if (checkBulletCollision(bullet, tank)) {
					console.log("Player hit by enemy bullet! Game over.");

					clearHint(app, hintText);

					app.stage.removeChild(tank);
					cleanupGame(app, tank, selectedEnemies);
					return; // Exit ticker
				}
			} else {
				// Player bullet hitting enemy tanks
				for (let j = selectedEnemies.length - 1; j >= 0; j--) {
					const enemy = selectedEnemies[j];
					if (
						enemy.sprite &&
						checkBulletCollision(bullet, enemy.sprite)
					) {
						hit++;
						console.log("Enemy tank destroyed by player's bullet!");

						const explosionX = enemy.sprite.x;
						const explosionY = enemy.sprite.y;

						addExplosionEffect(app, explosionX, explosionY, "e");
						app.stage.removeChild(enemy.sprite);
						selectedEnemies.splice(j, 1);

						app.stage.removeChild(bullet.sprite);
						bullets.splice(i, 1);
						break;
					}
				}
			}
			if (hit === enemyTanksCount) {
				hit = 0;
				console.log("All enemies defeated!");
				app.stage.removeChild(tank);
				resetTankPosition(tank, app);
				clearEnemies(app, selectedEnemies);
				cleanupInput(app);
				clearHint(app, hintText);

				if (currentLevel < 5) {
					saveProgress(currentLevel + 1);
					displayCongratulations(
						app,
						() => goToNextLevel(app),
						currentLevel
					);
				} else {
					console.log("Level 5 completed! Returning to Main Menu.");
					displayFinish(app, () => goToMainMenu(app));
				}

				app.ticker.stop(); // Stop the game loop
				return;
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
				clearHint(app, hintText);
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

function displayHint(app) {
	const hintText = new Text(
		"You can play using:\n- Arrow keys to move + Space to shoot\n- Mouse movement to move + LMB to shoot\n- Tilt your mobile device + tap to shoot\n\n Your goal? Destroy all the enemy tanks!",
		{
			fontSize: 24,
			fill: "white",
			align: "center",
			fontFamily: "PixelifySans",
			wordWrap: true,
			wordWrapWidth: app.screen.width - 40, // Wrap text if it's too long
		}
	);
	hintText.x = app.screen.width / 2 - hintText.width / 2; // Center the text horizontally
	hintText.y = app.screen.height / 2 + hintText.height; // Center the text vertically
	app.stage.addChild(hintText);
	return hintText; // Return the text object to be able to remove it later
}
function clearHint(app, hint) {
	if (hint) {
		app.stage.removeChild(hint);
		hint.destroy();
	}
}
function cleanupGame(app, tank, selectedEnemies) {
	hit = 0;
	resetTankPosition(tank, app);
	clearEnemies(app, selectedEnemies);
	cleanupInput(app);
	endGame(app);
}

function clearEnemies(app, enemies) {
	enemies.forEach((enemy) => {
		if (enemy.sprite) {
			app.stage.removeChild(enemy.sprite);
			enemy.sprite.destroy();
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

function isPositionColliding(obstacle, tank) {
	const obstacleRect = {
		x: obstacle.x - obstacle.width / 2,
		y: obstacle.y - obstacle.height / 2,
		width: obstacle.width,
		height: obstacle.height,
	};

	const tankRect = {
		x: tank.x - tank.width / 2,
		y: tank.y - tank.height / 2,
		width: tank.width * 3,
		height: tank.height * 3,
	};

	return checkCollision(obstacleRect, tankRect);
}
/* 
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
 */
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

function goToMainMenu(app) {
	console.log("Returning to Main Menu...");
	app.ticker.stop(); // Stop the game loop
	app.stage.removeChildren(); // Clear all children from the stage
	localStorage.removeItem('currentLevel');
	// Reload the site to reset everything
	window.location.reload();
}

function goToNextLevel(app) {
	currentLevel++;
	app.stage.removeChildren();
	const backgroundTexture = Assets.get("graphics/background/test.png");
	const background = new TilingSprite({
		texture: backgroundTexture,
		width: app.screen.width,
		height: app.screen.height,
	});
	background.width = app.screen.width;
	background.height = app.screen.height;
	app.stage.addChild(background); // Clear the stage
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

const distributeTanks = (enemyTanksCount) => {
	const tanksPerSide = Math.floor(enemyTanksCount / 3);
	const remainder = enemyTanksCount % 3;

	// Rovnomerné rozdelenie + pridanie zvyšku (ak existuje)
	return {
		left: tanksPerSide,
		center: tanksPerSide + (remainder > 0 ? 1 : 0),
		right: tanksPerSide + (remainder > 1 ? 1 : 0),
	};
};

async function loadEnemyTanks(level) {
	// Načítanie obtiažnosti
	const difficulty = await loadDifficulty();

	const difficultyLevel = difficulty.find((d) => d.level === level);
	if (!difficultyLevel) {
		throw new Error(`Level ${level} not found in difficulty settings.`);
	}
	const { enemyTanksCount } = difficultyLevel;

	/*
    // Načítanie obkľúčených nepriateľských tankov
     const surroundedEnemyTanksResponse = await fetch("data/surroundedEnemyTanks.json");
    const surroundedEnemyTanks = await surroundedEnemyTanksResponse.json();
 */

	// Rozdelenie tankov medzi strany
	const tankDistribution = distributeTanks(enemyTanksCount);

	// Načítanie tankov zo súborov
	const enemyTanksCenter = await fetch("data/enemyTanksCenter.json").then(
		(res) => res.json()
	);
	const enemyTanksLeft = await fetch("data/enemyTanksLeft.json").then((res) =>
		res.json()
	);
	const enemyTanksRight = await fetch("data/enemyTanksRight.json").then(
		(res) => res.json()
	);

	// Výber tankov pre každú stranu
	const selectedLeft = enemyTanksLeft.enemyTanksLeft.slice(
		0,
		tankDistribution.left
	);
	const selectedCenter = enemyTanksCenter.enemyTanksCenter.slice(
		0,
		tankDistribution.center
	);
	const selectedRight = enemyTanksRight.enemyTanksRight.slice(
		0,
		tankDistribution.right
	);

	// Spojenie vybraných tankov do jedného zoznamu
	const enemyTanks = [...selectedLeft, ...selectedCenter, ...selectedRight];

	return {
		enemyTanks, // Spojený zoznam tankov
		enemyTanksCount,
		//surroundedEnemyTanks: surroundedEnemyTanks.surroundedEnemyTanks,
	};
}

function generateNonOverlappingObstacles(obstacles, tank, count) {
	const nonOverlappingObstacles = [];
	const maxAttempts = 100; // Safeguard to prevent infinite loops

	const selectedObstacles = getRandomItems(obstacles, count); // Get a random set of obstacles

	selectedObstacles.forEach((obstacle) => {
		let attempts = 0;

		// Check for collision and reposition until no collision or max attempts reached
		while (
			(isPositionColliding(obstacle, tank) ||
				nonOverlappingObstacles.some((existing) =>
					isPositionColliding(obstacle, existing)
				)) &&
			attempts < maxAttempts
		) {
			obstacle.x = Math.random() * (config.width - obstacle.width);
			obstacle.y = Math.random() * (config.height - obstacle.height);
			attempts++;
		}

		if (attempts < maxAttempts) {
			nonOverlappingObstacles.push(obstacle);
		} else {
			console.warn(
				"Failed to place obstacle without overlap after max attempts."
			);
		}
	});
	return nonOverlappingObstacles;
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
