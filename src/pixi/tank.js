import { Sprite, Assets } from 'pixi.js';

export async function createTank(app) {
    const texture = await Assets.load('graphics/tanks/player-tank.png');
    const tank = new Sprite(texture);

    // Initial position
    tank.x = app.renderer.width / 2;
    tank.y = app.renderer.height / 2;
    tank.anchor.set(0.5);

    // Initial resize based on screen size
    resizeTank();
    ensureTankInBounds();

    app.stage.addChild(tank);

    // Function to resize the tank dynamically
    function resizeTank() {
        const scaleFactor = Math.min(app.renderer.width, app.renderer.height) / 800; // Base scaling
        const minWidth = 40; // Minimum width
        const minHeight = 40; // Minimum height

        // Set tank size based on scale factor with minimum constraints
        tank.width = Math.max(texture.width * scaleFactor, minWidth);
        tank.height = Math.max(texture.height * scaleFactor, minHeight);
    }

    // Function to ensure the tank stays within screen bounds
    function ensureTankInBounds() {
        tank.x = Math.max(tank.width / 2, Math.min(app.renderer.width - tank.width / 2, tank.x));
        tank.y = Math.max(tank.height / 2, Math.min(app.renderer.height - tank.height / 2, tank.y));
    }

    // Add event listener to resize the tank and reposition it when the window resizes
    window.addEventListener('resize', () => {
        resizeTank();
        ensureTankInBounds();
    });

    return tank;
}
