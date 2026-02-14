/**
 * Vision input: listens for "vision-jump" CustomEvents from the hand-jump detector.
 * jumpPressed and flapPressed return true once per event, then clear.
 * All other inputs: false/0.
 */

import type { InputProvider } from './InputProvider';

export class VisionEventInput implements InputProvider {
  private jumpQueued = false;
  private boundHandler: () => void;

  constructor() {
    this.boundHandler = () => {
      this.jumpQueued = true;
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('vision-jump', this.boundHandler);
    }
  }

  /** Consume jump once per frame; returns true then clears jumpQueued */
  jumpPressed(): boolean {
    const v = this.jumpQueued;
    this.jumpQueued = false;
    return v;
  }

  flapPressed(): boolean {
    return this.jumpPressed(); // same as jump for Runner
  }

  attackPressed(): boolean {
    return false;
  }

  blockHeld(): boolean {
    return false;
  }

  moveAxis(): number {
    return 0;
  }

  update(): void {
    // no-op; jump consumed via jumpPressed
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('vision-jump', this.boundHandler);
    }
  }
}
