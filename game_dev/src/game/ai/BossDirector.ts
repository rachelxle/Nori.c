/**
 * Adaptive boss decision logic: uses telemetry to choose next attack.
 * Optional LLM override; fallback is weighted random based on player behavior.
 */

import type { BossTelemetry } from './BossTelemetry';
import { requestBossDecision } from './AIClient';

export type AttackType = 'VOLLEY' | 'SLAM' | 'DASH';

export type BossDecision = {
  nextAttack: AttackType;
  reason: string;
  weights: Record<AttackType, number>;
  taunt?: string;
  mode: 'AI' | 'FALLBACK';
};

const ATTACK_TYPES: AttackType[] = ['VOLLEY', 'SLAM', 'DASH'];

function weightedRandom(weights: Record<AttackType, number>): AttackType {
  const total = ATTACK_TYPES.reduce((s, k) => s + Math.max(0, weights[k]), 0);
  if (total <= 0) return ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
  let r = Math.random() * total;
  for (const k of ATTACK_TYPES) {
    const w = Math.max(0, weights[k]);
    if (r <= w) return k;
    r -= w;
  }
  return ATTACK_TYPES[ATTACK_TYPES.length - 1];
}

export class BossDirector {
  constructor(private telemetry: BossTelemetry) {}

  async decideNextAttack(phase: number): Promise<BossDecision> {
    const summary = this.telemetry.summary();

    const aiResponse = await requestBossDecision(
      `Boss fight: choose next attack (VOLLEY, SLAM, or DASH). Phase=${phase}. Respond with JSON: { "nextAttack": "VOLLEY"|"SLAM"|"DASH", "reason": string, "taunt"?: string }`,
      summary as unknown as Record<string, unknown>
    );

    if (aiResponse) {
      return {
        nextAttack: aiResponse.nextAttack,
        reason: aiResponse.reason,
        weights: { VOLLEY: 1, SLAM: 1, DASH: 1 },
        taunt: aiResponse.taunt,
        mode: 'AI',
      };
    }

    return this.fallbackDecision(phase);
  }

  private fallbackDecision(phase: number): BossDecision {
    const t = this.telemetry;
    const elapsed = t.elapsedSeconds();
    const baseWeights: Record<AttackType, number> = {
      VOLLEY: 1,
      SLAM: 1,
      DASH: 1,
    };

    // Player blocks a lot → increase SLAM (AoE punishes stationary)
    const blockThreshold = 3;
    if (t.playerBlocksHeldSeconds > blockThreshold) {
      baseWeights.SLAM += 1.5;
    }

    // Player dodges a lot → increase VOLLEY (timing pressure)
    const dodgeRate = elapsed > 5 ? t.playerDodges / elapsed : 0;
    if (dodgeRate > 0.5) {
      baseWeights.VOLLEY += 1.2;
    }

    // Player stays far → increase DASH (gap close)
    if (t.distanceAvg > 200) {
      baseWeights.DASH += 1.5;
    } else if (t.distanceAvg > 120) {
      baseWeights.DASH += 0.5;
    }

    // Most damage from projectiles → sometimes switch away from volley
    const totalDmg = t.damageTaken.volley + t.damageTaken.slam + t.damageTaken.dash;
    if (totalDmg > 0 && t.damageTaken.volley / totalDmg > 0.6 && Math.random() < 0.4) {
      baseWeights.VOLLEY *= 0.4;
      baseWeights.DASH += 0.8;
      baseWeights.SLAM += 0.8;
    }

    // Low HP + early round → small mercy (slightly reduce weight on strongest)
    const currentHP = t.currentPlayerHP > 0 ? t.currentPlayerHP : (t.playerHPEnd ?? t.playerHPStart);
    const lowHP = t.playerHPStart > 0 && currentHP / t.playerHPStart < 0.35;
    if (lowHP && t.round <= 2 && phase === 1) {
      const maxKey = ATTACK_TYPES.reduce((a, b) => (baseWeights[a] >= baseWeights[b] ? a : b));
      baseWeights[maxKey] *= 0.85;
    }

    const nextAttack = weightedRandom(baseWeights);
    const reasons: string[] = [];
    if (t.playerBlocksHeldSeconds > blockThreshold) reasons.push('player blocking a lot');
    if (dodgeRate > 0.5) reasons.push('player dodging often');
    if (t.distanceAvg > 200) reasons.push('player far away');
    if (totalDmg > 0 && t.damageTaken.volley / totalDmg > 0.6) reasons.push('volley effective, mixing up');
    if (lowHP && t.round <= 2) reasons.push('early round mercy');
    const reason = reasons.length > 0 ? reasons.join('; ') : 'balanced mix';

    return {
      nextAttack,
      reason,
      weights: { ...baseWeights },
      mode: 'FALLBACK',
    };
  }
}
