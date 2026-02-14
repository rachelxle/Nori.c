/**
 * Boss entity with state machine: INTRO, IDLE, TELEGRAPH, ATTACK, RECOVER, PHASE2, DEAD.
 * Attacks: Projectile Volley, Ground Slam AoE, Dash.
 * AI layer: optional BossDirector chooses next attack; fallback to random if absent or AI fails.
 */

import { GAME_CONFIG } from '../config';
import { Palette } from '../art/Palette';
import { ProjectileEntity } from './Projectile';
import type { CatArena } from './CatArena';
import type { BossDirector } from '../ai/BossDirector';
import type { BossTelemetry } from '../ai/BossTelemetry';
import type { BossDecision } from '../ai/BossDirector';

const BOSS_TEXTURE_SIZE = 32;

export enum BossState {
  INTRO = 'INTRO',
  IDLE = 'IDLE',
  TELEGRAPH = 'TELEGRAPH',
  ATTACK = 'ATTACK',
  RECOVER = 'RECOVER',
  PHASE2 = 'PHASE2',
  DEAD = 'DEAD',
}

export type BossAttackType = 'volley' | 'slam' | 'dash';

interface ArenaParams {
  bossHP: number;
  bossDamageMultiplier: number;
  bossAttackCooldownMultiplier: number;
}

export class Boss {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public hp: number;
  public maxHp: number;
  public state = BossState.INTRO;
  public phase2 = false;
  public projectiles: ProjectileEntity[] = [];
  /** Last AI/fallback decision (for HUD). */
  public lastDecision: BossDecision | null = null;

  private scene: Phaser.Scene;
  private params: ArenaParams;
  private player: CatArena;
  private stateStartTime = 0;
  private stateDuration = 0;  // For IDLE: random duration chosen on enter
  private nextAttack: BossAttackType = 'volley';
  private telegraphZone: Phaser.GameObjects.Graphics | null = null;
  private slamZone: Phaser.GameObjects.Ellipse | null = null;
  private slamTargetX = 0;
  private slamTargetY = 0;
  private dashTargetX = 0;
  private director: BossDirector | null = null;
  private telemetry: BossTelemetry | null = null;
  private pendingDecision: BossDecision | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: CatArena,
    params: ArenaParams,
    scale = 1,
    options?: { director?: BossDirector | null; telemetry?: BossTelemetry | null }
  ) {
    this.scene = scene;
    this.player = player;
    this.params = params;
    this.maxHp = params.bossHP;
    this.hp = this.maxHp;

    this.sprite = scene.physics.add.sprite(x, y, 'boss');
    this.sprite.setImmovable(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    this.sprite.setOrigin(0.5);

    this.sprite.setScale(scale);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(BOSS_TEXTURE_SIZE * scale, BOSS_TEXTURE_SIZE * scale);
    body.updateFromGameObject();

    this.stateStartTime = scene.time.now;
    this.director = options?.director ?? null;
    this.telemetry = options?.telemetry ?? null;
  }

  update(time: number): void {
    const cfg = GAME_CONFIG.boss;
    const dt = time - this.stateStartTime;

    // Phase 2 check
    if (!this.phase2 && this.hp / this.maxHp <= cfg.phase2HPThreshold) {
      this.phase2 = true;
      this.state = BossState.PHASE2;
      this.stateStartTime = time;
    }

    switch (this.state) {
      case BossState.INTRO:
        if (dt >= cfg.introDuration) {
          this.setState(BossState.IDLE, time);
        }
        break;

      case BossState.PHASE2:
        if (dt >= 500) {
          this.setState(BossState.IDLE, time);
        }
        break;

      case BossState.IDLE: {
        if (dt >= this.stateDuration) {
          if (this.pendingDecision) {
            this.lastDecision = this.pendingDecision;
            this.pendingDecision = null;
            this.nextAttack = this.lastDecision.nextAttack.toLowerCase() as BossAttackType;
            console.log(
              `BossDecision [${this.lastDecision.mode}]: ${this.lastDecision.nextAttack} — ${this.lastDecision.reason}`
            );
          } else {
            this.nextAttack = Phaser.Utils.Array.GetRandom(['volley', 'slam', 'dash']) as BossAttackType;
            this.lastDecision = {
              nextAttack: this.nextAttack.toUpperCase() as 'VOLLEY' | 'SLAM' | 'DASH',
              reason: 'random (no decision ready)',
              weights: { VOLLEY: 1, SLAM: 1, DASH: 1 },
              mode: 'FALLBACK',
            };
          }
          this.setState(BossState.TELEGRAPH, time);
        }
        break;
      }

      case BossState.TELEGRAPH: {
        const telegraphDuration = this.getTelegraphDuration();
        if (dt >= telegraphDuration) {
          this.setState(BossState.ATTACK, time);
          this.clearTelegraph();
        } else {
          this.showTelegraph(time);
        }
        break;
      }

      case BossState.ATTACK: {
        this.executeAttack(time);
        this.setState(BossState.RECOVER, time);
        break;
      }

      case BossState.RECOVER:
        if (dt >= cfg.recoverDuration) {
          this.setState(BossState.IDLE, time);
        }
        break;

      case BossState.DEAD:
        break;
    }
  }

  private setState(state: BossState, time: number): void {
    this.state = state;
    this.stateStartTime = time;
    if (state === BossState.IDLE) {
      const cfg = GAME_CONFIG.boss;
      const min = cfg.idleMinDuration / (this.phase2 ? cfg.phase2AttackFreqMultiplier : 1);
      const max = cfg.idleMaxDuration / (this.phase2 ? cfg.phase2AttackFreqMultiplier : 1);
      this.stateDuration = Phaser.Math.Between(min, max);
      const phase = this.phase2 ? 2 : 1;
      this.director?.decideNextAttack(phase).then((d) => {
        this.pendingDecision = d;
      });
    }
  }

  private getTelegraphDuration(): number {
    const cfg = GAME_CONFIG.boss;
    switch (this.nextAttack) {
      case 'volley': return cfg.telegraphDuration;
      case 'slam': return cfg.slamTelegraphDuration;
      case 'dash': return cfg.dashTelegraphDuration;
      default: return cfg.telegraphDuration;
    }
  }

  private showTelegraph(_time: number): void {
    this.clearTelegraph();
    const cfg = GAME_CONFIG.boss;

    switch (this.nextAttack) {
      case 'volley':
        this.sprite.setTint(Palette.pinkAccent);
        break;
      case 'slam': {
        this.slamTargetX = this.player.sprite.x;
        this.slamTargetY = this.player.sprite.y;
        const g = this.scene.add.graphics();
        g.fillStyle(Palette.warningRed, 0.4);
        g.fillCircle(this.slamTargetX, this.slamTargetY, cfg.slamRadius);
        g.lineStyle(2, Palette.darkOutline);
        g.strokeCircle(this.slamTargetX, this.slamTargetY, cfg.slamRadius);
        this.telegraphZone = g;
        this.slamZone = this.scene.add.ellipse(
          this.slamTargetX,
          this.slamTargetY,
          cfg.slamRadius * 2,
          cfg.slamRadius * 2,
          Palette.warningRed,
          0.5
        );
        break;
      }
      case 'dash': {
        this.sprite.setTint(Palette.goldScore);
        const g = this.scene.add.graphics();
        g.lineStyle(3, Palette.warningRed);
        g.lineBetween(this.sprite.x, this.sprite.y, this.player.sprite.x, this.player.sprite.y);
        this.telegraphZone = g;
        break;
      }
    }
  }

  private clearTelegraph(): void {
    this.sprite.clearTint();
    this.telegraphZone?.destroy();
    this.telegraphZone = null;
    this.slamZone?.destroy();
    this.slamZone = null;
  }

  private executeAttack(time: number): void {
    const cfg = GAME_CONFIG.boss;
    const mult = this.params.bossDamageMultiplier * (this.phase2 ? cfg.phase2DamageMultiplier : 1);
    const projSpeed = cfg.projectileSpeed * (this.phase2 ? cfg.phase2ProjectileSpeedMultiplier : 1);

    switch (this.nextAttack) {
      case 'volley': {
        const count = cfg.projectileCount;
        const damage = Math.floor(cfg.projectileDamage * mult);
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y,
          this.player.sprite.x, this.player.sprite.y
        );
        const spread = 0.3;
        for (let i = 0; i < count; i++) {
          const a = angle - spread / 2 + (spread * i) / (count - 1 || 1);
          const vx = Math.cos(a) * projSpeed;
          const vy = Math.sin(a) * projSpeed;
          const p = new ProjectileEntity(
            this.scene, this.sprite.x, this.sprite.y, vx, vy, damage, true
          );
          this.projectiles.push(p);
        }
        break;
      }
      case 'slam': {
        const damage = Math.floor(cfg.slamDamage * mult);
        const sx = this.slamTargetX;
        const sy = this.slamTargetY;
        this.scene.time.delayedCall(100, () => {
          const dist = Phaser.Math.Distance.Between(
            this.player.sprite.x, this.player.sprite.y,
            sx, sy
          );
          if (dist < cfg.slamRadius && !this.player.isDodging && !this.player.isInvincible) {
            this.player.hp -= damage;
            this.telemetry?.recordDamage('slam', damage);
            this.player.isInvincible = true;
            this.player.invincibleUntil = time + GAME_CONFIG.arena.player.invincibilityDuration;
            this.scene.cameras.main.shake(200, 0.01);
          }
          // Slam particles
          const e = this.scene.add.particles(sx, sy, 'slam_particle', {
              speed: 80,
              scale: { start: 1, end: 0 },
              lifespan: 400,
              quantity: 20,
              emitting: false,
            });
          e.emitParticle(20);
          this.scene.time.delayedCall(500, () => e.destroy());
        });
        break;
      }
      case 'dash': {
        const damage = Math.floor(cfg.dashDamage * mult);
        this.dashTargetX = this.player.sprite.x;
        const dir = this.dashTargetX > this.sprite.x ? 1 : -1;
        (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(dir * cfg.dashSpeed, 0);
        this.scene.time.delayedCall(300, () => {
          (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          const hit = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.player.sprite.x, this.player.sprite.y) < 60;
          if (hit && !this.player.isDodging && !this.player.isInvincible) {
            this.player.hp -= damage;
            this.telemetry?.recordDamage('dash', damage);
            this.player.isInvincible = true;
            this.player.invincibleUntil = time + GAME_CONFIG.arena.player.invincibilityDuration;
          }
        });
        break;
      }
    }
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.state = BossState.DEAD;
    }
  }

  destroy(): void {
    this.clearTelegraph();
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
    this.sprite.destroy();
  }
}
