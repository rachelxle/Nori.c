/**
 * Central tuning constants for balancing the game.
 * All gameplay values should be defined here for easy adjustment.
 */

export const GAME_CONFIG = {
  // Canvas
  width: 800,
  height: 600,

  // Runner mode (Chrome Dino-style)
  runner: {
    gravity: 900,
    jumpImpulse: -420,
    runSpeed: 0,             // Cat stays in place; obstacles scroll
    maxFallSpeed: 600,
    lives: 3,
    jumpParticleCount: 6,
    landParticleCount: 4,
    particleSpeed: 80,
  },

  // Obstacles - ground-only (Chrome Dino-style)
  obstacles: {
    baseScrollSpeed: 220,
    baseSpawnInterval: 2000,
    minSpawnInterval: 900,
    obstacleWidth: 40,
    obstacleHeight: 50,
    obstacleWidthTall: 50,
    obstacleHeightTall: 80,
  },

  // Runner scoring (distance over time)
  runnerScorePerSecond: 20,

  // Arena - Player
  arena: {
    player: {
      hp: 100,
      attackDamage: 10,
      attackCooldown: 350,
      projectileSpeed: 450,
      blockReduction: 0.7,   // 70% damage reduction when blocking
      moveSpeed: 280,
      jumpForce: -400,
      dodgeSpeed: 450,
      dodgeDuration: 250,
      dodgeCooldown: 1200,
      invincibilityDuration: 600,
      knockbackForce: 200,
    },
  },

  // Arena - Boss
  boss: {
    baseHP: 250,
    baseDamage: 15,
    phase2HPThreshold: 0.5,  // trigger at 50% HP
    introDuration: 1500,
    idleMinDuration: 800,
    idleMaxDuration: 1500,
    telegraphDuration: 600,
    recoverDuration: 400,
    // Attacks
    projectileDamage: 12,
    projectileSpeed: 280,
    projectileCount: 3,
    slamDamage: 20,
    slamRadius: 80,
    slamTelegraphDuration: 900,
    dashDamage: 18,
    dashSpeed: 600,
    dashTelegraphDuration: 500,
    // Phase 2 scaling
    phase2AttackFreqMultiplier: 1.5,
    phase2ProjectileSpeedMultiplier: 1.4,
    phase2DamageMultiplier: 1.2,
  },
} as const;
