import { Sprite, Assets } from 'pixi.js';

export class Bullet {
    constructor(app, startX, startY, rotation, isEnemy = 1) {
        this.app = app;

        // Determine if it's a mobile device
        this.isMobile = this.checkIfMobile();

        // Set speed dynamically
        if (isEnemy) {
            this.speed = this.isMobile ? 2 : 5; // Enemy bullet speed
        } else {
            this.speed = 5; // Player bullet speed (always 5)
        }

        this.rotation = rotation;
        this.isEnemy = isEnemy;
        this.sprite = new Sprite();
        this.sprite.x = startX;
        this.sprite.y = startY;
        this.sprite.anchor.set(0.5);
        this.sprite.rotation = rotation;

        app.stage.addChild(this.sprite);

        // Load the texture
        this.loadTexture();
    }

    // Method to check if the user is on a mobile device
    checkIfMobile() {
        return /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);
    }

    async loadTexture() {
        try {
            const texture = await Assets.load('graphics/bullets/bullet.png');
            this.sprite.texture = texture;

            // Resize bullet since the original image is too large
            const desiredSize = 20;
            this.sprite.width = desiredSize;
            this.sprite.height = desiredSize;

        } catch (error) {
            console.error('Failed to load bullet texture:', error);
        }
    }

    update() {
        // Calculate movement based on rotation
        this.sprite.x += Math.cos(this.rotation - Math.PI / 2) * this.speed;
        this.sprite.y += Math.sin(this.rotation - Math.PI / 2) * this.speed;

        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.width = this.sprite.width;
        this.height = this.sprite.height;

        // Remove bullet if it moves out of the screen
        if (
            this.sprite.x < -this.sprite.width ||
            this.sprite.x > this.app.renderer.width + this.sprite.width ||
            this.sprite.y < -this.sprite.height ||
            this.sprite.y > this.app.renderer.height + this.sprite.height
        ) {
            this.app.stage.removeChild(this.sprite);
            return false;
        }

        return true;
    }
}
