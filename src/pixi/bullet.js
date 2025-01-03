import { Sprite, Assets } from 'pixi.js';

export class Bullet {
    constructor(app, startX, startY, rotation) {
        this.app = app;
        this.speed = 5;
        this.rotation = rotation;

        this.sprite = new Sprite();
        this.sprite.x = startX;
        this.sprite.y = startY;
        this.sprite.anchor.set(0.5);
        this.sprite.rotation = rotation;

        app.stage.addChild(this.sprite);
        this.loadTexture();
    }

    async loadTexture() {
        const texture = await Assets.load('graphics/bullets/bullet.png');
        this.sprite.texture = texture;

        // Zmenšenie bulletu, pretože obrázok bol moc veľký
        const desiredSize = 20;
        this.sprite.width = desiredSize;
        this.sprite.height = desiredSize;
    }

    update() {
        // Výpočet smeru pohybu guľky na základe rotácie
        this.sprite.x += Math.cos(this.rotation - Math.PI / 2) * this.speed;
        this.sprite.y += Math.sin(this.rotation - Math.PI / 2) * this.speed;
        //tu som chcel spravit aby naboj nemohol ist za okraje backgroundu pomocou offsetu, ale nejako mi to nefunguje idk preco

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
