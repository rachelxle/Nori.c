import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  init(data: { level?: number }): void {
    const level = data.level ?? 1;
    Progression.setBestLevel(level);
  }

  create(): void {
    const { width } = GAME_CONFIG;
    const cx = width / 2;

    this.cameras.main.fadeIn(400);

    const g = this.add.graphics();
    g.fillStyle(Palette.uiPanel, 0.95);
    g.fillRoundedRect(cx - 200, 80, 400, 380, 8);
    g.lineStyle(3, Palette.darkOutline);
    g.strokeRoundedRect(cx - 200, 80, 400, 380, 8);
    g.setScrollFactor(0);

    this.add.text(cx, 150, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: hex(Palette.warningRed),
    }).setOrigin(0.5);

    const level_val = Progression.getCurrentLevel();
    const best = Progression.getBestLevel();

    this.add.text(cx, 250, `Level Reached: ${level_val}`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    }).setOrigin(0.5);

    this.add.text(cx, 300, `Best Level: ${best}`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.goldScore),
    }).setOrigin(0.5);

    const restartBtn = this.add.text(cx, 400, 'Press SPACE to Restart', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
      backgroundColor: hex(Palette.dirt),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor(hex(Palette.pinkAccent)));
    restartBtn.on('pointerout', () => restartBtn.setColor(hex(Palette.darkOutline)));
    restartBtn.on('pointerdown', () => this.restart());

    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  private restart(): void {
    Progression.resetLevel();
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => {
      this.scene.start('Runner', { level: 1 });
    });
  }
}
