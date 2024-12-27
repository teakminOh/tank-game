import { config } from './game';
import { Bullet } from './bullet';

export function setupInput(app, tank, bullets) {
    const speed = 2;
    const keys = {};
    let canShoot = true; // Cooldown kontrola
    const shootCooldown = 800; // Čas medzi výstrelmi v milisekundách

    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    function update() {
        // Pohyb tanku
        if (keys['ArrowUp'] && !keys['ArrowDown'] && tank.y > 0 + tank.height) {
            tank.y -= speed;
            tank.rotation = 0;
        } else if (keys['ArrowDown'] && !keys['ArrowUp'] && tank.y < config.height - tank.height) {
            tank.y += speed;
            tank.rotation = Math.PI;
        } else if (keys['ArrowLeft'] && !keys['ArrowRight'] && tank.x > 0 + tank.width) {
            tank.x -= speed;
            tank.rotation = -Math.PI / 2;
        } else if (keys['ArrowRight'] && !keys['ArrowLeft'] && tank.x < config.width - tank.width) {
            tank.x += speed;
            tank.rotation = Math.PI / 2;
        }

        // Streľba
        if (keys['Space'] && canShoot) {
            canShoot = false; 
            setTimeout(() => (canShoot = true), shootCooldown);

            // Použijeme iba rotáciu tanku na určenie smeru strely
            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation);
            bullets.push(bullet);
        }
    }

    app.ticker.add(update);
}
