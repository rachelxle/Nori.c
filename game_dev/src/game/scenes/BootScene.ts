import Phaser from 'phaser';
import { generateAllTextures, generatePixelCatRunner2 } from '../art/PixelTextures';

/**
 * Boot scene: generates all pixel-art textures, then goes to MainMenu.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.load.spritesheet('nori', 'assets/sprites/nori.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    // Intro cutscene voice lines
    for (let i = 1; i <= 6; i++) {
      this.load.audio(`intro_0${i}`, `audio/intro_0${i}.mp3`);
    }
    // Boss taunt voice lines
    this.load.audio('boss_learn', 'audio/boss_learn.mp3');
    this.load.audio('boss_phase2', 'audio/boss_phase2.mp3');
    this.load.audio('boss_prediction', 'audio/boss_prediction.mp3');
    this.load.audio('boss_taunt', 'audio/boss_taunt.mp3');
    this.load.audio('boss_try_again', 'audio/boss_try_again.mp3');
    this.load.audio('boss_toosoon', 'audio/boss_toosoon.mp3');
  }

  create(): void {
    generateAllTextures(this);
    generatePixelCatRunner2(this);

    if (!this.anims.exists('nori_run')) {
      this.anims.create({
        key: 'nori_run',
        frames: this.anims.generateFrameNumbers('nori', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    this.scene.start('StoryIntro');
  }
}
