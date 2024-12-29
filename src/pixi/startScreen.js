import { Container, Text } from 'pixi.js';


export function createStartScreen(app, onStart) {
    const startScreen = new Container();

    const title = new Text('Welcome to Tank Game!', {
        fontSize: 36,
        fill: 0xffffff,
        align: 'center',
    });
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 3;
    startScreen.addChild(title);

    const startButton = new Text('START GAME', {
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        background: 'white',
    });
    startButton.anchor.set(0.5);
    startButton.x = app.screen.width / 2;
    startButton.y = app.screen.height / 2;
    startScreen.addChild(startButton);

    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on('pointerdown', () => {
        app.stage.removeChild(startScreen); 
        onStart();
    });

    const controlsButton = new Text('CONTROLS', {
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        background: 'white',
    });
    controlsButton.anchor.set(0.5);
    controlsButton.x = app.screen.width / 2;
    controlsButton.y = app.screen.width / 2 - 30;
    startScreen.addChild(controlsButton);

    controlsButton.interactive = true;
    controlsButton.buttonMode = true;
    controlsButton.on('pointerdown', () => {
        app.stage.removeChild(startScreen); 
        showControls(app, () => createStartScreen(app, onStart));
    });

    app.stage.addChild(startScreen);
}


function showControls(app, onBack) {
    const controlsScreen = new Container();

    // Nadpis
    const title = new Text('Game Controls', {
        fontSize: 36,
        fill: 0xffffff,
        align: 'center',
    });
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 5;
    controlsScreen.addChild(title);

    // Text s ovládaním
    const controlsText = new Text(
        `Move: Arrow Keys\nShoot: Spacebar`,
        {
            fontSize: 24,
            fill: 0xffffff,
            align: 'center',
        }
    );
    controlsText.anchor.set(0.5);
    controlsText.x = app.screen.width / 2;
    controlsText.y = app.screen.height / 2;
    controlsScreen.addChild(controlsText);

    // Tlačidlo na návrat
    const backButton = new Text('BACK', {
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        background: 'white',
    });
    backButton.anchor.set(0.5);
    backButton.x = app.screen.width / 2;
    backButton.y = app.screen.height * 0.75;
    controlsScreen.addChild(backButton);

    backButton.interactive = true;
    backButton.buttonMode = true;
    backButton.on('pointerdown', () => {
        app.stage.removeChild(controlsScreen); // Odstráni obrazovku ovládania
        onBack(); // Vráti sa na úvodnú obrazovku
    });

    app.stage.addChild(controlsScreen);
}
