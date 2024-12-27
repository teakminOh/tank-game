import { config } from './game';
import { Bullet } from './bullet';

export function setupInput(app, tank, bullets) {
    const speed = 4;
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
        // premenna cisto na to aby sa upresnili hranice pokial sa moze tank pohybovat,
        // aby nezasahoval do bokov backgroundu
        // uplne random vypocet podla sirky, hadam to nebude robit problem
        let horizontalBoundaryOffset = config.width / 60;  // Zmenší pohyb doľava a doprava
        let verticalBoundaryOffset = config.height / 40;  // Zmenší pohyb dole
    
        // Pohyb hore
        if (keys['ArrowUp'] && !keys['ArrowDown'] && tank.y > 0 + tank.height) {
            tank.y -= speed;
            tank.rotation = 0;
        }
        // Pohyb dole
        else if (keys['ArrowDown'] && !keys['ArrowUp'] && tank.y < config.height - tank.height - verticalBoundaryOffset) {
            tank.y += speed;
            tank.rotation = Math.PI;
        }
        // Pohyb doľava
        else if (keys['ArrowLeft'] && !keys['ArrowRight'] && tank.x > 0 + tank.width + horizontalBoundaryOffset) {
            tank.x -= speed;
            tank.rotation = -Math.PI / 2;
        }
        // Pohyb doprava
        else if (keys['ArrowRight'] && !keys['ArrowLeft'] && tank.x < config.width - tank.width - horizontalBoundaryOffset) {
            tank.x += speed;
            tank.rotation = Math.PI / 2;
        }
        // strelba
        if (keys['Space'] && canShoot) {
            canShoot = false; 
            setTimeout(() => (canShoot = true), shootCooldown);

            const bullet = new Bullet(app, tank.x, tank.y, tank.rotation);
            bullets.push(bullet);
        }
    }
    app.ticker.add(update);
}
