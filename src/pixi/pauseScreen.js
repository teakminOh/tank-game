import { Text, TextStyle, Container } from "pixi.js";

let handleKeydown, resizeHandler;

export function displayPauseScreen(app, resumeCallback) {
    const pauseScreen = new Container();

    const style = new TextStyle({
        fontSize: 50,
        fill: 0xffffff,
        align: "center",
        fontFamily: "PixelifySans",
    });

    const pauseText = new Text({
        text: "Game Paused",
        style: style,
    });

    pauseText.anchor.set(0.5);
    pauseText.x = app.screen.width / 2;
    pauseText.y = app.screen.height / 2 - 60;

    pauseScreen.addChild(pauseText);
    createResumeButton(app, pauseScreen, resumeCallback);
    
    // Stop the game ticker to pause the game
    app.ticker.stop();

    // Add pause screen to the stage and immediately render it
    app.stage.addChild(pauseScreen);
    app.render(); // Force immediate rendering

    // Define the keydown handler for resuming the game
    handleKeydown = (event) => {
        if (event.code === "Escape") {
            console.log("Escape pressed to resume");
            cleanup(); // Remove event listeners
            resumeCallback(); // Resume the game
        }
    };

    // Attach the event listener for keydown
    window.addEventListener("keydown", handleKeydown);

    // Cleanup function to remove event listeners and UI
    const cleanup = () => {
        if (handleKeydown) {
            window.removeEventListener("keydown", handleKeydown);
            handleKeydown = null;
        }
        if (resizeHandler) {
            window.removeEventListener("resize", resizeHandler);
            resizeHandler = null;
        }
        app.stage.removeChild(pauseScreen); // Remove pause screen
        pauseScreen.destroy(); // Destroy PIXI resources
    };

    // Attach cleanup to the app for global access
    app.cleanupPauseScreen = cleanup;

    // Define resize handler
    resizeHandler = () => {
        pauseText.x = app.screen.width / 2;
        pauseText.y = app.screen.height / 2 - 60;

        app.render();
    };

    // Attach resize event listener
    window.addEventListener("resize", resizeHandler);
}

function createResumeButton(app, pauseScreen, resumeCallback) {
    const buttonStyle = new TextStyle({
        fontSize: 30,
        fontFamily: "PixelifySans",
        fill: 0xffffff,
    });
    
    const resumeButton = new Text({
        text: "Resume",
        style: buttonStyle,
    });

    // Positioning the button
    resumeButton.anchor.set(0.5);
    resumeButton.x = app.screen.width / 2;
    resumeButton.y = app.screen.height / 2 + 20;

    // Add the resume button to the pause screen
    pauseScreen.addChild(resumeButton);

    // Make the button interactive
    resumeButton.interactive = true;
    resumeButton.buttonMode = true;
    resumeButton.on("pointerdown", () => {
        console.log("Resume button clicked");
        if (app.cleanupPauseScreen) {
            app.cleanupPauseScreen(); // Ensure cleanup is called
        }
        resumeCallback();
    });
}
