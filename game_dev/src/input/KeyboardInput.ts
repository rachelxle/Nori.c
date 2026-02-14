/**
 * Keyboard implementation of InputProvider.
 * Runner: Flap = Space, W, Up
 * Arena: Move = A/D or Left/Right, Attack = J or Space, Block = K (hold), Dodge = W or Up
 */

import type { InputProvider } from './InputProvider';

const KEYS = {
  flap: ['Space', 'KeyW', 'ArrowUp'],
  attack: ['Space', 'KeyJ'],
  block: ['KeyK'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
} as const;

export class KeyboardInput implements InputProvider {
  private keys: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();

  constructor(_scene?: Phaser.Scene) {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }
  }

  setScene(_scene: Phaser.Scene | null): void {
    // Store scene reference if needed for future input modes
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  /** Call at END of each frame to update edge-trigger state for next frame */
  update(): void {
    this.prevKeys = new Set(this.keys);
  }

  private wasPressed(codes: readonly string[]): boolean {
    return codes.some((c) => this.keys.has(c) && !this.prevKeys.has(c));
  }

  private isHeld(codes: readonly string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  flapPressed(): boolean {
    return this.wasPressed(KEYS.flap);
  }

  attackPressed(): boolean {
    return this.wasPressed(KEYS.attack);
  }

  blockHeld(): boolean {
    return this.isHeld(KEYS.block);
  }

  moveAxis(): number {
    let axis = 0;
    if (this.isHeld(KEYS.left)) axis -= 1;
    if (this.isHeld(KEYS.right)) axis += 1;
    return Math.max(-1, Math.min(1, axis));
  }

  jumpPressed(): boolean {
    return this.wasPressed(KEYS.flap); // W / Up also used for dodge
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }
}
