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
    // No external assets - all textures generated in create
  }

  create(): void {
    generateAllTextures(this);
    generatePixelCatRunner2(this);

    this.scene.start('StoryIntro');
  }
}
