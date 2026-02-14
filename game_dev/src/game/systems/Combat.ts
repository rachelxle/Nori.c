/**
 * Combat system: damage, invincibility frames, knockback, screen shake.
 */

import { GAME_CONFIG } from '../config';

export interface Damageable {
  hp: number;
  maxHp: number;
  isInvincible?: boolean;
  invincibleUntil?: number;
  sprite?: Phaser.GameObjects.GameObject & { x: number; y: number };
  onDamaged?: (damage: number, fromX: number, fromY: number) => void;
}

export class Combat {
  static applyDamage(
    target: Damageable,
    amount: number,
    fromX: number,
    fromY: number,
    scene: Phaser.Scene,
    options?: {
      knockback?: boolean;
      blockReduction?: number;
      damageSource?: 'volley' | 'slam' | 'dash';
      onDamageRecorded?: (source: 'volley' | 'slam' | 'dash', amount: number) => void;
    }
  ): void {
    if (target.isInvincible && (target.invincibleUntil ?? 0) > scene.time.now) {
      return;
    }

    let dmg = amount;
    if (options?.blockReduction && options.blockReduction > 0) {
      dmg = Math.floor(dmg * (1 - options.blockReduction));
    }

    target.hp = Math.max(0, target.hp - dmg);
    target.onDamaged?.(dmg, fromX, fromY);
    if (options?.damageSource && options?.onDamageRecorded) {
      options.onDamageRecorded(options.damageSource, dmg);
    }

    // Invincibility frames (player only - config)
    const cfg = GAME_CONFIG.arena.player;
    target.isInvincible = true;
    target.invincibleUntil = scene.time.now + cfg.invincibilityDuration;

    // Knockback
    if (options?.knockback && target.sprite) {
      const dx = target.sprite.x - fromX;
      const dy = target.sprite.y - fromY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const body = (target.sprite as any).body;
      if (body && body.setVelocity) {
        body.setVelocity(nx * cfg.knockbackForce, ny * cfg.knockbackForce);
      }
    }

    // Screen shake
    scene.cameras.main.shake(150, 0.005);
  }

  static updateInvincibility(target: Damageable, time: number): void {
    if (target.isInvincible && target.invincibleUntil && time >= target.invincibleUntil) {
      target.isInvincible = false;
    }
  }
}
