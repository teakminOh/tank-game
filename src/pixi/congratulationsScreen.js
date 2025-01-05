import { Text, TextStyle, Container } from "pixi.js";
let handleKeydown, resizeHandler;

export function displayCongratulations(app,nextLevelCallback, currentLevel) {
    const gameOverScreen = new Container();

    // Stop the ticker
    app.ticker.stop();

    const style = new TextStyle({
        fontSize: 40,
        fill: 0xffffff,
        align: "center",
        fontFamily: "PixelifySans",
    });

    const levelText = new Text({
        text: "Congratulations!",
        style: style,
    });

    const levelStyle = new TextStyle({
        fontSize: 40,
        fill: 0x00ff00,
        align: "center",
        fontFamily: "PixelifySans",
    });

    const gameOverText = new Text({
        text: `Level ${currentLevel} Completed`,
        style: levelStyle,
    });

    levelText.anchor.set(0.5);
    levelText.x = app.screen.width / 2;
    levelText.y = app.screen.height / 2-60;

    gameOverText.anchor.set(0.5);
    gameOverText.x = app.screen.width / 2;
    gameOverText.y = app.screen.height / 2;

    gameOverScreen.addChild(gameOverText);
    gameOverScreen.addChild(levelText)

    createRestartButton(app, nextLevelCallback, gameOverScreen, gameOverText, levelText, currentLevel);

    // Define the keydown handler
    handleKeydown = (event) => {
        if (event.code === "Space") {
            console.log("Space pressed for restart");
            cleanup(); // Remove event listeners
            nextLevelCallback(); // Restart the game
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

function createRestartButton(app, nextLevelCallback, gameOverScreen, gameOverText, levelText, currentLevel) {
    const style = new TextStyle({
        fontSize: 30,
        fontFamily: "PixelifySans",
        fill: 0xffffff,
    });

    const buttonText = new Text({
        text: `Go to Level ${currentLevel + 1}`,
        style: style,
    });

    buttonText.anchor.set(0.5);
    buttonText.x = app.screen.width / 2;
    buttonText.y = app.screen.height / 2 + 60;

    gameOverScreen.addChild(buttonText);

    buttonText.interactive = true;
    buttonText.buttonMode = true;
    buttonText.on("pointerdown", () => {
        console.log("Next level button clicked");
        if (app.cleanupGameOverScreen) {
            app.cleanupGameOverScreen(); // Ensure cleanup is called
        }
        nextLevelCallback();
    });

    app.stage.addChild(gameOverScreen);

    // Define resize handler
    resizeHandler = () => {
        gameOverText.x = app.screen.width / 2;
        gameOverText.y = app.screen.height / 2-60;
        
        levelText.x = app.screen.width / 2;
        levelText.y = app.screen.height / 2;

        buttonText.x = app.screen.width / 2;
        buttonText.y = app.screen.height / 2+60;
        app.render();
    };

    // Attach resize event listener
    window.addEventListener("resize", resizeHandler);
}
