import { Application, Assets, TilingSprite,Sprite} from "pixi.js";
import { createTank } from "./tank";
import { setupInput } from "./input";
import { createStartScreen } from "./startScreen";
import { showGameOverScreen } from "./gameOverScreen";

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
	const selectedObstacles = getRandomObstacles(obstacles, numberOfObstacles);

	renderObstacles(app, selectedObstacles);
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
				endGame(app);
			}
		});
	});
}

function resetTankPosition(tank, app) {
    tank.x = app.renderer.width / 2;
    tank.y = app.renderer.height / 2;
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
    background.width = config.width;
    background.height = config.height;
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

function getRandomObstacles(obstacles, count) {
	const shuffled = obstacles.sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

async function renderObstacles(app, obstacles) {
	for (const obstacle of obstacles) {
		try {
			const texture = await Assets.load(obstacle.image);
			const sprite = new Sprite(texture);

			sprite.x = obstacle.x;
			sprite.y = obstacle.y;
			sprite.width = obstacle.width;
			sprite.height = obstacle.height;
			sprite.anchor.set(0.5, 0.5);
			sprite.rotation = Math.random() * Math.PI * 2;

			app.stage.addChild(sprite);
			obstacle.sprite = sprite;
		} catch (error) {
			console.error("Error rendering obstacle:", error, obstacle);
		}
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
	obstacles.forEach(obstacle => {
		if (obstacle.sprite) {
			// Zvyšuj rotáciu každým tickom
			obstacle.sprite.rotation += 0.02;
		}
	});
}

const appPromise = initPixiApp();
export { appPromise, config };