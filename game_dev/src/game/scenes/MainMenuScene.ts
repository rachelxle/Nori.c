import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

// Same style as Game Over: background.png + semi-transparent panel + neon border
const StartUI = {
  panelFill: 0x3a3030,
  panelAlpha: 0.62,         // more transparent so background shows through
  panelBorder: 0xff69b4,
  borderWidth: 5,
  title: 0xffe4e1,        // light pink / off-white title
  tagline: 0xffe4e1,      // light pink text
  buttonBg: 0xc45c6a,    // solid reddish-pink button
  buttonBgHover: 0xd87080,
  buttonText: 0xfff0f5,   // light pink / off-white on button
  controls: 0xffe4e1,     // light pink control instructions
} as const;

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    Progression.init();
    Progression.resetLevel();

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

    // Semi-transparent panel with thick neon pink border
    const g = this.add.graphics();
    g.fillStyle(StartUI.panelFill, StartUI.panelAlpha);
    g.fillRoundedRect(cx - 220, 70, 440, 400, 12);
    g.lineStyle(StartUI.borderWidth, StartUI.panelBorder);
    g.strokeRoundedRect(cx - 220, 70, 440, 400, 12);
    g.setScrollFactor(0);

    this.add.text(cx, 130, 'CLASH OF CLAWS', {
      fontSize: '48px',
      fontFamily: 'PixelFont',
      color: hex(StartUI.title),
    }).setOrigin(0.5);

    this.add.text(cx, 200, 'One jump. One shot. Zero mercy.', {
      fontSize: '20px',
      fontFamily: 'PixelFont',
      color: hex(StartUI.tagline),
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, 320, 'Press SPACE to Start', {
      fontSize: '24px',
      fontFamily: 'PixelFont',
      color: hex(StartUI.buttonText),
      backgroundColor: hex(StartUI.buttonBg),
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setBackgroundColor(hex(StartUI.buttonBgHover));
    });
    startBtn.on('pointerout', () => {
      startBtn.setBackgroundColor(hex(StartUI.buttonBg));
    });
    startBtn.on('pointerdown', () => this.startGame());

    this.add.text(cx, 420, 'Runner: Jump = Space/W/Up\nArena: Move = A/D, Shoot = Space, Block = K, Dodge = W/Up', {
      fontSize: '14px',
      fontFamily: 'PixelFont',
      color: hex(StartUI.controls),
      align: 'center',
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private startGame(): void {
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => {
      this.scene.start('Runner', { level: 1 });
    });
  }
}
