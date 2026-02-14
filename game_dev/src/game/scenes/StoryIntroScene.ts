/**
 * Story intro: cutscene with 6 dialogue lines and MP3 voice.
 * intro_01..intro_06 play per line. SPACE advances when done. SHIFT skips and stops audio.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

const DIALOGUE: { text: string; audioKey: string }[] = [
  { text: 'Another day in the arena...', audioKey: 'intro_01' },
  { text: 'The bosses grow stronger with each level.', audioKey: 'intro_02' },
  { text: 'But Nori has trained hard.', audioKey: 'intro_03' },
  { text: 'Jump over obstacles. Fight the boss.', audioKey: 'intro_04' },
  { text: 'Can you defeat all five?', audioKey: 'intro_05' },
  { text: 'Nori is ready to run!', audioKey: 'intro_06' },
];

export class StoryIntroScene extends Phaser.Scene {
  private dialogueText!: Phaser.GameObjects.Text;
  private lineIndex = 0;
  private typedLength = 0;
  private currentSound: Phaser.Sound.BaseSound | null = null;
  private lineComplete = false;
  private typingEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'StoryIntro' });
  }

  create(): void {
    const { width } = GAME_CONFIG;
    const cx = width / 2;

    this.cameras.main.fadeIn(400);

    const g = this.add.graphics();
    g.fillStyle(Palette.uiPanel, 0.9);
    g.fillRoundedRect(cx - 200, 60, 400, 300, 8);
    g.lineStyle(3, Palette.darkOutline);
    g.strokeRoundedRect(cx - 200, 60, 400, 300, 8);
    g.setScrollFactor(0);

    this.dialogueText = this.add.text(cx, 150, '', {
      fontSize: '18px',
      fontFamily: 'PixelFont',
      color: hex(Palette.darkOutline),
      wordWrap: { width: 360 },
      align: 'center',
    }).setOrigin(0.5);

    const nori = this.add
      .sprite(cx, 260, 'nori')
      .setOrigin(0.5, 1)
      .setScale(1.5);
    if (this.anims.exists('nori_run')) {
      nori.play('nori_run');
    }

    this.add.text(cx, 320, 'SPACE to continue  |  SHIFT to skip', {
      fontSize: '12px',
      fontFamily: 'PixelFont',
      color: hex(Palette.goldScore),
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-SPACE', this.onSpace, this);
    this.input.keyboard?.on('keydown-SHIFT', this.onShift, this);

    this.startLine(0);
  }

  private stopCurrentAudio(): void {
    if (this.currentSound && this.currentSound.isPlaying) {
      this.currentSound.stop();
      this.currentSound = null;
    }
  }

  private startLine(index: number): void {
    if (index >= DIALOGUE.length) {
      this.goToMenu();
      return;
    }

    this.stopCurrentAudio();
    this.lineIndex = index;
    this.typedLength = 0;
    this.lineComplete = false;

    const line = DIALOGUE[index];
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
    if (!this.lineComplete) return;
    this.startLine(this.lineIndex + 1);
  };

  private onShift = (): void => {
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

  private goToMenu(): void {
    this.stopCurrentAudio();
    this.input.keyboard?.off('keydown-SPACE', this.onSpace, this);
    this.input.keyboard?.off('keydown-SHIFT', this.onShift, this);
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => {
      this.scene.start('MainMenu');
    });
  }
}
