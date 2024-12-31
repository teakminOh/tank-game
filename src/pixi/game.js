import { Application, Assets, TilingSprite} from "pixi.js";
import { createTank } from "./tank";
import { setupInput } from "./input";
import { createStartScreen } from './startScreen';

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

	await Assets.load("graphics/bullets/bullet.png");

	const tank = await createTank(app);
	const bullets = [];

	setupInput(app, tank, bullets);

	app.ticker.add(() => {
		for (let i = bullets.length - 1; i >= 0; i--) {
			if (!bullets[i].update()) {
				bullets.splice(i, 1);
			}
		}
	});
}

const appPromise = initPixiApp();
export { appPromise, config };
