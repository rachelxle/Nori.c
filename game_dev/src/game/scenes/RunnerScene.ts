/**
 * Runner (Chrome Dino-style) scene: pixel-art nature background, parallax.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression, MAX_LEVEL } from '../state/Progression';
import { CatRunner } from '../entities/CatRunner';
import { ObstacleManager } from '../entities/ObstacleManager';
import { KeyboardInput } from '../../input/KeyboardInput';
import { Palette } from '../art/Palette';
import type { InputProvider } from '../../input/InputProvider';

export class RunnerScene extends Phaser.Scene {
  private inputProvider!: InputProvider;
  private cat!: CatRunner;
  private obstacleManager!: ObstacleManager;
  private level = 1;
  private score = 0;
  private runnerTuning = Progression.getRunnerTuning(1);
  private scoreText!: Phaser.GameObjects.Text;
  private levelClearedOverlay: Phaser.GameObjects.Container | null = null;
  private groundY = 0;
  private scoreParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private lastScroll = 0;

  constructor() {
    super({ key: 'Runner' });
  }

  init(data: { level?: number }): void {
    this.level = data.level ?? 1;
    Progression.setCurrentLevel(this.level);
    this.score = 0;
    this.runnerTuning = Progression.getRunnerTuning(this.level);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;

    this.cameras.main.fadeIn(400);

    const reg = this.registry.get('inputProvider') as InputProvider | undefined;
    this.inputProvider = reg ?? new KeyboardInput(this);
    if ('setScene' in this.inputProvider) {
      (this.inputProvider as { setScene: (s: Phaser.Scene) => void }).setScene(this);
    }

    this.physics.world.gravity.y = GAME_CONFIG.runner.gravity;

    // Your pixel-art landscape background (sky, pink clouds, hills, foliage)
    this.add.image(width / 2, height / 2, 'runner_background').setDepth(-10).setDisplaySize(width, height);

    // Ground - pixel grass + dirt
    const groundHeight = 60;
    this.groundY = height - groundHeight / 2;
    const groundTop = this.groundY - groundHeight / 2;
    const g = this.add.graphics();
    g.fillStyle(Palette.dirt, 1);
    g.fillRect(0, 0, width + 400, groundHeight);
    g.fillStyle(Palette.nearGrass, 1);
    g.fillRect(0, 0, width + 400, 12);
    g.fillStyle(Palette.darkDirt, 1);
    for (let x = 0; x < width + 400; x += 8) {
      for (let y = 14; y < groundHeight; y += 8) {
        g.fillRect(x, y, 4, 4);
      }
    }
    g.generateTexture('runner_ground', width + 400, groundHeight);
    g.destroy();

    const groundSprite = this.add.tileSprite(width / 2, this.groundY, width + 400, groundHeight, 'runner_ground');
    groundSprite.setDepth(-0.5);

    const ground = this.add.rectangle(width / 2, this.groundY, width + 200, groundHeight, Palette.dirt, 0);
    ground.setVisible(false);
    this.physics.add.existing(ground, true);

    const catBottomY = groundTop + 5;
    const catY = catBottomY - 20;
    this.cat = new CatRunner(this, 120, catY, this.inputProvider);
    this.physics.add.collider(this.cat.sprite, ground);

    this.obstacleManager = new ObstacleManager(this, this.runnerTuning, this.groundY - groundHeight / 2);
    this.obstacleManager.onScore = () => this.addScore();

    this.scoreParticles = this.add.particles(0, 0, 'particle_heart', {
      speed: 30,
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 3,
      emitting: false,
    });

    this.createUI(width, height);

    // Level title
    const levelTitle = this.add.text(width / 2, height / 2 - 40, `LEVEL ${this.level}`, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: hex(Palette.goldScore),
    }).setOrigin(0.5).setDepth(100);
    levelTitle.setShadow(2, 2, hex(Palette.darkOutline), 2);
    this.tweens.add({ targets: levelTitle, alpha: 0, duration: 1500, delay: 500 });
  }

  private createUI(width: number, height: number): void {
    const panelH = 50;
    const panelW = 200;
    const pg = this.add.graphics();
    pg.fillStyle(Palette.uiPanel, 0.95);
    pg.fillRoundedRect(10, 10, panelW, panelH, 4);
    pg.lineStyle(2, Palette.darkOutline);
    pg.strokeRoundedRect(10, 10, panelW, panelH, 4);
    pg.setScrollFactor(0);
    pg.setDepth(10);

    this.scoreText = this.add.text(30, 22, `Score: ${this.score}`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: hex(Palette.goldScore),
    }).setScrollFactor(0).setDepth(11);

    const pg2 = this.add.graphics();
    pg2.fillStyle(Palette.uiPanel, 0.95);
    pg2.fillRoundedRect(width - panelW - 10, 10, panelW, panelH, 4);
    pg2.lineStyle(2, Palette.darkOutline);
    pg2.strokeRoundedRect(width - panelW - 10, 10, panelW, panelH, 4);
    pg2.setScrollFactor(0);
    pg2.setDepth(10);

    this.add.text(width - panelW + 10, 22, `Level ${this.level}/${MAX_LEVEL}`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    }).setScrollFactor(0).setDepth(11);

    this.add.text(width / 2, height - 20, 'Jump: Space / W / Up', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
  }

  private addScore(): void {
    this.score += 5;
    this.scoreText.setText(`Score: ${this.score}`);
    if (this.scoreParticles) {
      this.scoreParticles.setPosition(this.cat.sprite.x, this.cat.sprite.y - 20);
      this.scoreParticles.emitParticle(3);
    }
    if (this.score >= this.runnerTuning.targetScore) {
      this.completeLevel();
    }
  }

  private onCatHit(): void {
    if (this.cat.isDead) return;
    if (this.time.now < this.cat.invincibleUntil) return;
    this.cat.die(this.time.now);
    if (this.cat.isDead) {
      this.goGameOver();
    } else {
      this.scoreText.setText(`Score: ${this.score} | Lives: ${this.cat.lives}`);
    }
  }

  private completeLevel(): void {
    this.physics.pause();
    this.levelClearedOverlay = this.add.container();
    const { width, height } = GAME_CONFIG;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, Palette.darkOutline, 0.7);
    const text = this.add.text(width / 2, height / 2, 'Level Cleared!', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: hex(Palette.nearGrass),
    }).setOrigin(0.5);
    text.setShadow(2, 2, hex(Palette.darkOutline), 2);
    this.levelClearedOverlay.add([bg, text]);
    this.levelClearedOverlay.setDepth(50);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(450, () => {
        this.scene.start('Arena', { level: this.level });
      });
    });
  }

  private goGameOver(): void {
    this.physics.pause();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(450, () => {
      this.scene.start('GameOver', { level: this.level });
    });
  }

  update(_time: number, dt: number): void {
    if (this.levelClearedOverlay) return;

    const speed = this.runnerTuning.scrollSpeed * (dt / 1000);
    this.lastScroll += speed;

    const catBody = this.cat.sprite.body as Phaser.Physics.Arcade.Body;
    if (this.obstacleManager.checkOverlap(catBody)) {
      this.onCatHit();
    }

    const scoreGain = Math.floor((dt / 1000) * GAME_CONFIG.runnerScorePerSecond);
    if (scoreGain > 0) {
      this.score += scoreGain;
      this.scoreText.setText(`Score: ${this.score}`);
      if (this.score >= this.runnerTuning.targetScore) {
        this.completeLevel();
      }
    }

    this.cat.update(dt);
    this.obstacleManager.update(dt, this.cat.sprite.x);

    if ('update' in this.inputProvider && typeof this.inputProvider.update === 'function') {
      this.inputProvider.update();
    }
  }
}

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
