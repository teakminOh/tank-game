import { Sprite, Assets } from 'pixi.js';

export class Bullet {
    constructor(app, startX, startY, rotation, isEnemy = 1) {
        this.app = app;
        this.speed = 5;
        this.rotation = rotation;
        this.isEnemy = isEnemy;

        this.sprite = new Sprite();  // Inicializujeme prázdny sprite
        this.sprite.x = startX;
        this.sprite.y = startY;
        this.sprite.anchor.set(0.5);
        this.sprite.rotation = rotation;

        app.stage.addChild(this.sprite);
        
        // Načítame textúru a až potom nastavíme sprite
        this.loadTexture();
    }

    async loadTexture() {
        try {
            const texture = await Assets.load('graphics/bullets/bullet.png');
            this.sprite.texture = texture;

            // Zmenšenie bulletu, pretože obrázok bol moc veľký
            const desiredSize = 20;
            this.sprite.width = desiredSize;
            this.sprite.height = desiredSize;

        } catch (error) {
            console.error('Failed to load bullet texture:', error);
        }
    }

    update() {
        // Výpočet smeru pohybu guľky na základe rotácie
        this.sprite.x += Math.cos(this.rotation - Math.PI / 2) * this.speed;
        this.sprite.y += Math.sin(this.rotation - Math.PI / 2) * this.speed;

        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.width = this.sprite.width;
        this.height = this.sprite.height; 

        if (
            this.sprite.x < -this.sprite.width  || 
            this.sprite.x > this.app.renderer.width + this.sprite.width|| 
            this.sprite.y < -this.sprite.height ||  
            this.sprite.y > this.app.renderer.height + this.sprite.height 
        ) {
            this.app.stage.removeChild(this.sprite);
            return false;
        }

        return true;
    }
}
