import { Application, Assets, TilingSprite,Sprite} from "pixi.js";
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

async function startGame(app) {
	app.ticker.start();

	await Assets.load("graphics/bullets/bullet.png");

	const tank = await createTank(app);
	const bullets = [];

	const obstacles = await loadObstacles();
	const difficulty = await loadDifficulty();

	const currentLevel = 1;
	const numberOfObstacles = difficulty[currentLevel].obstacleCount;
	const selectedObstacles = getRandomItems(obstacles, numberOfObstacles);
	renderEntities(app, selectedObstacles, { randomRotation: true });

	const enemyTanks = await loadEnemyTanks();
	const selectedEnemies = getRandomItems(enemyTanks, 3);
	renderEntities(app, selectedEnemies);

	let lastShotTime = 0;  // Čas posledného výstrelu
	const enemyShootCooldown = 10000;

	setupInput(app, tank, bullets);

	app.ticker.add(() => {
		// Aktualizuj rotáciu každej prekážky
		updateObstaclesRotation(selectedObstacles);

		for (let i = bullets.length - 1; i >= 0; i--) {
			if (!bullets[i].update()) {
				bullets.splice(i, 1);
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
				console.log("Collision detected! Game over.");
				app.stage.removeChild(tank);
				resetTankPosition(tank, app);
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
					cleanupInput(app);
					endGame(app);
				}
				const distance = Math.sqrt(
					(enemy.sprite.x - tank.x) ** 2 + (enemy.sprite.y - tank.y) ** 2
				);
				
				const shootDistance = 200;
				if (distance < shootDistance) {
					console.log('shoooting');
					shoot(app, enemy, bullets, lastShotTime, enemyShootCooldown);
				}
			}
		});
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
    const background =new TilingSprite({
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
		} catch (error) {
			console.error("Error rendering entity:", error, entity);
		}
	}
}

function shoot(app, enemy, bullets, lastShot, cooldown) {
	const currentTime = Date.now(); 
	if (currentTime - lastShot < cooldown) {
        return; // Ak cooldown ešte neuplynul, nevystrieľame
    }
    const bullet = new Bullet(
        app,        // Predáme aplikáciu
        enemy.sprite.x,   // Počiatočná pozícia strely
        enemy.sprite.y,   // Počiatočná pozícia strely
        enemy.sprite.rotation  // Rotácia strely podľa rotácie nepriateľského tanku
    );
    bullets.push(bullet);
	lastShot = currentTime;
}

const appPromise = initPixiApp();
export { appPromise, config };