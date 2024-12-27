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

        // zmensenie bulletu, lebo obrazok bol moc velky
        const desiredSize = 20;
        this.sprite.width = desiredSize;
        this.sprite.height = desiredSize;
    }

    update() {
        // vypocet smeru pohybu bulletu na zaklade rotacie
        // ak je tank otoceny dolava, tak aj bullet pojde dolava 
        this.sprite.x += Math.cos(this.rotation - Math.PI / 2) * this.speed;
        this.sprite.y += Math.sin(this.rotation - Math.PI / 2) * this.speed;

        // ak je bullet mimo obrazovky, tak sa odstrani
        if (
            this.sprite.x < 0 ||
            this.sprite.x > this.app.renderer.width ||
            this.sprite.y < 0 ||
            this.sprite.y > this.app.renderer.height
        ) {
            this.app.stage.removeChild(this.sprite);
            return false;
        }
        return true;
    }
}
