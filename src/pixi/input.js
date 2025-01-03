import { Bullet } from './bullet';
let updateReference;
let inputListeners = {};
export function setupInput(app, tank, bullets) {
    const speed = 4;
    const keys = {};
    let canShoot = true; // Cooldown kontrola
    const shootCooldown = 800; // Čas medzi výstrelmi v milisekundách

    // Premenné na sledovanie myši
    let mouseX = 0;
    let mouseY = 0;

    // Polomer okolo tanku, v ktorom sa tank nebude hýbať
    const tankRadius = 10;

    // Sledovanie posledného ovládania: 'mouse' alebo 'keyboard'
    let lastControl = 'mouse';

    let isMouseClicked = false;

    // Define input handlers
    inputListeners.handleKeydown = (e) => {
        keys[e.code] = true;
        lastControl = 'keyboard';
    };
    inputListeners.handleKeyup = (e) => {
        keys[e.code] = false;
    };
    inputListeners.handleMousemove = (e) => {
        const rect = app.canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        lastControl = 'mouse';
    };
    inputListeners.handleMousedown = () => {
        isMouseClicked = true;
    };
    inputListeners.handleMouseup = () => {
        isMouseClicked = false;
    };

    // Attach listeners
    window.addEventListener('keydown', inputListeners.handleKeydown);
    window.addEventListener('keyup', inputListeners.handleKeyup);
    app.canvas.addEventListener('mousemove', inputListeners.handleMousemove);
    app.canvas.addEventListener('mousedown', inputListeners.handleMousedown);
    app.canvas.addEventListener('mouseup', inputListeners.handleMouseup);
    
    function update() {
        if (lastControl === 'mouse') {
            // Pohyb na základe myši
            const dx = mouseX - tank.x;
            const dy = mouseY - tank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > tankRadius) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontálny pohyb
                    if (dx > 0 && tank.x < app.renderer.width - tank.width / 2) {
                        tank.x += speed;
                        tank.rotation = Math.PI / 2;
                    } else if (dx < 0 && tank.x > tank.width / 2) {
                        tank.x -= speed;
                        tank.rotation = -Math.PI / 2;
                    }
                } else {
                    // Vertikálny pohyb
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
            // Pohyb na základe klávesnice
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
            canShoot = false; // Prevent further shots during cooldown

            // Vytvorenie guľky
            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation);
            bullets.push(bullet);

            // Nastavenie cooldownu
            setTimeout(() => {
                canShoot = true; // Re-enable shooting after cooldown
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
