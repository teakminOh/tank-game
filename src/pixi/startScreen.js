import { Container, Text, TextStyle } from 'pixi.js';
const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);

export function createStartScreen(app, onStart) {
    const startScreen = new Container();

    // Create title
    const style = new TextStyle({
        fontSize: 36,
        fill: 0xffffff,
        align: 'center',
        fontFamily: 'PixelifySans',
    })
    const title = new Text({
        text: 'Welcome to Tank Game!',
        style: style
    })
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 3;

    startScreen.addChild(title);

    // Create start button
    const styleStartButton = new TextStyle({
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        background: 'white',
        fontFamily: 'PixelifySans',
    })

    const startButton = new Text({
        text:'START GAME',
        style: styleStartButton
    })
        
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

    // Define TextStyle for the Controls button
    const controlsButtonStyle = new TextStyle({
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        fontFamily: 'PixelifySans',
    });

    // Create the Controls button text using the new syntax
    const controlsButton = new Text({
        text:'CONTROLS', 
        style: controlsButtonStyle
    });
    controlsButton.anchor.set(0.5);
    controlsButton.x = app.screen.width / 2;
    controlsButton.y = app.screen.height * 0.57;
    startScreen.addChild(controlsButton);

    controlsButton.interactive = true;
    controlsButton.buttonMode = true;
    controlsButton.on('pointerdown', () => {
        app.stage.removeChild(startScreen);
        showControls(app, () => createStartScreen(app, onStart));
    });

    app.stage.addChild(startScreen);

    // Add resize logic
    function resizeStartScreen() {
        title.x = app.screen.width / 2;
        title.y = app.screen.height / 3;

        startButton.x = app.screen.width / 2;
        startButton.y = app.screen.height / 2;

        controlsButton.x = app.screen.width / 2;
        controlsButton.y = app.screen.height * 0.57;
    }

    // Listen to window resize
    window.addEventListener('resize', resizeStartScreen);
}

function showControls(app, onBack) {
    const controlsScreen = new Container();

    // Title
    const style = new TextStyle({
        fontSize: 36,
        fill: 0xffffff,
        align: 'center',
        fontFamily: 'PixelifySans',
    })
    const title = new Text({
        text: 'Game Controls',
        style: style,
    })
        

    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 5;
    controlsScreen.addChild(title);

    // Controls text
    const styleMove = new TextStyle({
        fontSize: 24,
        fill: 0xffffff,
        align: 'center',
        fontFamily: 'PixelifySans',
    })
    let controlsText;
    if(isMobile){
        controlsText = new Text({
            text: `Move: Joystick\nShoot: Shoot button`,
            style: styleMove
        });
    }
    else
    {
        controlsText = new Text({
            text: `Move: Arrow Keys, Mouse\nShoot: Spacebar, MouseClick`,
            style: styleMove
        });
    }
    controlsText.anchor.set(0.5);
    controlsText.x = app.screen.width / 2;
    controlsText.y = app.screen.height / 2;
    controlsScreen.addChild(controlsText);

    // Back button
    const backButtonStyle = new TextStyle({
        fontSize: 24,
        fill: 0x000000,
        align: 'center',
        fontFamily: 'PixelifySans',
    });
    
    // Create the Back button text using the new syntax
    const backButton = new Text({text:'BACK', style: backButtonStyle});
    backButton.anchor.set(0.5);
    backButton.x = app.screen.width / 2;
    backButton.y = app.screen.height * 0.75;
    controlsScreen.addChild(backButton);

    backButton.interactive = true;
    backButton.buttonMode = true;
    backButton.on('pointerdown', () => {
        app.stage.removeChild(controlsScreen); // Remove controls screen
        onBack(); // Return to start screen
    });

    app.stage.addChild(controlsScreen);

    // Add resize logic
    function resizeControlsScreen() {
        title.x = app.screen.width / 2;
        title.y = app.screen.height / 5;

        controlsText.x = app.screen.width / 2;
        controlsText.y = app.screen.height / 2;

        backButton.x = app.screen.width / 2;
        backButton.y = app.screen.height * 0.75;
    }

    // Listen to window resize
    window.addEventListener('resize', resizeControlsScreen);
}
