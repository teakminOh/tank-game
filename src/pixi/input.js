import { Bullet } from './bullet';
import { displayPauseScreen } from './pauseScreen';
import { sounds } from './soundManager';

let updateReference;
let inputListeners = {};
export function setupInput(app, tank, bullets) {
    const speed = 4;
    const keys = {};
    let tankRadius = 10;
    let canShoot = true; // Cooldown control
    const shootCooldown = 800; // Time between shots in milliseconds
    let isMoving = false; // Track if the tank is moving

    // Initialize mouse coordinates to the center of the screen
    let mouseX = app.renderer.width / 2;
    let mouseY = app.renderer.height / 2;

    // Initialize without control until input is detected
    let lastControl = null;

    let isMouseClicked = false;

    // Define input handlers
    const handleKeydown = (e) => {
        keys[e.code] = true;
        lastControl = 'keyboard';
    };
    const handleKeyup = (e) => {
        keys[e.code] = false;
    };
    const handleMousemove = (e) => {
        const rect = app.canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        lastControl = 'mouse';
    };
    const handleMousedown = () => {
        isMouseClicked = true;
    };
    const handleMouseup = () => {
        isMouseClicked = false;
    };

    // Listening for pause
    window.addEventListener("keydown", (event) => {
        if (event.code === "Escape") {
            if (app.ticker.started) {
                displayPauseScreen(app, () => {
                    app.ticker.start(); // Resume the game
                });
            }
        }
    });
    // Attach listeners
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    app.canvas.addEventListener('mousemove', handleMousemove);
    app.canvas.addEventListener('mousedown', handleMousedown);
    app.canvas.addEventListener('mouseup', handleMouseup);

    function update() {
        // Skip update if no input detected yet
        if (!lastControl) {
            return;
        }

        let tankMoved = false; // Track if the tank moved during this frame

        if (lastControl === 'mouse') {
            const dx = mouseX - tank.x;
            const dy = mouseY - tank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > tankRadius) {
                tankMoved = true;
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0 && tank.x < app.renderer.width - tank.width / 2) {
                        tank.x += speed;
                        tank.rotation = Math.PI / 2;
                    } else if (dx < 0 && tank.x > tank.width / 2) {
                        tank.x -= speed;
                        tank.rotation = -Math.PI / 2;
                    }
                } else {
                    if (dy > 0 && tank.y < app.renderer.height - tank.height / 2) {
                        tank.y += speed;
                        tank.rotation = Math.PI;
                    } else if (dy < 0 && tank.y > tank.height / 2) {
                        tank.y -= speed;
                        tank.rotation = 0;
                    }
                }
            }
        } else if (lastControl === 'keyboard') {
            if (keys['ArrowUp'] && !keys['ArrowDown'] && tank.y > tank.height / 2) {
                tank.y -= speed;
                tank.rotation = 0;
                tankMoved = true;
            } else if (keys['ArrowDown'] && !keys['ArrowUp'] && tank.y < app.renderer.height - tank.height / 2) {
                tank.y += speed;
                tank.rotation = Math.PI;
                tankMoved = true;
            } else if (keys['ArrowLeft'] && !keys['ArrowRight'] && tank.x > tank.width / 2) {
                tank.x -= speed;
                tank.rotation = -Math.PI / 2;
                tankMoved = true;
            } else if (keys['ArrowRight'] && !keys['ArrowLeft'] && tank.x < app.renderer.width - tank.width / 2) {
                tank.x += speed;
                tank.rotation = Math.PI / 2;
                tankMoved = true;
            }
        }

        // Play or stop the tank move sound based on movement
        if (tankMoved && !isMoving) {
            sounds.tankMove.play();
            isMoving = true;
        } else if (!tankMoved && isMoving) {
            sounds.tankMove.stop();
            isMoving = false;
        }

        // Shooting logic
        if ((keys['Space'] || isMouseClicked) && canShoot) {
            canShoot = false;

            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation, 0);
            bullets.push(bullet);

            setTimeout(() => {
                canShoot = true;
                sounds.fire.play();
            }, shootCooldown);
        }
    }

    // Add update function to the ticker
    updateReference = update;
    app.ticker.add(update);
}

export function cleanupInput(app) {
    // Remove input listeners
    if (inputListeners.handleKeydown) {
        window.removeEventListener('keydown', inputListeners.handleKeydown);
        window.removeEventListener('keyup', inputListeners.handleKeyup);
        app.canvas.removeEventListener('mousemove', inputListeners.handleMousemove);
        app.canvas.removeEventListener('mousedown', inputListeners.handleMousedown);
        app.canvas.removeEventListener('mouseup', inputListeners.handleMouseup);
    }

    // Clear update function
    if (updateReference) {
        app.ticker.remove(updateReference);
        updateReference = null;
    }

    // Stop the tank move sound when cleaning up input
    sounds.tankMove.stop();
}
