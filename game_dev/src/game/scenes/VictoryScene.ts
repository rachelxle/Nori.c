import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Victory' });
  }

  create(): void {
    const { width } = GAME_CONFIG;
    const cx = width / 2;

    this.cameras.main.fadeIn(400);

    const g = this.add.graphics();
    g.fillStyle(Palette.uiPanel, 0.95);
    g.fillRoundedRect(cx - 220, 80, 440, 380, 8);
    g.lineStyle(3, Palette.darkOutline);
    g.strokeRoundedRect(cx - 220, 80, 440, 380, 8);
    g.setScrollFactor(0);

    this.add.text(cx, 150, 'VICTORY!', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: hex(Palette.goldScore),
    }).setOrigin(0.5);

    this.add.text(cx, 250, 'You defeated Evil Uni!', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    }).setOrigin(0.5);

    const playAgainBtn = this.add.text(cx, 420, 'Press SPACE to Play Again', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
      backgroundColor: hex(Palette.dirt),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerover', () => playAgainBtn.setColor(hex(Palette.pinkAccent)));
    playAgainBtn.on('pointerout', () => playAgainBtn.setColor(hex(Palette.darkOutline)));
    playAgainBtn.on('pointerdown', () => this.playAgain());

    this.input.keyboard?.once('keydown-SPACE', () => this.playAgain());
  }

  private playAgain(): void {
    Progression.resetLevel();
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => {
      this.scene.start('Runner', { level: 1 });
    });
  }
}
