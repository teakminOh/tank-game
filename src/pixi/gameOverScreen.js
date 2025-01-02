import { Text, TextStyle, Container } from "pixi.js";

// Function to show the Game Over screen
export function showGameOverScreen(app, restartCallback) {
    app.ticker.stop();

    // Create a container for the Game Over screen
    const gameOverContainer = new Container();

    // Define the style for the Game Over text
    const style = new TextStyle({
        fontSize: 50,
        fill: 0xff0000,
        fontFamily: 'PixelifySans',
    });

    // Create the Game Over text
    const gameOverText = new Text({
        text: "Game Over",
        style: style,
    });

    // Add the text to the container
    gameOverContainer.addChild(gameOverText);

    // Create the Restart button and add it to the container
    const restartButton = createRestartButton(restartCallback);
    gameOverContainer.addChild(restartButton);

    // Position the elements within the container
    gameOverText.x = -gameOverText.width / 2; // Center horizontally
    gameOverText.y = -gameOverText.height; // Position above the center

    restartButton.x = -restartButton.width / 2; // Center horizontally
    restartButton.y = 10; // Add some spacing below the Game Over text

    // Position the container in the center of the screen
    gameOverContainer.x = app.screen.width / 2;
    gameOverContainer.y = app.screen.height / 2;

    // Add the container to the stage
    app.stage.addChild(gameOverContainer);
}

// Function to create the Restart button
function createRestartButton(restartCallback) {
    // Define the style for the Restart button text
    const style = new TextStyle({
        fontSize: 30,
        fontFamily: 'PixelifySans',
        align: "center",
    });

    // Create the Restart button text
    const buttonText = new Text({
        text: "Restart",
        style: style,
    });

    // Make the Restart button interactive
    buttonText.interactive = true;
    buttonText.buttonMode = true;

    buttonText.on("pointerdown", () => {
        restartCallback();
    });

    return buttonText;
}
