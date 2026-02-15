/**
 * Simple Luna-sprite obstacle manager with ground + duck obstacles.
 * Same logic as the red-square version, but using sprites.
 */

import type { RunnerTuning } from '../state/Progression';
import { GAME_CONFIG } from '../config';
import Phaser from 'phaser';

export interface GroundObstacle {
  sprite: Phaser.GameObjects.Sprite;
  body: Phaser.Physics.Arcade.Body;
  scored: boolean;
  width: number;
}

export class ObstacleManager {
  private scene: Phaser.Scene;
  private params: RunnerTuning;
  private obstacles: GroundObstacle[] = [];
  private spawnTimer = 0;
  private groundY: number;

  onScore?: () => void;

  constructor(scene: Phaser.Scene, params: RunnerTuning, groundY: number) {
    this.scene = scene;
    this.params = params;
    this.groundY = groundY;
  }

  update(dt: number, playerX: number): void {
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.params.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandomObstacle();
    }

    const speed = this.params.scrollSpeed * (dt / 1000);

    for (const ob of this.obstacles) {
      ob.sprite.x -= speed;
      ob.body.x = ob.sprite.x - ob.sprite.displayWidth / 2;

      if (!ob.scored && playerX > ob.sprite.x + ob.width / 2) {
        ob.scored = true;
        this.onScore?.();
      }

      if (ob.sprite.x + ob.width < -50) {
        ob.sprite.destroy();
        this.obstacles = this.obstacles.filter(o => o !== ob);
      }
    }
  }

  // Randomly choose ground or duck obstacle
  private spawnRandomObstacle(): void {
    const roll = Math.random();
    if (roll < 0.5) {
      this.spawnGroundObstacle();
    } else {
      this.spawnDuckObstacle();
    }
  }

  // Ground obstacle
  private spawnGroundObstacle(): void {
    const size = 60;
    const x = GAME_CONFIG.width + 100;
    const y = this.groundY - size / 2;

    this.spawnSpriteObstacle(x, y, size);
  }

  // Duck obstacle (just above cat’s hitbox)
  private spawnDuckObstacle(): void {
    const size = 60;
    const x = GAME_CONFIG.width + 100;

    const catHitboxHeight = 106;
    const tinyGap = 5;

    const y = this.groundY - catHitboxHeight - tinyGap - size / 2;

    this.spawnSpriteObstacle(x, y, size);
  }

  // Shared sprite creation
  private spawnSpriteObstacle(x: number, y: number, size: number): void {
    const sprite = this.scene.add.sprite(x, y, 'luna');

    // Scale Luna so she visually matches a 60×60 block
    const baseFrameSize = 64; // your sprite sheet frame size
    sprite.setScale(size / baseFrameSize);

    this.scene.physics.add.existing(sprite);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);

    body.setSize(size, size);
    body.setOffset(
      (sprite.displayWidth - size) / 2,
      (sprite.displayHeight - size) / 2
    );

    this.obstacles.push({
      sprite,
      body,
      scored: false,
      width: size
    });
  }

  checkOverlap(playerBody: Phaser.Physics.Arcade.Body): boolean {
    for (const ob of this.obstacles) {
      if (this.scene.physics.overlap(playerBody, ob.body)) {
        return true;
      }
    }
    return false;
  }

  /** Returns the first overlapping obstacle, or null. Used to get position for knockback. */
  getOverlappingObstacle(playerBody: Phaser.Physics.Arcade.Body): GroundObstacle | null {
    for (const ob of this.obstacles) {
      if (this.scene.physics.overlap(playerBody, ob.body)) {
        return ob;
      }
    }
    return null;
  }

  /** Remove obstacle when player hits it (e.g. in Arena). */
  removeObstacle(ob: GroundObstacle): void {
    ob.rect.destroy();
    this.obstacles = this.obstacles.filter((o) => o !== ob);
  }

  destroy(): void {
    for (const ob of this.obstacles) {
      ob.sprite.destroy();
    }
    this.obstacles = [];
  }
}