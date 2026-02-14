/**
 * Hybrid input: combines KeyboardInput + VisionEventInput.
 * jumpPressed and flapPressed = keyboard OR vision.
 * attackPressed, blockHeld, moveAxis = keyboard only.
 */

import type { InputProvider } from './InputProvider';

export class HybridInput implements InputProvider {
  constructor(
    private keyboard: InputProvider,
    private vision: InputProvider,
  ) {}

  flapPressed(): boolean {
    return this.keyboard.flapPressed() || this.vision.flapPressed();
  }

  attackPressed(): boolean {
    return this.keyboard.attackPressed();
  }

  blockHeld(): boolean {
    return this.keyboard.blockHeld();
  }

  moveAxis(): number {
    return this.keyboard.moveAxis();
  }

  jumpPressed(): boolean {
    return this.keyboard.jumpPressed() || this.vision.jumpPressed();
  }

  update(): void {
    if ('update' in this.keyboard && typeof this.keyboard.update === 'function') {
      this.keyboard.update();
    }
    if ('update' in this.vision && typeof this.vision.update === 'function') {
      this.vision.update();
    }
  }
}
