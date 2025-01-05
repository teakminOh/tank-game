import { Bullet } from './bullet';
import { Graphics } from 'pixi.js';

let updateReference;
let eventListeners = []; // Global array to store event listeners

export function setupPhoneInput(app, tank, bullets) {
    const speed = 2;
    const shootCooldown = 800; // Cooldown between shots in milliseconds
    let canShoot = true; // Control shoot cooldown

    // Joystick variables
    let joystickBase, joystickThumb, shootButton;
    let joystickTouchId = null;
    let joystickDelta = { x: 0, y: 0 };

    // Define joystick and button sizes
    const joystickBaseRadius = 50;
    const joystickThumbRadius = 20;
    const shootButtonSize = 60;

    // Joystick touch events
    function handleJoystickTouchStart(event) {
        const touches = event.changedTouches;
        for (let touch of touches) {
            const dx = touch.clientX - joystickBase.x;
            const dy = touch.clientY - joystickBase.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= joystickBaseRadius) {
                joystickTouchId = touch.identifier;
                joystickThumb.x = touch.clientX;
                joystickThumb.y = touch.clientY;
                break;
            }
        }
    }

    function handleJoystickTouchMove(event) {
        if (joystickTouchId === null) return;

        const touches = event.changedTouches;
        for (let touch of touches) {
            if (touch.identifier === joystickTouchId) {
                const dx = touch.clientX - joystickBase.x;
                const dy = touch.clientY - joystickBase.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= joystickBaseRadius) {
                    joystickThumb.x = touch.clientX;
                    joystickThumb.y = touch.clientY;
                    joystickDelta = { x: dx / joystickBaseRadius, y: dy / joystickBaseRadius };
                } else {
                    const angle = Math.atan2(dy, dx);
                    joystickThumb.x = joystickBase.x + Math.cos(angle) * joystickBaseRadius;
                    joystickThumb.y = joystickBase.y + Math.sin(angle) * joystickBaseRadius;
                    joystickDelta = { x: Math.cos(angle), y: Math.sin(angle) };
                }
                break;
            }
        }
    }

    function handleJoystickTouchEnd(event) {
        const touches = event.changedTouches;
        for (let touch of touches) {
            if (touch.identifier === joystickTouchId) {
                joystickTouchId = null;
                joystickThumb.x = joystickBase.x;
                joystickThumb.y = joystickBase.y;
                joystickDelta = { x: 0, y: 0 };
                break;
            }
        }
    }

    // Shoot button logic
    function handleShoot() {
        if (canShoot) {
            canShoot = false;

            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation, 0);
            bullets.push(bullet);

            setTimeout(() => {
                canShoot = true;
            }, shootCooldown);
        }
    }

    // Function to create joystick and shoot button
    function createJoystickAndButton() {
        let joystickActive = false; 
        // Joystick base
        joystickBase = new Graphics();
        joystickBase.circle(0, 0, joystickBaseRadius);
        joystickBase.fill(0x888888);
        joystickBase.stroke({ width: 2, color: 0xfeeb77 });

        joystickBase.x = joystickBaseRadius + 20; // Left padding
        joystickBase.y = app.renderer.height - joystickBaseRadius - 20;
        joystickBase.alpha = 0.5;
        app.stage.addChild(joystickBase);

        // Joystick thumb
        joystickThumb = new Graphics();
        joystickThumb.circle(0, 0, joystickThumbRadius);
        joystickThumb.fill(0xffffff);
        joystickThumb.stroke({ width: 2, color: 0xfeeb77 });
        joystickThumb.x = joystickBase.x;
        joystickThumb.y = joystickBase.y;
        joystickThumb.alpha = 0.5;
        app.stage.addChild(joystickThumb);

        // Shoot button
        shootButton = new Graphics();
        shootButton.circle(0, 0, shootButtonSize);
        shootButton.fill(0x888888);
        shootButton.stroke({ width: 2, color: 0xfeeb77 });
        shootButton.x = app.renderer.width - shootButtonSize - 20; // Right padding
        shootButton.y = app.renderer.height - shootButtonSize - 20;
        shootButton.alpha = 0.5;
        app.stage.addChild(shootButton);

        // Make shoot button interactive
        shootButton.interactive = true;
        shootButton.buttonMode = true;
        shootButton.on('pointerdown', () => handleShoot());

        // Touch start: Activate joystick and position it
    app.view.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        if (touch.clientX < app.renderer.width / 2) { // Restrict to left side
            joystickBase.x = touch.clientX;
            joystickBase.y = touch.clientY;
            joystickThumb.x = touch.clientX;
            joystickThumb.y = touch.clientY;
            joystickBase.alpha = 0.5;
            joystickThumb.alpha = 0.8;
            joystickActive = true;
        }
    });

    // Touch move: Update joystick thumb and calculate delta
    app.canvas.addEventListener('touchmove', (event) => {
        if (!joystickActive) return;

        const touch = event.touches[0];
        const dx = touch.clientX - joystickBase.x;
        const dy = touch.clientY - joystickBase.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= joystickBaseRadius) {
            // Within joystick range
            joystickThumb.x = touch.clientX;
            joystickThumb.y = touch.clientY;
        } else {
            // Outside joystick range, clamp thumb to edge
            const angle = Math.atan2(dy, dx);
            joystickThumb.x = joystickBase.x + Math.cos(angle) * joystickBaseRadius;
            joystickThumb.y = joystickBase.y + Math.sin(angle) * joystickBaseRadius;
        }

        // Calculate normalized delta (-1 to 1 range)
        joystickDelta.x = (joystickThumb.x - joystickBase.x) / joystickBaseRadius;
        joystickDelta.y = (joystickThumb.y - joystickBase.y) / joystickBaseRadius;
    });

    // Touch end: Deactivate joystick
    app.canvas.addEventListener('touchend', () => {
        joystickBase.alpha = 0;
        joystickThumb.alpha = 0;
        joystickActive = false;
        joystickDelta = { x: 0, y: 0 }; // Reset movement
    });

    return joystickDelta;
    }

    function update() {
        // Restrict movement to only left, right, up, or down
        const dx = joystickDelta.x;
        const dy = joystickDelta.y;
    
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement
            if (dx > 0.1 && tank.x < app.renderer.width - tank.width / 2) {
                tank.x += speed;
                tank.rotation = Math.PI / 2; // Facing right
            } else if (dx < -0.1 && tank.x > tank.width / 2) {
                tank.x -= speed;
                tank.rotation = -Math.PI / 2; // Facing left
            }
        } else {
            // Vertical movement
            if (dy > 0.1 && tank.y < app.renderer.height - tank.height / 2) {
                tank.y += speed;
                tank.rotation = Math.PI; // Facing down
            } else if (dy < -0.1 && tank.y > tank.height / 2) {
                tank.y -= speed;
                tank.rotation = 0; // Facing up
            }
        }
    }
    
    

    // Attach event listeners and store them in global eventListeners
    const touchStartListener = (e) => handleJoystickTouchStart(e);
    const touchMoveListener = (e) => handleJoystickTouchMove(e);
    const touchEndListener = (e) => handleJoystickTouchEnd(e);

    app.view.addEventListener('touchstart', touchStartListener);
    app.view.addEventListener('touchmove', touchMoveListener);
    app.view.addEventListener('touchend', touchEndListener);

    eventListeners.push(
        { target: app.view, type: 'touchstart', listener: touchStartListener },
        { target: app.view, type: 'touchmove', listener: touchMoveListener },
        { target: app.view, type: 'touchend', listener: touchEndListener }
    );

    // Create joystick and button
    createJoystickAndButton();

    // Add update function to the ticker
    updateReference = update;
    app.ticker.add(update);
}

export function cleanupPhoneInput(app) {
    // Remove all stored event listeners
    eventListeners.forEach(({ target, type, listener }) => {
        target.removeEventListener(type, listener);
    });
    eventListeners = []; // Clear the global array

    // Remove update function from ticker
    if (updateReference) {
        app.ticker.remove(updateReference);
        updateReference = null;
    }
}
