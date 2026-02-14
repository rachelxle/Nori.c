/**
 * Arena scene: boss fight with pixel-art visuals.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';
import { Palette } from '../art/Palette';
import { CatArena } from '../entities/CatArena';
import { ProjectileEntity } from '../entities/Projectile';
import { Combat } from '../systems/Combat';
import { Boss, BossState } from '../entities/Boss';
import { KeyboardInput } from '../../input/KeyboardInput';
import type { InputProvider } from '../../input/InputProvider';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class ArenaScene extends Phaser.Scene {
  private inputProvider!: InputProvider;
  private cat!: CatArena;
  private boss!: Boss;
  private projectiles: ProjectileEntity[] = [];
  private level = 1;
  private arenaParams = { bossHP: 250, bossDamageMultiplier: 1, bossAttackCooldownMultiplier: 1 };
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private dodgeCooldownBar!: Phaser.GameObjects.Graphics;
  private gameOver = false;
  private victoryOverlay: Phaser.GameObjects.Container | null = null;
  private currentBossSound: Phaser.Sound.BaseSound | null = null;
  private bossTauntIndex = 0;

  constructor() {
    super({ key: 'Arena' });
  }

  init(data: { level?: number }): void {
    this.level = data.level ?? Progression.getCurrentLevel();
    Progression.setCurrentLevel(this.level);
    this.arenaParams = Progression.getArenaParams(this.level);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;

    this.cameras.main.fadeIn(400);

    const reg = this.registry.get('inputProvider') as InputProvider | undefined;
    this.inputProvider = reg ?? new KeyboardInput(this);
    if ('setScene' in this.inputProvider) {
      (this.inputProvider as { setScene: (s: Phaser.Scene) => void }).setScene(this);
    }

    // Arena background - stone wall
    const g = this.add.graphics();
    g.fillStyle(0x9a8b7a, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(Palette.darkDirt, 1);
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        if ((x + y) % 64 === 0) g.fillRect(x, y, 32, 32);
      }
    }
    g.generateTexture('arena_bg', width, height);
    g.destroy();
    this.add.image(width / 2, height / 2, 'arena_bg').setDepth(-2);

    // Ground
    const groundG = this.add.graphics();
    groundG.fillStyle(Palette.dirt, 1);
    groundG.fillRect(0, 0, width + 100, 100);
    groundG.fillStyle(Palette.darkDirt, 1);
    for (let x = 0; x < width + 100; x += 16) {
      groundG.fillRect(x, 40, 8, 8);
    }
    groundG.generateTexture('arena_ground', width + 100, 100);
    groundG.destroy();
    this.add.image(width / 2, height - 30, 'arena_ground').setDepth(-1);

    const ground = this.add.rectangle(width / 2, height - 20, width + 100, 80, Palette.dirt, 0);
    ground.setVisible(false);
    this.physics.add.existing(ground, true);

    this.cat = new CatArena(this, 120, height - 80, this.inputProvider);
    this.physics.add.collider(this.cat.sprite, ground);

    const bossScale = Progression.getBossScale(this.level);
    this.boss = new Boss(this, width - 140, height - 100, this.cat, this.arenaParams, bossScale);
    this.physics.add.collider(this.boss.sprite, ground);
    this.physics.add.collider(this.boss.sprite, this.cat.sprite, () => {});

    this.playerHpBar = this.add.graphics();
    this.bossHpBar = this.add.graphics();
    this.dodgeCooldownBar = this.add.graphics();

    this.createUI(width, height);

    // BOSS N title
    const bossTitle = this.add.text(width / 2, height / 2 - 60, `BOSS ${this.level}`, {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: hex(Palette.warningRed),
    }).setOrigin(0.5).setDepth(100);
    bossTitle.setShadow(2, 2, hex(Palette.darkOutline), 2);
    this.tweens.add({ targets: bossTitle, alpha: 0, duration: 1200, delay: 400 });
  }

  private stopBossAudio(): void {
    if (this.currentBossSound && this.currentBossSound.isPlaying) {
      this.currentBossSound.stop();
      this.currentBossSound = null;
    }
  }

  private playBossAudioOnTransition(from: BossState, to: BossState): void {
    if (from === to) return;
    this.stopBossAudio();
    if (to === BossState.PHASE2) {
      const s = this.sound.add('boss_phase2', { volume: 1 });
      this.currentBossSound = s;
      s.play();
      return;
    }
    if (to === BossState.TELEGRAPH) {
      const taunts = ['boss_taunt', 'boss_prediction', 'boss_toosoon', 'boss_learn'] as const;
      const key = taunts[this.bossTauntIndex % taunts.length];
      this.bossTauntIndex++;
      const s = this.sound.add(key, { volume: 1 });
      this.currentBossSound = s;
      s.play();
    }
  }

  private createUI(width: number, height: number): void {
    const panelH = 45;
    const g = this.add.graphics();
    g.fillStyle(Palette.uiPanel, 0.95);
    g.fillRoundedRect(10, 10, width - 20, panelH, 4);
    g.lineStyle(2, Palette.darkOutline);
    g.strokeRoundedRect(10, 10, width - 20, panelH, 4);
    g.setScrollFactor(0);
    g.setDepth(10);

    this.add.text(25, 18, 'Player HP', { fontSize: '14px', fontFamily: 'monospace', color: hex(Palette.darkOutline) }).setScrollFactor(0).setDepth(11);
    this.add.text(width - 180, 18, 'Boss HP', { fontSize: '14px', fontFamily: 'monospace', color: hex(Palette.darkOutline) }).setScrollFactor(0).setDepth(11);
    this.add.text(width / 2 - 60, 18, 'Dodge', { fontSize: '12px', fontFamily: 'monospace', color: hex(Palette.darkOutline) }).setScrollFactor(0).setDepth(11);
    this.add.text(width / 2, height - 25, 'Move: A/D  Shoot: Space  Block: K  Dodge: W/Up', { fontSize: '12px', fontFamily: 'monospace', color: hex(Palette.darkOutline) }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
  }

  private updateHUD(): void {
    const { width } = GAME_CONFIG;
    const time = this.time.now;

    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(Palette.darkDirt, 1);
    this.playerHpBar.fillRect(25, 36, 150, 10);
    this.playerHpBar.fillStyle(Palette.pinkAccent, 1);
    this.playerHpBar.fillRect(25, 36, 150 * (this.cat.hp / this.cat.maxHp), 10);
    this.playerHpBar.setScrollFactor(0);
    this.playerHpBar.setDepth(11);

    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(Palette.darkDirt, 1);
    this.bossHpBar.fillRect(width - 175, 36, 150, 10);
    this.bossHpBar.fillStyle(Palette.warningRed, 1);
    this.bossHpBar.fillRect(width - 175, 36, 150 * (this.boss.hp / this.boss.maxHp), 10);
    this.bossHpBar.setScrollFactor(0);
    this.bossHpBar.setDepth(11);

    const dodgePct = this.cat.getDodgeCooldownProgress(time);
    this.dodgeCooldownBar.clear();
    this.dodgeCooldownBar.fillStyle(Palette.darkDirt, 1);
    this.dodgeCooldownBar.fillRect(width / 2 - 55, 36, 100, 8);
    this.dodgeCooldownBar.fillStyle(Palette.sky, 1);
    this.dodgeCooldownBar.fillRect(width / 2 - 55, 36, 100 * dodgePct, 8);
    this.dodgeCooldownBar.setScrollFactor(0);
    this.dodgeCooldownBar.setDepth(11);
  }

  update(_time: number, _dt: number): void {
    if (this.gameOver) return;

    const time = this.time.now;

    const attackResult = this.cat.update(time);
    if (attackResult?.shoot && this.boss.state !== BossState.DEAD) {
      const speed = GAME_CONFIG.arena.player.projectileSpeed;
      const proj = new ProjectileEntity(
        this,
        this.cat.sprite.x + 25,
        this.cat.sprite.y - 10,
        speed,
        0,
        attackResult.damage,
        false
      );
      this.projectiles.push(proj);
    }

    if (this.boss.state !== BossState.DEAD) {
      const prevState = this.boss.state;
      this.boss.update(time);
      this.playBossAudioOnTransition(prevState, this.boss.state);
    }

    for (const p of this.boss.projectiles) {
      if (!this.projectiles.includes(p)) {
        this.projectiles.push(p);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.sprite.x < -50 || p.sprite.x > GAME_CONFIG.width + 50) {
        p.destroy();
        this.projectiles.splice(i, 1);
        if (p.fromBoss) this.boss.projectiles = this.boss.projectiles.filter((x) => x !== p);
        continue;
      }
      if (p.fromBoss) {
        if (this.physics.overlap(p.sprite, this.cat.sprite)) {
          if (!this.cat.isDodging && !this.cat.isInvincible) {
            Combat.applyDamage(
              this.cat,
              p.damage,
              p.sprite.x,
              p.sprite.y,
              this,
              { knockback: true, blockReduction: this.cat.getBlockReduction() }
            );
          }
          p.destroy();
          this.projectiles.splice(i, 1);
          this.boss.projectiles = this.boss.projectiles.filter((x) => x !== p);
        }
      } else if (this.physics.overlap(p.sprite, this.boss.sprite) && this.boss.state !== BossState.DEAD) {
        this.boss.takeDamage(p.damage);
        this.cameras.main.shake(80, 0.003);
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    if (this.boss.state === BossState.DEAD && !this.victoryOverlay) {
      this.onBossDefeated();
    }

    if (this.cat.hp <= 0) {
      this.gameOver = true;
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => {
        this.scene.start('GameOver', { level: this.level });
      });
      return;
    }

    this.updateHUD();

    if ('update' in this.inputProvider && typeof this.inputProvider.update === 'function') {
      this.inputProvider.update();
    }
  }

  private onBossDefeated(): void {
    const { width, height } = GAME_CONFIG;

    const emitter = this.add.particles(this.boss.sprite.x, this.boss.sprite.y, 'boss_death_particle', {
      speed: 100,
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 30,
      emitting: false,
    });
    emitter.emitParticle(30);
    this.time.delayedCall(700, () => emitter.destroy());

    this.cameras.main.shake(300, 0.01);
    this.victoryOverlay = this.add.container();
    const bg = this.add.rectangle(width / 2, height / 2, width, height, Palette.darkOutline, 0.7);
    const text = this.add.text(width / 2, height / 2, 'Boss Defeated!', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: hex(Palette.nearGrass),
    }).setOrigin(0.5);
    text.setShadow(2, 2, hex(Palette.darkOutline), 2);
    this.victoryOverlay.add([bg, text]);
    this.victoryOverlay.setDepth(50);

    Progression.advanceLevel();

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => {
        if (Progression.isFinalLevel()) {
          this.scene.start('Victory');
        } else {
          this.scene.start('Runner', { level: Progression.getCurrentLevel() });
        }
      });
    });
  }
}
