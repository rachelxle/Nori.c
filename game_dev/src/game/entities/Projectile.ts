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
    this.sprite.setDisplaySize(20, 20);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setSize(20, 20);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
