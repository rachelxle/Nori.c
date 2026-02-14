/**
 * Generate pixel-art textures at runtime using Phaser Graphics.
 * Low-res (16x16, 24x24, 32x32) scaled up in-game for crisp pixels.
 */

import { Palette } from './Palette';

export function generateAllTextures(scene: Phaser.Scene): void {
  generatePixelCatRunner(scene);
  generatePixelCatArena(scene);
  generatePixelBoss(scene);
  generateObstacles(scene);
  generateRunnerBlock(scene);
  generateProjectile(scene);
  generateParticles(scene);
}

function px(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  g.fillStyle(color, 1);
  g.fillRect(x, y, 1, 1);
}

function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number): void {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}

/** Player pixel cat for Runner - 16x16, warm brown, pink cheeks, dark outline */
function generatePixelCatRunner(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const sz = 16;
  const o = Palette.darkOutline;
  const body = 0xe8b896;  // warm cream/brown
  const ear = 0xc49a6c;   // darker brown
  const pink = Palette.pinkAccent;

  // Outline + body
  for (let yy = 0; yy < sz; yy++) {
    for (let xx = 0; xx < sz; xx++) {
      const isEdge = xx === 0 || xx === sz - 1 || yy === 0 || yy === sz - 1;
      if (isEdge) px(g, xx, yy, o);
      else px(g, xx, yy, body);
    }
  }
  // Ears
  px(g, 2, 1, o); px(g, 3, 0, o); px(g, 4, 0, o); px(g, 5, 1, o);
  px(g, 10, 1, o); px(g, 11, 0, o); px(g, 12, 0, o); px(g, 13, 1, o);
  px(g, 3, 1, ear); px(g, 4, 1, ear); px(g, 11, 1, ear); px(g, 12, 1, ear);
  // Eyes
  px(g, 5, 4, o); px(g, 6, 4, o); px(g, 9, 4, o); px(g, 10, 4, o);
  // Pink cheeks
  px(g, 3, 8, pink); px(g, 12, 8, pink);
  // Nose
  px(g, 7, 6, o); px(g, 8, 6, o);

  g.generateTexture('cat_runner', sz, sz);
  g.destroy();
}

/** Cat run frame 2 - legs alternate */
function generatePixelCatRunner2(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const sz = 16;
  const o = Palette.darkOutline;
  const body = 0xe8b896;
  const ear = 0xc49a6c;
  const pink = Palette.pinkAccent;

  for (let yy = 0; yy < sz; yy++) {
    for (let xx = 0; xx < sz; xx++) {
      const isEdge = xx === 0 || xx === sz - 1 || yy === 0 || yy === sz - 1;
      if (isEdge) px(g, xx, yy, o);
      else px(g, xx, yy, body);
    }
  }
  px(g, 2, 1, o); px(g, 3, 0, o); px(g, 4, 0, o); px(g, 5, 1, o);
  px(g, 10, 1, o); px(g, 11, 0, o); px(g, 12, 0, o); px(g, 13, 1, o);
  px(g, 3, 1, ear); px(g, 4, 1, ear); px(g, 11, 1, ear); px(g, 12, 1, ear);
  px(g, 5, 4, o); px(g, 6, 4, o); px(g, 9, 4, o); px(g, 10, 4, o);
  px(g, 3, 8, pink); px(g, 12, 8, pink);
  px(g, 7, 6, o); px(g, 8, 6, o);
  // Alternate leg pixels (extended)
  px(g, 4, 14, o); px(g, 5, 15, o);
  px(g, 10, 14, o); px(g, 11, 15, o);

  g.generateTexture('cat_runner_2', sz, sz);
  g.destroy();
}

/** Arena cat - 16x16, same style */
function generatePixelCatArena(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const sz = 16;
  const o = Palette.darkOutline;
  const body = 0xe8b896;
  const ear = 0xc49a6c;
  const pink = Palette.pinkAccent;

  for (let yy = 0; yy < sz; yy++) {
    for (let xx = 0; xx < sz; xx++) {
      const isEdge = xx === 0 || xx === sz - 1 || yy === 0 || yy === sz - 1;
      if (isEdge) px(g, xx, yy, o);
      else px(g, xx, yy, body);
    }
  }
  px(g, 2, 1, o); px(g, 3, 0, o); px(g, 4, 0, o); px(g, 5, 1, o);
  px(g, 10, 1, o); px(g, 11, 0, o); px(g, 12, 0, o); px(g, 13, 1, o);
  px(g, 3, 1, ear); px(g, 4, 1, ear); px(g, 11, 1, ear); px(g, 12, 1, ear);
  px(g, 5, 4, o); px(g, 6, 4, o); px(g, 9, 4, o); px(g, 10, 4, o);
  px(g, 3, 8, pink); px(g, 12, 8, pink);
  px(g, 7, 6, o); px(g, 8, 6, o);

  g.generateTexture('cat_arena', sz, sz);
  g.destroy();
}

/** Boss pixel cat - 32x32, darker palette, crown, pink collar */
function generatePixelBoss(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const sz = 32;
  const o = Palette.darkOutline;
  const body = 0x8a6b52;   // darker brown
  const ear = 0x6b4f3a;
  const pink = Palette.pinkAccent;
  const crown = 0xffd166;  // gold
  const crownDark = 0xc9a227;

  for (let yy = 0; yy < sz; yy++) {
    for (let xx = 0; xx < sz; xx++) {
      const isEdge = xx === 0 || xx === sz - 1 || yy === 0 || yy === sz - 1;
      if (isEdge) px(g, xx, yy, o);
      else px(g, xx, yy, body);
    }
  }
  // Bigger ears
  for (let i = 0; i < 6; i++) px(g, 4 + i, 2, o);
  for (let i = 0; i < 6; i++) px(g, 22 + i, 2, o);
  px(g, 5, 1, ear); px(g, 6, 1, ear); px(g, 7, 0, ear);
  px(g, 23, 1, ear); px(g, 24, 1, ear); px(g, 25, 0, ear);
  // Crown
  px(g, 12, 2, crown); px(g, 13, 2, crown); px(g, 14, 1, crown); px(g, 15, 1, crown); px(g, 16, 2, crown); px(g, 17, 2, crown); px(g, 18, 2, crown); px(g, 19, 2, crown);
  px(g, 14, 0, crownDark); px(g, 15, 0, crownDark);
  // Eyes (angry)
  px(g, 10, 10, o); px(g, 11, 10, o); px(g, 12, 10, o);
  px(g, 19, 10, o); px(g, 20, 10, o); px(g, 21, 10, o);
  // Pink collar
  for (let i = 6; i < 26; i++) px(g, i, 22, pink);
  px(g, 5, 21, pink); px(g, 26, 21, pink);
  px(g, 5, 23, o); px(g, 26, 23, o);

  g.generateTexture('boss', sz, sz);
  g.destroy();
}

/** Ground obstacles - cacti style, pixel art */
function generateObstacles(scene: Phaser.Scene): void {
  const o = Palette.darkOutline;
  const green = Palette.nearGrass;
  const darkGreen = 0x3a8f52;

  // Small cactus 16x24
  const g = scene.add.graphics();
  g.fillStyle(green, 1);
  for (let y = 4; y < 24; y++) {
    rect(g, 6, y, 4, 1, green);
  }
  rect(g, 4, 8, 2, 1, green);
  rect(g, 10, 12, 2, 1, green);
  px(g, 5, 4, o); px(g, 6, 4, o); px(g, 7, 4, o); px(g, 8, 4, o); px(g, 9, 4, o);
  px(g, 6, 23, o); px(g, 7, 23, o); px(g, 8, 23, o); px(g, 9, 23, o);
  px(g, 3, 7, darkGreen); px(g, 10, 11, darkGreen);
  g.generateTexture('obstacle_small', 16, 24);
  g.destroy();

  // Tall cactus 20x32
  const g2 = scene.add.graphics();
  g2.fillStyle(green, 1);
  for (let y = 6; y < 32; y++) {
    g2.fillRect(7, y, 5, 1);
  }
  rect(g2, 4, 10, 2, 1, green);
  rect(g2, 14, 14, 2, 1, green);
  rect(g2, 3, 18, 2, 1, green);
  g2.fillStyle(o, 1);
  rect(g2, 6, 6, 6, 1, o);
  rect(g2, 7, 31, 5, 1, o);
  g2.fillStyle(darkGreen, 1);
  px(g2, 3, 9, darkGreen); px(g2, 14, 13, darkGreen); px(g2, 2, 17, darkGreen);
  g2.generateTexture('obstacle_tall', 20, 32);
  g2.destroy();
}

/** Runner mode: single square ground block (Dino-style). */
function generateRunnerBlock(scene: Phaser.Scene): void {
  const BLOCK_SIZE = 32;
  const g = scene.add.graphics();
  const fill = 0xb57b57;
  const outline = Palette.darkOutline;
  g.fillStyle(fill, 1);
  g.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
  g.lineStyle(3, outline);
  g.strokeRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
  g.generateTexture('runner_block', BLOCK_SIZE, BLOCK_SIZE);
  g.destroy();
}

/** Projectile - pink/red pixel ball */
function generateProjectile(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const sz = 8;
  const o = Palette.darkOutline;
  const fill = Palette.warningRed;
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const d = Math.sqrt((x - 3.5) ** 2 + (y - 3.5) ** 2);
      if (d > 4) continue;
      if (d > 3) px(g, x, y, o);
      else px(g, x, y, fill);
    }
  }
  g.generateTexture('projectile', sz, sz);
  g.destroy();
}

/** Particles: dust, spark, heart */
function generateParticles(scene: Phaser.Scene): void {
  let g = scene.add.graphics();
  g.fillStyle(Palette.dirt, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('particle_dust', 4, 4);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(Palette.goldScore, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('particle_spark', 4, 4);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(Palette.pinkAccent, 1);
  px(g, 1, 0, Palette.pinkAccent);
  px(g, 2, 0, Palette.pinkAccent);
  px(g, 0, 1, Palette.pinkAccent);
  px(g, 1, 1, Palette.pinkAccent);
  px(g, 2, 1, Palette.pinkAccent);
  px(g, 3, 1, Palette.pinkAccent);
  px(g, 0, 2, Palette.pinkAccent);
  px(g, 1, 2, Palette.pinkAccent);
  px(g, 2, 2, Palette.pinkAccent);
  px(g, 3, 2, Palette.pinkAccent);
  px(g, 1, 3, Palette.pinkAccent);
  px(g, 2, 3, Palette.pinkAccent);
  g.generateTexture('particle_heart', 4, 4);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(Palette.darkDirt, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture('slam_particle', 4, 4);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(Palette.warningRed, 1);
  g.fillRect(0, 0, 6, 6);
  g.generateTexture('boss_death_particle', 6, 6);
  g.destroy();
}

export { generatePixelCatRunner2 };
