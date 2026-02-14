/**
 * Telemetry collection for the boss fight. Tracks player behavior and damage
 * for adaptive AI decision-making.
 */

export type DamageSource = 'volley' | 'slam' | 'dash';

export interface TelemetrySummary {
  round: number;
  level: number;
  elapsedSeconds: number;
  playerDodges: number;
  playerBlocksHeldSeconds: number;
  playerAttacks: number;
  damageTaken: { volley: number; slam: number; dash: number };
  hitsTaken: { volley: number; slam: number; dash: number };
  distanceAvg: number;
  playerHPStart: number;
  playerHPEnd: number;
}

export class BossTelemetry {
  round = 0;
  level = 0;
  fightStartMs = 0;
  playerDodges = 0;
  playerBlocksHeldSeconds = 0;
  playerAttacks = 0;
  damageTaken: { volley: number; slam: number; dash: number } = {
    volley: 0,
    slam: 0,
    dash: 0,
  };
  hitsTaken: { volley: number; slam: number; dash: number } = {
    volley: 0,
    slam: 0,
    dash: 0,
  };
  private _distanceSum = 0;
  private _distanceSamples = 0;
  distanceAvg = 0;
  playerHPStart = 0;
  playerHPEnd = 0;
  /** Current player HP (updated each tick by Arena for low-HP mercy logic). */
  currentPlayerHP = 0;

  elapsedSeconds(): number {
    if (this.fightStartMs <= 0) return 0;
    const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.fightStartMs;
    return ms / 1000;
  }

  startFight(level: number, round: number, playerHPStart: number): void {
    this.level = level;
    this.round = round;
    this.fightStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.playerHPStart = playerHPStart;
    this.playerDodges = 0;
    this.playerBlocksHeldSeconds = 0;
    this.playerAttacks = 0;
    this.damageTaken = { volley: 0, slam: 0, dash: 0 };
    this.hitsTaken = { volley: 0, slam: 0, dash: 0 };
    this._distanceSum = 0;
    this._distanceSamples = 0;
    this.distanceAvg = 0;
  }

  recordDodge(): void {
    this.playerDodges += 1;
  }

  recordAttack(): void {
    this.playerAttacks += 1;
  }

  recordBlock(dtSeconds: number): void {
    this.playerBlocksHeldSeconds += dtSeconds;
  }

  recordDamage(source: DamageSource, amount: number): void {
    this.damageTaken[source] = (this.damageTaken[source] ?? 0) + amount;
    this.hitsTaken[source] = (this.hitsTaken[source] ?? 0) + 1;
  }

  recordDistance(dist: number): void {
    this._distanceSum += dist;
    this._distanceSamples += 1;
    this.distanceAvg = this._distanceSum / this._distanceSamples;
  }

  endFight(playerHPEnd: number): void {
    this.playerHPEnd = playerHPEnd;
  }

  summary(): TelemetrySummary {
    return {
      round: this.round,
      level: this.level,
      elapsedSeconds: this.elapsedSeconds() / 1000,
      playerDodges: this.playerDodges,
      playerBlocksHeldSeconds: this.playerBlocksHeldSeconds,
      playerAttacks: this.playerAttacks,
      damageTaken: { ...this.damageTaken },
      hitsTaken: { ...this.hitsTaken },
      distanceAvg: this.distanceAvg,
      playerHPStart: this.playerHPStart,
      playerHPEnd: this.playerHPEnd,
    };
  }
}
