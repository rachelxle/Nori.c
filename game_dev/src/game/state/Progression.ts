/**
 * Progression module: level tracking (1-5), best level, difficulty scaling.
 */

import { GAME_CONFIG } from '../config';

const STORAGE_KEY = 'sillycon_best_level';

export const MAX_LEVEL = 1;

export interface RunnerTuning {
  scrollSpeed: number;
  spawnInterval: number;
  targetScore: number;
  /** Obstacle size multiplier (1 = small, 2 = tall/double) */
  obstacleSizeMultiplier: number;
  /** Chance for double obstacle at once (0-1) */
  doubleObstacleChance: number;
}

export interface ArenaParams {
  bossHP: number;
  bossDamageMultiplier: number;
  bossAttackCooldownMultiplier: number;
}

export class Progression {
  private static currentLevel = 1;
  private static bestLevel = 1;

  static init(): void {
    Progression.bestLevel = Math.min(MAX_LEVEL,
      parseInt(localStorage.getItem(STORAGE_KEY) ?? '1', 10)
    );
  }

  static getCurrentLevel(): number {
    return Progression.currentLevel;
  }

  static setCurrentLevel(level: number): void {
    Progression.currentLevel = Math.min(MAX_LEVEL, Math.max(1, level));
  }

  static getBestLevel(): number {
    return Progression.bestLevel;
  }

  static setBestLevel(level: number): void {
    if (level > Progression.bestLevel && level <= MAX_LEVEL) {
      Progression.bestLevel = level;
      localStorage.setItem(STORAGE_KEY, String(level));
    }
  }

  static advanceLevel(): void {
    Progression.currentLevel = Math.min(MAX_LEVEL, Progression.currentLevel + 1);
    Progression.setBestLevel(Progression.currentLevel);
  }

  static resetLevel(): void {
    Progression.currentLevel = 1;
  }

  /** Runner tuning per level (Chrome Dino-style). */
  static getRunnerTuning(level: number): RunnerTuning {
    const obs = GAME_CONFIG.obstacles;
    const l = Math.min(MAX_LEVEL, Math.max(1, level));
    return {
      scrollSpeed: obs.baseScrollSpeed + (l - 1) * 40,
      spawnInterval: Math.max(obs.minSpawnInterval, obs.baseSpawnInterval - (l - 1) * 200),
      targetScore: 100 + (l - 1) * 50,  // Distance-based target
      obstacleSizeMultiplier: 0.8 + (l - 1) * 0.2,  // 0.8 -> 1.6
      doubleObstacleChance: (l - 1) * 0.15,        // 0 -> 0.6 at level 5
    };
  }

  /** Boss visual scale per level: 1 = small, 5 = very large. */
  static getBossScale(level: number): number {
    const l = Math.min(MAX_LEVEL, Math.max(1, level));
    return 0.8 + (l - 1) * 0.3;  // 0.8, 1.1, 1.4, 1.7, 2.0
  }

  static getArenaParams(level: number): ArenaParams {
    const boss = GAME_CONFIG.boss;
    const l = Math.min(MAX_LEVEL, Math.max(1, level));
    return {
      bossHP: boss.baseHP + (l - 1) * 50,
      bossDamageMultiplier: 1 + (l - 1) * 0.1,
      bossAttackCooldownMultiplier: Math.max(0.5, 1 - (l - 1) * 0.05),
    };
  }

  static isFinalLevel(): boolean {
    return Progression.currentLevel >= MAX_LEVEL;
  }
}
