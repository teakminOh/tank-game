import { Sprite, Assets } from 'pixi.js';

export async function createTank(app) {
  const texture = await Assets.load('graphics/tanks/player-tank.png');
  const tank = new Sprite(texture);
  tank.x = app.renderer.width / 2;
  tank.y = app.renderer.height / 2;
  tank.anchor.set(0.5);

  app.stage.addChild(tank);

  return tank;
}