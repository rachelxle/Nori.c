/**
 * Reusable pixel-cute cat sprites (Graphics only, no PNGs).
 * Matches StoryIntroScene orange cat style.
 */

const COLORS = {
  outline: 0x2b2b2b,
  playerBody: 0xf4a261,
  cheeks: 0xff8fb1,
} as const;

/**
 * Draw the orange cat (body #F4A261, outline #2B2B2B, ears, eyes, cheeks #FF8FB1).
 * Container position is the top-left of the cat; graphics are drawn from (0,0).
 * @param scale Default 1. Use 1 for ~48x44 base size.
 */
export function drawOrangeCat(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();

  const bodyW = 48 * scale;
  const bodyH = 44 * scale;
  const outlineW = 3;

  g.fillStyle(COLORS.playerBody, 1);
  g.fillRect(0, 0, bodyW, bodyH);
  g.lineStyle(outlineW, COLORS.outline);
  g.strokeRect(0, 0, bodyW, bodyH);

  const earW = 14 * scale;
  const earH = 18 * scale;
  g.fillStyle(COLORS.playerBody, 1);
  g.fillRect(-2, -earH + 2, earW, earH);
  g.fillRect(bodyW - earW + 2, -earH + 2, earW, earH);
  g.lineStyle(outlineW, COLORS.outline);
  g.strokeRect(-2, -earH + 2, earW, earH);
  g.strokeRect(bodyW - earW + 2, -earH + 2, earW, earH);

  const eyeSize = 6 * scale;
  g.fillStyle(COLORS.outline, 1);
  g.fillRect(12 * scale, 14 * scale, eyeSize, eyeSize);
  g.fillRect(30 * scale, 14 * scale, eyeSize, eyeSize);

  const cheekSize = 8 * scale;
  g.fillStyle(COLORS.cheeks, 1);
  g.fillRect(6 * scale, 26 * scale, cheekSize, cheekSize * 0.6);
  g.fillRect(bodyW - 6 * scale - cheekSize, 26 * scale, cheekSize, cheekSize * 0.6);

  container.add(g);
  return container;
}
