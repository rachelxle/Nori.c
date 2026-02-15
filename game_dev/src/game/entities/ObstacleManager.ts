/**
 * Simple red-square obstacle manager with ground + duck obstacles.
 */

import type { RunnerTuning } from '../state/Progression';
import { GAME_CONFIG } from '../config';

export interface GroundObstacle {
  rect: Phaser.GameObjects.Rectangle;
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
      ob.rect.x -= speed;
      ob.body.x = ob.rect.x - ob.rect.width / 2;

      if (!ob.scored && playerX > ob.rect.x + ob.width / 2) {
        ob.scored = true;
        this.onScore?.();
      }

      if (ob.rect.x + ob.width < -50) {
        ob.rect.destroy();
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

    this.spawnRectObstacle(x, y, size);
  }

  // Duck obstacle (just above cat’s hitbox)
  private spawnDuckObstacle(): void {
    const size = 60;
    const x = GAME_CONFIG.width + 100;

    // Cat physics hitbox height (from CatRunner)
    const catHitboxHeight = 106; // 192 * 0.55

    // Tiny gap so running under is safe but jumping hits
    const tinyGap = 5;

    // Place obstacle bottom just above cat’s head
    const y = this.groundY - catHitboxHeight - tinyGap - size / 2;

    this.spawnRectObstacle(x, y, size);
  }

  // Shared rectangle creation
  private spawnRectObstacle(x: number, y: number, size: number): void {
    const rect = this.scene.add.rectangle(x, y, size, size, 0xff0000);
    this.scene.physics.add.existing(rect);

    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setSize(size, size);
    body.setOffset(0, 0);

    this.obstacles.push({
      rect,
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
      ob.rect.destroy();
    }
    this.obstacles = [];
  }
}