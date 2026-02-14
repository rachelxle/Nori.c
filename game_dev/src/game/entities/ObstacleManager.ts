/**
 * Obstacle manager: ground-only obstacles (Chrome Dino-style).
 * Obstacles scroll left. Variation by level: small, tall, double.
 */

import type { RunnerTuning } from '../state/Progression';
import { GAME_CONFIG } from '../config';

export type ObstacleType = 'small' | 'tall' | 'double';

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
  private groundY: number;

  onScore?: () => void;

  constructor(scene: Phaser.Scene, params: RunnerTuning, groundY: number) {
    this.scene = scene;
    this.params = params;
    this.groundY = groundY;
    // Textures (obstacle_small, obstacle_tall) generated in BootScene
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
    const obs = GAME_CONFIG.obstacles;
    const mult = this.params.obstacleSizeMultiplier;

    // Double obstacle chance
    const spawnDouble = Math.random() < this.params.doubleObstacleChance;

    if (spawnDouble) {
      const w1 = Math.round(obs.obstacleWidth * mult);
      const h1 = Math.round(obs.obstacleHeight * mult);
      const w2 = Math.round(obs.obstacleWidthTall * mult * 0.8);
      const h2 = Math.round(obs.obstacleHeightTall * mult * 0.8);
      const gap = 80;
      this.spawnOne(width + w1, w1, h1, 'obstacle_small');
      this.spawnOne(width + w1 + gap + w2, w2, h2, 'obstacle_tall');
    } else {
      const useTall = Math.random() < 0.4;
      const w = useTall ? Math.round(obs.obstacleWidthTall * mult) : Math.round(obs.obstacleWidth * mult);
      const h = useTall ? Math.round(obs.obstacleHeightTall * mult) : Math.round(obs.obstacleHeight * mult);
      const tex = useTall ? 'obstacle_tall' : 'obstacle_small';
      this.spawnOne(width + w, w, h, tex);
    }
  }

  private spawnOne(x: number, w: number, h: number, texture: string): void {
    // Origin 0.5,1: position is bottom-center. Place bottom at ground surface.
    const sprite = this.scene.physics.add.image(x, this.groundY, texture);
    sprite.setOrigin(0.5, 1);
    sprite.setDisplaySize(w, h);
    sprite.setImmovable(true);
    (sprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    sprite.refreshBody();

    this.obstacles.push({ sprite, scored: false, width: w });
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
