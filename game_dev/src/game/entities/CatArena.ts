/**
 * Cat entity for Arena (Boss fight) mode. Pixel-art cat.
 */

import type { InputProvider } from '../../input/InputProvider';
import { GAME_CONFIG } from '../config';

export class CatArena {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public hp: number;
  public maxHp: number;
  public isInvincible = false;
  public invincibleUntil = 0;
  public isBlocking = false;
  public isDodging = false;
  public dodgeEndTime = 0;
  public dodgeCooldownUntil = 0;
  public attackCooldownUntil = 0;

  private input: InputProvider;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, input: InputProvider) {
    this.scene = scene;
    this.input = input;

    const cfg = GAME_CONFIG.arena.player;
    this.maxHp = cfg.hp;
    this.hp = this.maxHp;

    this.sprite = scene.physics.add.sprite(x, y, 'cat_arena');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDrag(800, 0);
    (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = true;
    this.sprite.setOrigin(0.5);
    this.sprite.setDisplaySize(40, 40);
  }

  update(time: number): { shoot: boolean; damage: number } | null {
    const cfg = GAME_CONFIG.arena.player;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.isInvincible && time >= this.invincibleUntil) {
      this.isInvincible = false;
    }

    this.isBlocking = this.input.blockHeld();

    if (this.isDodging) {
      if (time >= this.dodgeEndTime) {
        this.isDodging = false;
        body.setVelocity(0, 0);
      }
      return null;
    }

    if (this.input.jumpPressed() && time >= this.dodgeCooldownUntil) {
      this.isDodging = true;
      this.dodgeEndTime = time + cfg.dodgeDuration;
      this.dodgeCooldownUntil = time + cfg.dodgeCooldown;
      this.isInvincible = true;
      this.invincibleUntil = time + cfg.dodgeDuration;
      const dir = this.input.moveAxis() || (this.sprite.flipX ? -1 : 1);
      body.setVelocity(dir * cfg.dodgeSpeed, cfg.jumpForce);
      return null;
    }

    if (!this.isDodging) {
      const axis = this.input.moveAxis();
      body.setVelocityX(axis * cfg.moveSpeed);
      if (axis !== 0) this.sprite.setFlipX(axis < 0);
    }

    if (this.input.attackPressed() && time >= this.attackCooldownUntil) {
      this.attackCooldownUntil = time + cfg.attackCooldown;
      return { shoot: true, damage: cfg.attackDamage };
    }

    return null;
  }

  getBlockReduction(): number {
    return this.isBlocking ? GAME_CONFIG.arena.player.blockReduction : 0;
  }

  getDodgeCooldownProgress(time: number): number {
    const cfg = GAME_CONFIG.arena.player;
    if (time >= this.dodgeCooldownUntil) return 1;
    return (time - (this.dodgeCooldownUntil - cfg.dodgeCooldown)) / cfg.dodgeCooldown;
  }
}
