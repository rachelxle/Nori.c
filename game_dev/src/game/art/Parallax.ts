/**
 * Parallax scrolling layers for pixel-art backgrounds.
 */

import { Palette } from './Palette';

export interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image;
  speed: number;  // 0 = static, 1 = full scroll
}

/** Create far hills (slow), near grass (medium) - uses generated textures */
export function createRunnerParallax(scene: Phaser.Scene, width: number, height: number): ParallaxLayer[] {
  const layers: ParallaxLayer[] = [];
  const g = scene.add.graphics();

  // Far hills - simple wave shape
  g.fillStyle(Palette.farHills, 1);
  for (let x = 0; x < width + 100; x += 2) {
    const y = height - 120 + Math.sin(x * 0.02) * 40 + Math.sin(x * 0.05) * 20;
    g.fillRect(x, y, 4, height - y + 20);
  }
  g.generateTexture('parallax_hills', width + 100, height);
  g.destroy();

  const hills = scene.add.tileSprite(width / 2, height / 2, width + 200, height, 'parallax_hills');
  hills.setScrollFactor(0.15);
  hills.setDepth(-2);
  layers.push({ sprite: hills, speed: 0.15 });

  // Near grass strip - faster
  const g2 = scene.add.graphics();
  g2.fillStyle(Palette.nearGrass, 1);
  for (let x = 0; x < 64; x += 2) {
    g2.fillRect(x, 0, 2, 40);
  }
  g2.generateTexture('parallax_grass', 64, 40);
  g2.destroy();

  const grass = scene.add.tileSprite(width / 2, height - 90, width + 200, 80, 'parallax_grass');
  grass.setScrollFactor(0.4);
  grass.setDepth(-1);
  layers.push({ sprite: grass, speed: 0.4 });

  return layers;
}

/** Create pixel clouds - individual sprites that drift */
export function createClouds(scene: Phaser.Scene, count: number): Phaser.GameObjects.Image[] {
  const clouds: Phaser.GameObjects.Image[] = [];
  const g = scene.add.graphics();
  g.fillStyle(Palette.clouds, 1);
  // Simple cloud shape 24x12
  for (let x = 2; x < 22; x++) {
    for (let y = 4; y < 10; y++) g.fillRect(x, y, 1, 1);
  }
  for (let x = 4; x < 20; x++) {
    for (let y = 2; y < 8; y++) g.fillRect(x, y, 1, 1);
  }
  g.generateTexture('cloud', 24, 12);
  g.destroy();

  const { width } = scene.scale;
  for (let i = 0; i < count; i++) {
    const c = scene.add.image(
      Math.random() * width,
      50 + Math.random() * 80,
      'cloud'
    );
    c.setScrollFactor(0.2);
    c.setDepth(-1.5);
    c.setAlpha(0.9);
    clouds.push(c);
  }
  return clouds;
}

/** Update parallax - call in scene update with scroll amount */
export function updateParallax(layers: ParallaxLayer[], scrollDelta: number): void {
  for (const layer of layers) {
    if (layer.sprite instanceof Phaser.GameObjects.TileSprite) {
      layer.sprite.tilePositionX += scrollDelta * layer.speed;
    }
  }
}
