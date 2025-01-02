// gameOverScreen.js
import { Text, TextStyle } from "pixi.js";

// Funkcia na zobrazenie obrazovky Game Over
export function showGameOverScreen(app, restartCallback) {
    app.ticker.stop();


    const style = new TextStyle({
        fontSize: 50,
        fill: 0xff0000,
        fontFamily: 'PixelifySans',
    })
    const gameOverText = new Text({
        text: "Game Over",
        style: style
    })
    // Nastav pozíciu textu
    gameOverText.x = app.screen.width / 2 - gameOverText.width / 2;
    gameOverText.y = app.screen.height / 2 - gameOverText.height / 2;
    app.stage.addChild(gameOverText);

    // Vytvor tlačidlo na reštartovanie
    createRestartButton(app, restartCallback, gameOverText);
}

// Funkcia na vytvorenie tlačidla pre reštart
function createRestartButton(app, restartCallback, gameOverText) {
    const style = new TextStyle({
        fontSize:30,
        fontFamily:'PixelifySans',
        align:"center",
    })
    const buttonText = new Text({
        text: "Restart",
        style: style,
    });
    buttonText.x = app.screen.width / 2 - buttonText.width / 2;
    buttonText.y = app.screen.height / 2 - buttonText.height / 2 + gameOverText.height+5;
    buttonText.interactive = true;
    buttonText.buttonMode = true;
    buttonText.on("pointerdown", () => {
        restartCallback();
    });
    app.stage.addChild(buttonText);


}
