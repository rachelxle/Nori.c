import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

// Neon / sunset Game Over style (background.png visible behind panel)
const GameOverUI = {
  panelFill: 0x3a3030,      // semi-transparent dusky pinkish-purple
  panelAlpha: 0.62,         // more transparent so background shows through
  panelBorder: 0xff69b4,    // neon pink border
  borderWidth: 5,
  title: 0xff85a2,          // bright glowing neon pink "GAME OVER"
  titleGlow: 0xff1493,     // fuchsia glow
  stats: 0xdda0dd,         // muted light purple (Level Reached / Best Level)
  buttonBg: 0xc45c6a,      // solid darker pink button
  buttonBgHover: 0xd87080,
  buttonText: 0xfff0f5,    // white / very light pink text on button
} as const;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  init(data: { level?: number }): void {
    const level = data.level ?? 1;
    Progression.setBestLevel(level);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;

    // Background: cover the whole screen (aspect ratio preserved, no stretching)
    if (this.textures.exists('runner_background')) {
      const bg = this.add.image(cx, height / 2, 'runner_background').setDepth(-10);
      const scaleX = width / bg.width;
      const scaleY = height / bg.height;
      bg.setScale(Math.max(scaleX, scaleY));
    } else {
      this.cameras.main.setBackgroundColor('#2a2030');
    }

    this.cameras.main.fadeIn(400);

    // Semi-transparent panel (landscape shows through) with neon pink border
    const g = this.add.graphics();
    g.fillStyle(GameOverUI.panelFill, GameOverUI.panelAlpha);
    g.fillRoundedRect(cx - 200, 80, 400, 380, 12);
    g.lineStyle(GameOverUI.borderWidth, GameOverUI.panelBorder);
    g.strokeRoundedRect(cx - 200, 80, 400, 380, 12);
    g.setScrollFactor(0);

    const titleText = this.add.text(cx, 150, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'PixelFont',
      color: hex(GameOverUI.title),
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, hex(GameOverUI.titleGlow), 12);

    const level_val = Progression.getCurrentLevel();
    const best = Progression.getBestLevel();

    this.add.text(cx, 250, `Level Reached: ${level_val}`, {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(GameOverUI.stats),
    }).setOrigin(0.5);

    this.add.text(cx, 300, `Best Level: ${best}`, {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(GameOverUI.stats),
    }).setOrigin(0.5);

    const restartBtn = this.add.text(cx, 400, 'Press SPACE to Restart', {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(GameOverUI.buttonText),
      backgroundColor: hex(GameOverUI.buttonBg),
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => {
      restartBtn.setBackgroundColor(hex(GameOverUI.buttonBgHover));
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setBackgroundColor(hex(GameOverUI.buttonBg));
    });
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
