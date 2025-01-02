import { Text } from "pixi.js";

export function showGameOverScreen(app, restartCallback) {
	app.ticker.stop();

	const gameOverText = new Text("Game Over", {
		fontSize: 50,
		fill: 0xff0000,
		align: "center",
		fontFamily: "PixelifySans",
	});

	gameOverText.x = app.screen.width / 2 - gameOverText.width / 2;
	gameOverText.y = app.screen.height / 2 - gameOverText.height / 2;
	app.stage.addChild(gameOverText);

	createRestartButton(app, restartCallback);
}

function createRestartButton(app, restartCallback) {
    const buttonText = new Text("Restart", { 
        fontSize: 30, 
        fontFamily: 'PixelifySans', 
        fill: 0xffffff
    });

    buttonText.x = app.screen.width / 2 - buttonText.width / 2; 
    buttonText.y = app.screen.height / 2 + 40;

    app.stage.addChild(buttonText);

    buttonText.interactive = true;
    buttonText.buttonMode = true;
    buttonText.on("pointerdown", () => {
        console.log("Restart button clicked");
        restartCallback();
    });
}
