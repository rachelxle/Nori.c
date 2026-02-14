import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Progression } from '../state/Progression';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    Progression.init();
    Progression.resetLevel();

    const { width } = GAME_CONFIG;
    const cx = width / 2;

    this.cameras.main.fadeIn(400);

    const g = this.add.graphics();
    g.fillStyle(Palette.uiPanel, 0.9);
    g.fillRoundedRect(cx - 220, 80, 440, 380, 8);
    g.lineStyle(3, Palette.darkOutline);
    g.strokeRoundedRect(cx - 220, 80, 440, 380, 8);
    g.setScrollFactor(0);

    this.add.text(cx, 140, 'SILLYCON', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: hex(Palette.goldScore),
    }).setOrigin(0.5);

    this.add.text(cx, 200, 'Cat Runner & Arena Boss', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, 320, 'Press SPACE to Start', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
      backgroundColor: hex(Palette.dirt),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor(hex(Palette.pinkAccent)));
    startBtn.on('pointerout', () => startBtn.setColor(hex(Palette.darkOutline)));
    startBtn.on('pointerdown', () => this.startGame());

    this.add.text(cx, 420, 'Runner: Jump = Space/W/Up\nArena: Move = A/D, Attack = J/Space, Block = K, Dodge = W/Up', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
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
