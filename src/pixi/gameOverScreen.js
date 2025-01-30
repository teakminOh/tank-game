import { Text, TextStyle, Container } from "pixi.js";
import { displayDeathCount } from "./game";
let handleKeydown, resizeHandler;

export function showGameOverScreen(app, restartCallback) {
    const gameOverScreen = new Container();

    // Stop the ticker
    app.ticker.stop();
    displayDeathCount(app, 1);

    const style = new TextStyle({
        fontSize: 50,
        fill: 0xff0000,
        align: "center",
        fontFamily: "PixelifySans",
    });

    const gameOverText = new Text({
        text: "Game Over",
        style: style,
    });

    gameOverText.anchor.set(0.5);
    gameOverText.x = app.screen.width / 2;
    gameOverText.y = app.screen.height / 2;

    gameOverScreen.addChild(gameOverText);

    createRestartButton(app, restartCallback, gameOverScreen, gameOverText);

    // Define the keydown handler
    handleKeydown = (event) => {
        if (event.code === "Space") {
            console.log("Space pressed for restart");
            cleanup(); // Remove event listeners
            restartCallback(); // Restart the game
        }
    };

    // Attach the event listener
    window.addEventListener("keydown", handleKeydown);

    // Cleanup function to remove event listeners
    const cleanup = () => {
        if (handleKeydown) {
            window.removeEventListener("keydown", handleKeydown);
            handleKeydown = null;
        }
        if (resizeHandler) {
            window.removeEventListener("resize", resizeHandler);
            resizeHandler = null;
        }
    };

    // Attach cleanup to the app for global access
    app.cleanupGameOverScreen = cleanup;

    
}

function createRestartButton(app, restartCallback, gameOverScreen, gameOverText) {
    const style = new TextStyle({
        fontSize: 30,
        fontFamily: "PixelifySans",
        fill: 0xffffff,
    });

    const buttonText = new Text({
        text: "Restart",
        style: style,
    });

    buttonText.anchor.set(0.5);
    buttonText.x = app.screen.width / 2;
    buttonText.y = app.screen.height / 2 + 60;

    gameOverScreen.addChild(buttonText);

    buttonText.interactive = true;
    buttonText.buttonMode = true;
    buttonText.on("pointerdown", () => {
        console.log("Restart button clicked");
        if (app.cleanupGameOverScreen) {
            app.cleanupGameOverScreen(); // Ensure cleanup is called
        }
        restartCallback();
    });

    app.stage.addChild(gameOverScreen);

    // Define resize handler
    resizeHandler = () => {
        gameOverText.x = app.screen.width / 2;
        gameOverText.y = app.screen.height / 2;

        buttonText.x = app.screen.width / 2;
        buttonText.y = app.screen.height / 2 + 60;
        app.render();
    };

    // Attach resize event listener
    window.addEventListener("resize", resizeHandler);
}
