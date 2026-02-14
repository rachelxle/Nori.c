/**
 * Projectile entity for boss attacks.
 */

export class ProjectileEntity {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public damage: number;
  public fromBoss: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    fromBoss: boolean
  ) {
    this.damage = damage;
    this.fromBoss = fromBoss;

    this.sprite = scene.physics.add.sprite(x, y, 'projectile');
    this.sprite.setVelocity(vx, vy);
    this.sprite.setCollideWorldBounds(false);
    (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
