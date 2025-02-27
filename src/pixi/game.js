import {
	Application,
	Assets,
	AnimatedSprite,
	TilingSprite,
	Sprite,
	Text,
	TextStyle,
} from "pixi.js";
import { createTank } from "./tank";
import { setupInput, cleanupInput } from "./input";
import { createStartScreen } from "./startScreen";
import { showGameOverScreen } from "./gameOverScreen";
import { Bullet } from "./bullet";
import { displayCongratulations } from "./congratulationsScreen";
import { displayFinish } from "./finishGameScreen";
import { setupPhoneInput , cleanupPhoneInput} from "./phoneInput";
import { setupFullScreen } from "./fullscreen";
import { sounds } from "./soundManager";

let currentLevel = 1;
let hit = 0;
let deathCount = 0;

let activeExplosions = []; // Array to store active explosions
const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);
const config = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0xffffff,
};

function saveProgress(level) {
	localStorage.setItem("currentLevel", level);
	console.log(`Progress saved: Level ${level}`);
}
function saveDeathProgress(deathCount) {
	localStorage.setItem("deathCount", deathCount);
	console.log(`Progress saved: deathCount ${deathCount}`);
}

function loadLevelProgress() {
	const savedLevel = localStorage.getItem("currentLevel")
	if (savedLevel) {
		console.log(`Progress loaded: Level ${savedLevel}`);
		return parseInt(savedLevel, 10);
	} else {
		console.log("No saved progress found. Starting from Level 1");
		return 1; // Default to level 1 if no saved progress exists
	}
}

function loadDeathProgress() {
	const savedDeathCount = localStorage.getItem("deathCount");

	if (savedDeathCount) {
		console.log(`Progress loaded: DeathCount ${savedDeathCount}`);
		return parseInt(savedDeathCount);
	} else {
		console.log("No saved progress found. Starting from DeathCount 1");
		return 0; // Default to DeathCount 1 if no saved progress exists
	}
}

async function initPixiApp() {
	deathCount = loadDeathProgress();
	sounds.music.play();
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

	if (isMobile){
		setupFullScreen(app);
	}
	return app;
}

async function addExplosionEffect(app, x, y, string) {
	console.log(`Creating explosion at (${x}, ${y})`);
	const explosionFrames = [];
	for (let i = 1; i <= 6; i++) {
			const texture = await Assets.load(
					`graphics/explosions/${string}${i}.png`
			);
			explosionFrames.push(texture);
	}

	const explosion = new AnimatedSprite(explosionFrames);
	explosion.x = x;
	explosion.y = y;
	explosion.width = 30;
	explosion.height = 30;
	explosion.anchor.set(0.5, 0.5);
	explosion.animationSpeed = 0.3;
	explosion.loop = false;

	app.stage.addChild(explosion);
	explosion.play();

	activeExplosions.push(explosion);

	explosion.onComplete = () => {
			console.log(`Removing explosion at (${x}, ${y})`);
			app.stage.removeChild(explosion);
			explosion.destroy();

			const index = activeExplosions.indexOf(explosion);
			if (index !== -1) {
					activeExplosions.splice(index, 1);
			}
	};
}


async function startGame(app) {
	currentLevel = loadLevelProgress();
	console.log(`Starting game at Level ${currentLevel}`);
	
	let text = displayDeathCount(app, 0);

	let hintText = null;
	if (currentLevel === 1) {
		hintText = displayHint(app);
	}

	displayLevel(app);

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
	

	app.ticker.start();

	const difficulty = await loadDifficulty();
	let bullets = [];

	await Assets.load("graphics/bullets/bullet.png");
	
	let numberOfObstacles = difficulty[currentLevel - 1].obstacleCount;
	if(isMobile){
		numberOfObstacles =currentLevel *3;
	}
	let selectedObstacles = generateNonOverlappingObstacles(
		obstacles,
		tank,
		numberOfObstacles
	);
	renderEntities(app, selectedObstacles, { randomRotation: true });
	let selectedEnemies;
	const { enemyTanks, enemyTanksCount } = await loadEnemyTanks(currentLevel);
	if (isMobile){
		selectedEnemies = generateNonOverlappingEnemyTanks(
			enemyTanks,
			tank,
			selectedObstacles,
			enemyTanksCount-currentLevel*2
		);
	}
	else{
		selectedEnemies = generateNonOverlappingEnemyTanks(
			enemyTanks,
			tank,
			selectedObstacles,
			enemyTanksCount
		);
	}
	renderEntities(app, selectedEnemies);
	
	if (isMobile){
		setupPhoneInput(app, tank, bullets);
	}
	else{
		setupInput(app, tank, bullets);
	}
	

	app.ticker.add(() => {
		

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
					cleanupGame(app, tank, selectedEnemies, selectedObstacles);
					clearText(app,text)
					deathCount++;
					saveDeathProgress(deathCount);
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
						sounds.explosion.play();
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
			if(isMobile){
				if (hit === enemyTanksCount-currentLevel*2) {
					hit = 0;
					console.log("All enemies defeated!");
					app.stage.removeChild(tank);
					resetTankPosition(tank, app);
					clearEnemies(app, selectedEnemies);
					if(isMobile){
						cleanupPhoneInput(app);
					}
					cleanupInput(app);
					if(currentLevel == 1){
						clearText(app, hintText);
					}
	
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
			else{
				if (hit === enemyTanksCount) {
					hit = 0;
					console.log("All enemies defeated!");
					app.stage.removeChild(tank);
					resetTankPosition(tank, app);
					clearEnemies(app, selectedEnemies);
					if(isMobile){
						cleanupPhoneInput(app);
					}
					cleanupInput(app);
					if(currentLevel == 1){
						clearText(app, hintText);
					}
	
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
				cleanupGame(app, tank, selectedEnemies, selectedObstacles);
				clearText(app,text)
				deathCount++
				saveDeathProgress(deathCount);
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
					cleanupGame(app, tank, selectedEnemies, selectedObstacles);
					clearText(app,text)
					deathCount++;
					saveDeathProgress(deathCount);
					return;
				}

				let enemyShootCooldown = 500;

				// Enemy Shooting Logic
				if(isMobile){
					enemyShootCooldown = 2500;
				}
			
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
function displayLevel(app) {
	const style = new TextStyle({
			fontSize: 34,
			fill: "white",
			align: "center",
			fontFamily: "PixelifySans",
	});

	// Set the hint text based on the device
	const levelTextContent = `Level: ${currentLevel}`
	

	const levelText = new Text({
	text: levelTextContent, 
	style: style
});
		// levelText.x = app.screen.width / 2 - levelText.width / 2; // Center the text horizontally
    // levelText.y = app.screen.height / 2 - levelText.height / 2; // Center the text vertically
		levelText.x = 10; // 10px padding from the right edge
		levelText.y = 10; // 10px padding from the top edge
    app.stage.addChild(levelText);

    return levelText; // Return the text object to be able to remove it later
}

export function displayDeathCount(app, gameOverScreen) {
	const style = new TextStyle({
			fontSize: 34,
			fill: "yellow",
			align: "center",
			fontFamily: "PixelifySans",
	});

	// Set the hint text based on the device
	let deathCountTextContent; 

	if (gameOverScreen){
		deathCountTextContent = `Deaths: ${deathCount+1}`
	}
	else{
		deathCountTextContent = `Deaths: ${deathCount}`
	}

	const deathCountText = new Text({
	text: deathCountTextContent, 
	style: style
});
		deathCountText.x = app.screen.width - deathCountText.width - 10; // 10px padding from the right edge
		deathCountText.y = 10; // 10px padding from the top edge
// Center the text horizontally
    // deathCountText.y = app.screen.height / 2 - deathCountText.height / 2; // Center the text vertically
    app.stage.addChild(deathCountText);

    return deathCountText; // Return the text object to be able to remove it later
}

function displayHint(app) {
    const style = new TextStyle({
        fontSize: 24,
        fill: "white",
        align: "center",
        fontFamily: "PixelifySans",
        wordWrap: true,
        wordWrapWidth: app.screen.width - 40, // Wrap text if it's too long
    });

    // Detect if the user is on a mobile device
    const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);

    // Set the hint text based on the device
    const hintTextContent = isMobile
        ? "Use joystick + tap the right button for shooting\n\nYour goal? Destroy all the enemy tanks!"
        : "You can play using:\n- Arrow keys to move + Space to shoot\n- Mouse movement to move + LMB to shoot\n\nYour goal? Destroy all the enemy tanks!";

    const hintText = new Text({
		text: hintTextContent, 
		style: style
	});

    hintText.x = app.screen.width / 2 - hintText.width / 2; // Center the text horizontally
    hintText.y = app.screen.height / 2 - hintText.height / 2; // Center the text vertically
    app.stage.addChild(hintText);

    return hintText; // Return the text object to be able to remove it later
}

function clearText(app, hint) {
	if (hint) {
		app.stage.removeChild(hint);
		hint.destroy();
	}
}
function removeExplosions(app){
	activeExplosions.forEach((explosion) => {
		app.stage.removeChild(explosion);
		explosion.destroy(); // Clean up resources
	});
}
function cleanupGame(app, tank, selectedEnemies,selectedObstacles) {
	hit = 0;
	resetTankPosition(tank, app);
	clearEnemies(app, selectedEnemies);
	clearEnemies(app,selectedObstacles);
	removeExplosions(app);
	if(isMobile){
		cleanupPhoneInput(app);
	}
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
	localStorage.removeItem('deathCount');
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
                ) ||
                isOutOfScreenBounds(obstacle)) && // Ensure obstacle stays within bounds
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


function generateNonOverlappingEnemyTanks(enemyTanks, tank, obstacles, count) {
    const nonOverlappingTanks = [];
    const maxAttempts = 100; // Safeguard to prevent infinite loops
    const axisBuffer = 50; // Buffer to prevent close placement on the same axis

    const selectedTanks = getRandomItems(enemyTanks, count); // Get a random set of enemy tanks

    selectedTanks.forEach((enemyTank) => {
        let attempts = 0;

        // Check for collision and reposition until no collision or max attempts reached
        while (
            (isPositionColliding(enemyTank, tank) || // Collision with player tank
                nonOverlappingTanks.some((existingTank) =>
                    isPositionColliding(enemyTank, existingTank)
                ) || // Collision with other enemy tanks
                obstacles.some((obstacle) =>
                    isPositionColliding(enemyTank, obstacle)
                ) || // Collision with obstacles
                isOutOfScreenBounds(enemyTank) || // Ensure enemy tank stays within bounds
                isOnSameAxis(enemyTank, tank, axisBuffer)) && // Ensure enemy tank isn't on the same axis
            attempts < maxAttempts
        ) {
            enemyTank.x = Math.random() * (config.width - enemyTank.width);
            enemyTank.y = Math.random() * (config.height - enemyTank.height);
            attempts++;
        }

        if (attempts < maxAttempts) {
            nonOverlappingTanks.push(enemyTank);
        } else {
            console.warn(
                "Failed to place enemy tank without overlap after max attempts."
            );
        }
    });
    return nonOverlappingTanks;
}

// Helper function to check if an obstacle is out of screen bounds
function isOutOfScreenBounds(obstacle) {
    return (
        obstacle.x < 0 ||
        obstacle.y < 0 ||
        obstacle.x + obstacle.width > config.width ||
        obstacle.y + obstacle.height > config.height
    );
}

// Helper function to check if the obstacle is on the same axis as the tank
function isOnSameAxis(obstacle, tank, buffer) {
    return (
        Math.abs(obstacle.x - tank.x) < buffer || 
        Math.abs(obstacle.y - tank.y) < buffer
    );
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
