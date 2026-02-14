/**
 * Cat entity for Runner (Chrome Dino-style) mode.
 * Uses InputProvider ONLY for jump. nori.png sprite with run animation.
 */

import type { InputProvider } from '../../input/InputProvider';
import { GAME_CONFIG } from '../config';

export class CatRunner {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public visual: Phaser.GameObjects.Sprite;
  public isDead = false;
  public lives: number;
  public invincibleUntil = 0;

  private input: InputProvider;
  private scene: Phaser.Scene;
  private jumpParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private landParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private startY: number;
  private wasGrounded = false;

  constructor(scene: Phaser.Scene, x: number, y: number, input: InputProvider) {
    this.scene = scene;
    this.input = input;
    this.lives = GAME_CONFIG.runner.lives;
    this.startY = y;

    this.sprite = scene.physics.add.sprite(x, y, 'cat_runner');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBodySize(14, 14);
    this.sprite.setDisplaySize(40, 40);
    (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = true;
    this.sprite.setOrigin(0.5);
    this.sprite.setVisible(false);

    this.visual = scene.add
      .sprite(this.sprite.x, this.sprite.y, 'nori')
      .setOrigin(0.5, 1)
      .setScale(1.5);
    if (this.scene.anims.exists('nori_run')) {
      this.visual.play('nori_run');
    }

    this.setupParticles();
  }

  private setupParticles(): void {
    const cfg = GAME_CONFIG.runner;
    this.jumpParticles = this.scene.add.particles(0, 0, 'particle_dust', {
      speed: { min: cfg.particleSpeed * 0.5, max: cfg.particleSpeed },
      scale: { start: 1.5, end: 0 },
      lifespan: 250,
      quantity: cfg.jumpParticleCount,
      emitting: false,
      angle: { min: 180 - 45, max: 180 + 45 },
    });

    this.landParticles = this.scene.add.particles(0, 0, 'particle_dust', {
      speed: { min: cfg.particleSpeed * 0.3, max: cfg.particleSpeed * 0.6 },
      scale: { start: 1, end: 0 },
      lifespan: 200,
      quantity: cfg.landParticleCount,
      emitting: false,
      angle: { min: 240, max: 300 },
    });
  }

  isGrounded(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  update(_dt?: number): void {
    if (this.isDead) return;

    const cfg = GAME_CONFIG.runner;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded = this.isGrounded();

    if (!this.wasGrounded && grounded) {
      this.emitLandParticles();
    }
    this.wasGrounded = grounded;

    if (this.input.jumpPressed() && grounded) {
      this.sprite.setVelocityY(cfg.jumpImpulse);
      this.emitJumpParticles();
    }

    if (body.velocity.y > cfg.maxFallSpeed) {
      this.sprite.setVelocityY(cfg.maxFallSpeed);
    }

    this.visual.setPosition(this.sprite.x, this.sprite.y);
  }

  private emitJumpParticles(): void {
    if (!this.jumpParticles) return;
    this.jumpParticles.setPosition(this.sprite.x, this.sprite.y);
    this.jumpParticles.emitParticle(GAME_CONFIG.runner.jumpParticleCount);
  }

  private emitLandParticles(): void {
    if (!this.landParticles) return;
    this.landParticles.setPosition(this.sprite.x, this.sprite.y);
    this.landParticles.emitParticle(GAME_CONFIG.runner.landParticleCount);
  }

  die(time: number): void {
    const invincibilityMs = 1500;
    this.invincibleUntil = time + invincibilityMs;
    this.lives--;
    if (this.lives <= 0) {
      this.isDead = true;
    } else {
      this.sprite.setPosition(this.sprite.x, this.startY);
      this.sprite.setVelocity(0, 0);
    }
  }

  destroy(): void {
    this.jumpParticles?.destroy();
    this.landParticles?.destroy();
    this.visual.destroy();
    this.sprite.destroy();
  }
}
