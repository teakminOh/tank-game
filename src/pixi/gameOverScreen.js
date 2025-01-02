// gameOverScreen.js
import { Text, Graphics } from "pixi.js";

// Funkcia na zobrazenie obrazovky Game Over
export function showGameOverScreen(app, restartCallback) {
    app.ticker.stop();

    const gameOverText = new Text("Game Over", {
        fontSize: 50,
        fill: 0xff0000,
        align: "center",
        fontFamily: 'PixelifySans',
    });

    // Nastav pozíciu textu
    gameOverText.x = app.screen.width / 2 - gameOverText.width / 2;
    gameOverText.y = app.screen.height / 2 - gameOverText.height / 2;
    app.stage.addChild(gameOverText);

    // Vytvor tlačidlo na reštartovanie
    createRestartButton(app, restartCallback);
}

// Funkcia na vytvorenie tlačidla pre reštart
function createRestartButton(app, restartCallback) {
    const button = new Graphics();
    button.beginFill(0x00ff00); // Zelené tlačidlo
    button.drawRect(0, 0, 200, 50); // Rozmery tlačidla
    button.endFill();
    button.x = app.screen.width / 2 - 100;
    button.y = app.screen.height / 2 + 60;

    const buttonText = new Text("Restart", { fontSize: 30, fontFamily: 'PixelifySans', });
    buttonText.x = button.x + 50;
    buttonText.y = button.y + 10;

    app.stage.addChild(button);
    app.stage.addChild(buttonText);

    button.interactive = true;
    button.buttonMode = true;
    button.on("pointerdown", () => {
        restartCallback(); // Voláme funkciu pre reštart hry
    });
}
