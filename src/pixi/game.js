import { Application, Assets, Sprite } from "pixi.js";
import { createTank } from "./tank";
import { setupInput } from "./input";

const config = {
	width: 800,
	height: 663,
	backgroundColor: 0x1099bb,
};

async function initPixiApp() {
	const app = new Application();
	await app.init(config);

	document.body.appendChild(app.canvas);

	const backgroundTexture = await Assets.load(
		"graphics/background/bg.png"
	);
	const background = new Sprite(backgroundTexture);
  background.width = config.width;
  background.height = config.height;

  app.stage.addChild(background);

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
	return app;
}

const appPromise = initPixiApp();
export { appPromise, config };
