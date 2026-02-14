/**
 * Story intro scene: pixel-cute dialogue with optional TTS.
 * Placeholder graphics only (no PNGs). Fades to MainMenu at end.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { drawOrangeCat } from '../art/CatSprites';
import { speak } from '../audio/Voice';

const ENABLE_TTS = true;

const DIALOGUE = [
  'In a quiet pixel world, cats lived simple lives...',
  'Then an AI was trained to become the perfect cat.',
  'But it didn\'t just learn.',
  'It adapted.',
  'Each round, it grows. Each mistake, it remembers.',
  'Survive. Adapt. Outsmart the machine.',
];

const COLORS = {
  sky: 0x8fd3ff,
  grass: 0x46b06c,
  dirt: 0xb57b57,
  outline: 0x2b2b2b,
  bossBody: 0x1f1f1f,
  bossEyes: 0xff5c8a,
  bubbleFill: 0xfff1e8,
  cloud: 0xffffff,
} as const;

const TYPEWRITER_MS_PER_CHAR = 35;
const SHIFT_SKIP_HOLD_MS = 600;

export class StoryIntroScene extends Phaser.Scene {
  private dialogueIndex = 0;
  private displayedLength = 0;
  private lineFinished = false;
  private typewriterTimer = 0;
  private shiftHoldStart = 0;
  private bubbleContainer: Phaser.GameObjects.Container | null = null;
  private bubbleText: Phaser.GameObjects.Text | null = null;
  private skipHintText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'StoryIntro' });
  }

  create(): void {
    const { width, height } = GAME_CONFIG;

    this.cameras.main.fadeIn(400);

    this.drawBackground(width, height);
    this.drawClouds(width, height);
    const playerCat = drawOrangeCat(this, width * 0.22, height - 120);
    playerCat.setDepth(2);
    this.add.existing(playerCat);
    this.drawBossCat(width * 0.78, height - 130);

    this.bubbleContainer = this.add.container(0, 0);
    this.bubbleContainer.setDepth(10);

    this.bubbleText = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#2B2B2B',
      wordWrap: { width: 320 },
      lineSpacing: 4,
    });
    this.bubbleText.setDepth(11);

    this.skipHintText = this.add.text(width / 2, height - 18, 'SPACE: next  |  Hold SHIFT: skip', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#2B2B2B',
    });
    this.skipHintText.setOrigin(0.5, 1);
    this.skipHintText.setDepth(15);
    this.skipHintText.setAlpha(0.8);

    this.dialogueIndex = 0;
    this.displayedLength = 0;
    this.lineFinished = false;
    this.showCurrentBubble();
  }

  private drawBackground(w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.sky, 1);
    g.fillRect(0, 0, w, h);
    const stripH = 80;
    g.fillStyle(COLORS.grass, 1);
    g.fillRect(0, h - stripH, w, 35);
    g.fillStyle(COLORS.dirt, 1);
    g.fillRect(0, h - stripH + 35, w, stripH - 35);
    g.setDepth(-2);
  }

  private drawClouds(_w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.cloud, 0.9);
    const drawBlob = (cx: number, cy: number, r: number) => {
      g.fillCircle(cx, cy, r);
      g.fillCircle(cx - r * 0.6, cy, r * 0.7);
      g.fillCircle(cx + r * 0.5, cy + r * 0.2, r * 0.6);
      g.fillCircle(cx + r * 0.2, cy - r * 0.4, r * 0.5);
    };
    drawBlob(180, Math.min(100, h - 400), 40);
    drawBlob(520, Math.min(140, h - 360), 35);
    drawBlob(380, Math.min(70, h - 430), 28);
    g.setDepth(-1);
  }

  private drawBossCat(x: number, y: number): Phaser.GameObjects.Container {
    const scale = 1.2;
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    const bodyW = 48 * scale;
    const bodyH = 44 * scale;
    const outlineW = 3;

    g.fillStyle(COLORS.bossBody, 1);
    g.fillRect(0, 0, bodyW, bodyH);
    g.lineStyle(outlineW, COLORS.outline);
    g.strokeRect(0, 0, bodyW, bodyH);

    const earW = 14 * scale;
    const earH = 18 * scale;
    g.fillStyle(COLORS.bossBody, 1);
    g.fillRect(-2, -earH + 2, earW, earH);
    g.fillRect(bodyW - earW + 2, -earH + 2, earW, earH);
    g.lineStyle(outlineW, COLORS.outline);
    g.strokeRect(-2, -earH + 2, earW, earH);
    g.strokeRect(bodyW - earW + 2, -earH + 2, earW, earH);

    const eyeSize = 8;
    g.fillStyle(COLORS.bossEyes, 1);
    g.fillRect(14, 16, eyeSize, eyeSize);
    g.fillRect(bodyW - 14 - eyeSize, 16, eyeSize, eyeSize);

    container.add(g);
    container.setDepth(2);
    return container;
  }

  private showCurrentBubble(): void {
    if (this.dialogueIndex >= DIALOGUE.length) {
      this.goToMainMenu();
      return;
    }

    const line = DIALOGUE[this.dialogueIndex];
    const isPlayerSpeaking = this.dialogueIndex < 2;
    const { width, height } = GAME_CONFIG;

    if (ENABLE_TTS) speak(line, 'NARRATOR');

    this.displayedLength = 0;
    this.lineFinished = false;
    if (this.bubbleText) this.bubbleText.setText('');

    const bubbleW = 360;
    const bubbleH = 90;
    const pad = 16;
    const tailH = 14;
    const tailW = 16;

    let bubbleX: number;
    let bubbleY: number;
    let tailX: number;
    let tailPoints: number[];

    if (isPlayerSpeaking) {
      bubbleX = width * 0.08;
      bubbleY = height - 220;
      tailX = bubbleX + 50;
      tailPoints = [tailX, bubbleY + bubbleH, tailX - tailW / 2, bubbleY + bubbleH + tailH, tailX + tailW / 2, bubbleY + bubbleH + tailH];
    } else {
      bubbleX = width - bubbleW - width * 0.08;
      bubbleY = height - 220;
      tailX = bubbleX + bubbleW - 50;
      tailPoints = [tailX, bubbleY + bubbleH, tailX - tailW / 2, bubbleY + bubbleH + tailH, tailX + tailW / 2, bubbleY + bubbleH + tailH];
    }

    this.bubbleContainer?.removeAll(true);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bubbleFill, 1);
    bg.fillRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    bg.fillTriangle(tailPoints[0], tailPoints[1], tailPoints[2], tailPoints[3], tailPoints[4], tailPoints[5]);
    bg.lineStyle(3, COLORS.outline);
    bg.strokeRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    bg.strokeTriangle(tailPoints[0], tailPoints[1], tailPoints[2], tailPoints[3], tailPoints[4], tailPoints[5]);
    this.bubbleContainer?.add(bg);

    if (this.bubbleText) {
      this.bubbleText.setPosition(bubbleX + pad, bubbleY + pad);
      this.bubbleText.setDepth(11);
    }
  }

  private goToMainMenu(): void {
    if (ENABLE_TTS && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(550, () => {
      this.scene.start('MainMenu');
    });
  }

  update(time: number, dt: number): void {
    const space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    if (shift?.isDown) {
      if (this.shiftHoldStart === 0) this.shiftHoldStart = time;
      if (time - this.shiftHoldStart >= SHIFT_SKIP_HOLD_MS) {
        this.goToMainMenu();
        return;
      }
    } else {
      this.shiftHoldStart = 0;
    }

    if (this.dialogueIndex >= DIALOGUE.length) return;

    const line = DIALOGUE[this.dialogueIndex];

    if (!this.lineFinished) {
      this.typewriterTimer += dt;
      const charsToAdd = Math.floor(this.typewriterTimer / TYPEWRITER_MS_PER_CHAR);
      this.typewriterTimer %= TYPEWRITER_MS_PER_CHAR;
      this.displayedLength = Math.min(this.displayedLength + charsToAdd, line.length);
      if (this.bubbleText) this.bubbleText.setText(line.slice(0, this.displayedLength));
      if (this.displayedLength >= line.length) this.lineFinished = true;
    } else {
      if (Phaser.Input.Keyboard.JustDown(space!)) {
        this.dialogueIndex++;
        this.typewriterTimer = 0;
        this.showCurrentBubble();
      }
    }
  }
}
