/**
 * Obstacle manager: ground-only square blocks (Dino-style).
 * One block at a time (optionally two in a row by level). No floating, no thin poles.
 */

import type { RunnerTuning } from '../state/Progression';

export const BLOCK_SIZE = 32;

export interface GroundObstacle {
  sprite: Phaser.Physics.Arcade.Image;
  scored: boolean;
  width: number;
}

export class ObstacleManager {
  private scene: Phaser.Scene;
  private params: RunnerTuning;
  private obstacles: GroundObstacle[] = [];
  private spawnTimer = 0;
  /** Y position of the top of the ground strip (block bottom sits here). */
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
      this.spawnObstacles();
    }

    const speed = this.params.scrollSpeed * (dt / 1000);
    for (const ob of this.obstacles) {
      ob.sprite.x -= speed;

      if (!ob.scored && playerX > ob.sprite.x + ob.width) {
        ob.scored = true;
        this.onScore?.();
      }

      if (ob.sprite.x + ob.width < -50) {
        ob.sprite.destroy();
        this.obstacles = this.obstacles.filter((o) => o !== ob);
      }
    }
  }

  private spawnObstacles(): void {
    const { width } = this.scene.scale;
    const x = width + BLOCK_SIZE;
    this.spawnOne(x);

    if (Math.random() < this.params.doubleObstacleChance) {
      this.spawnOne(x + BLOCK_SIZE + 24);
    }
  }

  private spawnOne(x: number): void {
    const sprite = this.scene.physics.add.image(x, this.groundY, 'runner_block');
    sprite.setOrigin(0.5, 1);
    sprite.setDisplaySize(BLOCK_SIZE, BLOCK_SIZE);
    sprite.setImmovable(true);
    (sprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    sprite.refreshBody();

    this.obstacles.push({ sprite, scored: false, width: BLOCK_SIZE });
  }

  checkOverlap(body: Phaser.Physics.Arcade.Body): boolean {
    for (const ob of this.obstacles) {
      if (this.scene.physics.overlap(body, ob.sprite.body as Phaser.Physics.Arcade.Body)) {
        return true;
      }
    }
    return false;
  }

  destroy(): void {
    for (const ob of this.obstacles) {
      ob.sprite.destroy();
    }
    this.obstacles = [];
  }
}
