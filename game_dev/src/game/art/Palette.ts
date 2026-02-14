/**
 * Cute pixel-art palette - use consistently across the game.
 */

export const Palette = {
  sky: 0x8fd3ff,
  clouds: 0xffffff,
  farHills: 0x6ec48e,
  nearGrass: 0x46b06c,
  dirt: 0xa05d44,
  darkDirt: 0x7a4533,
  pinkAccent: 0xff8fb1,
  darkOutline: 0x2b2b2b,
  uiPanel: 0xfff1e8,
  warningRed: 0xff5c5c,
  goldScore: 0xffd166,
} as const;

/** Hex string for Phaser color int (0xRRGGBB) */
export function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
