import { Bullet } from './bullet';
let updateReference;
let inputListeners = {};
export function setupInput(app, tank, bullets) {
    const speed = 4;
    const keys = {};
    let tankRadius = 10;
    let canShoot = true; // Cooldown kontrola
    const shootCooldown = 800; // Čas medzi výstrelmi v milisekundách

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

        if (lastControl === 'mouse') {
            const dx = mouseX - tank.x;
            const dy = mouseY - tank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > tankRadius) {
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
            } else if (keys['ArrowDown'] && !keys['ArrowUp'] && tank.y < app.renderer.height - tank.height / 2) {
                tank.y += speed;
                tank.rotation = Math.PI;
            } else if (keys['ArrowLeft'] && !keys['ArrowRight'] && tank.x > tank.width / 2) {
                tank.x -= speed;
                tank.rotation = -Math.PI / 2;
            } else if (keys['ArrowRight'] && !keys['ArrowLeft'] && tank.x < app.renderer.width - tank.width / 2) {
                tank.x += speed;
                tank.rotation = Math.PI / 2;
            }
        }

        // Streľba
        if ((keys['Space'] || isMouseClicked) && canShoot) {
            canShoot = false;

            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation);
            bullets.push(bullet);

            setTimeout(() => {
                canShoot = true;
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
}
