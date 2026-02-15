import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

// Same style as Game Over: background + semi-transparent panel + neon border
const VictoryUI = {
  panelFill: 0x3a3030,
  panelAlpha: 0.62,
  panelBorder: 0xff69b4,
  borderWidth: 5,
  title: 0xff85a2,
  titleGlow: 0xff1493,
  stats: 0xdda0dd,
  buttonBg: 0xc45c6a,
  buttonBgHover: 0xd87080,
  buttonText: 0xfff0f5,
} as const;

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Victory' });
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;

    // Background: same as Game Over
    if (this.textures.exists('runner_background')) {
      const bg = this.add.image(cx, height / 2, 'runner_background').setDepth(-10);
      const scaleX = width / bg.width;
      const scaleY = height / bg.height;
      bg.setScale(Math.max(scaleX, scaleY));
    } else {
      this.cameras.main.setBackgroundColor('#2a2030');
    }

    this.cameras.main.fadeIn(400);

    // Semi-transparent panel with neon pink border (same as Game Over)
    const g = this.add.graphics();
    g.fillStyle(VictoryUI.panelFill, VictoryUI.panelAlpha);
    g.fillRoundedRect(cx - 200, 80, 400, 380, 12);
    g.lineStyle(VictoryUI.borderWidth, VictoryUI.panelBorder);
    g.strokeRoundedRect(cx - 200, 80, 400, 380, 12);
    g.setScrollFactor(0);

    const titleText = this.add.text(cx, 150, 'VICTORY!', {
      fontSize: '48px',
      fontFamily: 'PixelFont',
      color: hex(VictoryUI.title),
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, hex(VictoryUI.titleGlow), 12);

    this.add.text(cx, 250, 'You defeated the boss!', {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(VictoryUI.stats),
    }).setOrigin(0.5);

    const playAgainBtn = this.add.text(cx, 400, 'Press SPACE to Play Again', {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(VictoryUI.buttonText),
      backgroundColor: hex(VictoryUI.buttonBg),
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerover', () => {
      playAgainBtn.setBackgroundColor(hex(VictoryUI.buttonBgHover));
    });
    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setBackgroundColor(hex(VictoryUI.buttonBg));
    });
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
