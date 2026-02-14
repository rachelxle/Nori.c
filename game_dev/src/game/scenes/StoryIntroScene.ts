/**
 * Story intro: 2-cat cutscene with dialogue and MP3 voice.
 * Left: Nori (orange). Right: evil cat (dark, red eyes).
 * Speech bubbles alternate by speaker. SPACE to begin/advance. SHIFT to skip.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

const DIALOGUE: { text: string; audioKey: string }[] = [
  { text: 'In a world where cats once lived in harmony...', audioKey: 'intro_01' },
  { text: 'One cat sought power beyond imagination.', audioKey: 'intro_02' },
  { text: 'But one brave orange cat refused to surrender.', audioKey: 'intro_03' },
  { text: 'The arena awaits.', audioKey: 'intro_04' },
  { text: 'Learn. Adapt. Survive.', audioKey: 'intro_05' },
  { text: 'The battle begins now.', audioKey: 'intro_06' },
];

const BUBBLE_FILL = 0xfff1e8;
const BUBBLE_OUTLINE = 0x2b2b2b;

export class StoryIntroScene extends Phaser.Scene {
  private started = false;
  private startHint!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private bubbleGraphics!: Phaser.GameObjects.Graphics;
  private startHintTween?: Phaser.Tweens.Tween;
  private leftCat!: Phaser.GameObjects.Sprite;
  private rightCat!: Phaser.GameObjects.Sprite;
  private lineIndex = 0;
  private typedLength = 0;
  private currentSound: Phaser.Sound.BaseSound | null = null;
  private lineComplete = false;
  private typingEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('StoryIntro');
  }

  create(): void {
    const { width, height } = GAME_CONFIG;

    this.cameras.main.fadeIn(400);

    // Background: sky
    const sky = this.add.graphics();
    sky.fillStyle(Palette.sky, 1);
    sky.fillRect(0, 0, width, height);
    sky.setScrollFactor(0);

    // Ground: grass
    const groundH = 80;
    const groundG = this.add.graphics();
    groundG.fillStyle(Palette.nearGrass, 1);
    groundG.fillRect(0, height - groundH, width + 100, groundH);
    groundG.fillStyle(Palette.darkDirt, 1);
    for (let x = 0; x < width + 100; x += 16) {
      groundG.fillRect(x, height - groundH + 8, 8, 8);
    }
    groundG.setScrollFactor(0);


    // Left cat: Nori (orange, normal)
    const leftCatY = height - groundH + 5;
    this.leftCat = this.add
    .sprite(160, leftCatY, 'nori')
    .setOrigin(0.5, 1)
    .setScale(1.5);

    if (this.anims.exists('nori_run')) {
    this.leftCat.play('nori_run');
    }

    // Right cat: evil (dark tint, bigger, red eyes)
    this.rightCat = this.add
    .sprite(640, leftCatY, 'nori')
    .setOrigin(0.5, 1)
    .setScale(1.7)
    .setTint(0x111111);

    if (this.anims.exists('nori_run')) {
      this.rightCat.play('nori_run');
    }

    // Red eyes (positioned on head)
    const eye1 = this.add.rectangle(this.rightCat.x - 8, this.rightCat.y - 50, 6, 4, Palette.warningRed);
    const eye2 = this.add.rectangle(this.rightCat.x + 8, this.rightCat.y - 50, 6, 4, Palette.warningRed);
    eye1.setDepth(1000);
    eye2.setDepth(1000);


    // Speech bubble container (drawn per line)
    this.bubbleGraphics = this.add.graphics();
    this.bubbleGraphics.setScrollFactor(0);
    this.bubbleGraphics.setDepth(500);

    this.dialogueText = this.add.text(width / 2, 180, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
      wordWrap: { width: 320 },
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0);
    this.dialogueText.setDepth(500);

    // "Press SPACE to begin" (blinking)
    this.startHint = this.add
      .text(width / 2, height - 50, 'Press SPACE to begin', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: hex(Palette.darkOutline),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(500);   // 👈 add depth here in chain

    this.startHintTween = this.tweens.add({
    targets: this.startHint,
    alpha: 0.2,
    duration: 600,
    yoyo: true,
    repeat: -1,
  });
    this.bubbleGraphics.clear();
    this.dialogueText.setText('');

    this.input.keyboard?.on('keydown-SPACE', this.onSpace, this);
    this.input.keyboard?.on('keydown-SHIFT', this.onShift, this);
  }

  private drawBubble(forLeftCat: boolean): void {
    const { width } = GAME_CONFIG;
    this.bubbleGraphics.clear();

    const speaker = forLeftCat ? this.leftCat : this.rightCat;
    
    const bubbleW = 360;
    const bubbleH = 100;
    const radius = 8;

    // bubble sits near the speaker
    const y = 80;

    let x = speaker.x - bubbleW / 2;
    x = Phaser.Math.Clamp(x, 20, width - bubbleW - 20);

    const tailW = 14;
    const tailH = 16;
    const tailX = Phaser.Math.Clamp(speaker.x, x + 40, x + bubbleW - 40);
    const tailY = y + bubbleH;


    this.bubbleGraphics.fillStyle(BUBBLE_FILL, 1);
    this.bubbleGraphics.lineStyle(2, BUBBLE_OUTLINE);

    this.bubbleGraphics.fillRoundedRect(x, y, bubbleW, bubbleH, radius);
    this.bubbleGraphics.strokeRoundedRect(x, y, bubbleW, bubbleH, radius);


    this.bubbleGraphics.fillTriangle(
      tailX - tailW / 2, tailY - 2,
      tailX + tailW / 2, tailY - 2,
      tailX, tailY + tailH
    );

      this.bubbleGraphics.lineBetween(tailX - tailW / 2, tailY - 2, tailX, tailY + tailH);
      this.bubbleGraphics.lineBetween(tailX + tailW / 2, tailY - 2, tailX, tailY + tailH);
      this.bubbleGraphics.lineBetween(tailX - tailW / 2, tailY - 2, tailX + tailW / 2, tailY - 2);


    this.dialogueText.setPosition(x + bubbleW / 2, y + bubbleH / 2 - 4);
  }

  private stopCurrentAudio(): void {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.destroy();
      this.currentSound = null;
    }
  }

  private startLine(index: number): void {
    if (index >= DIALOGUE.length) {
      this.goToRunner();
      return;
    }

    this.stopCurrentAudio();
    this.lineIndex = index;
    this.typedLength = 0;
    this.lineComplete = false;

    const line = DIALOGUE[index];
    const forLeftCat = index < 3;
    this.drawBubble(forLeftCat);
    this.dialogueText.setText('');

    const sound = this.sound.add(line.audioKey, { volume: 1 });
    this.currentSound = sound;
    sound.play();

    if (line.text.length === 0) {
      this.lineComplete = true;
      return;
    }
    const delay = 30;
    this.typingEvent = this.time.addEvent({
      delay,
      callback: () => {
        this.typedLength++;
        if (this.typedLength >= line.text.length) {
          this.typedLength = line.text.length;
          this.lineComplete = true;
          this.typingEvent?.destroy();
          this.typingEvent = null;
        }
        this.dialogueText.setText(line.text.slice(0, this.typedLength));
      },
      repeat: line.text.length - 1,
    });
  }

  private onSpace = (): void => {
    if (!this.started) {
      this.started = true;
      this.startHintTween?.stop();
      this.startHintTween = undefined;
      this.startHint?.destroy();
      this.sound.unlock?.();
      this.startLine(0);
      return;
    }
    if (!this.lineComplete) return;
    this.startLine(this.lineIndex + 1);
  };

  private onShift = (): void => {
    if (!this.started) {
      this.goToRunner();
      return;
    }
    this.stopCurrentAudio();
    if (this.typingEvent) {
      this.typingEvent.destroy();
      this.typingEvent = null;
    }
    if (!this.lineComplete) {
      this.lineComplete = true;
      this.dialogueText.setText(DIALOGUE[this.lineIndex].text);
      this.typedLength = DIALOGUE[this.lineIndex].text.length;
    } else {
      this.startLine(this.lineIndex + 1);
    }
  };

  private goToRunner(): void {
    this.bubbleGraphics?.clear();
    this.stopCurrentAudio();
    this.input.keyboard?.off('keydown-SPACE', this.onSpace, this);
    this.input.keyboard?.off('keydown-SHIFT', this.onShift, this);
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => {
      this.scene.start('Runner', { level: 1 });
    });
  }
}
