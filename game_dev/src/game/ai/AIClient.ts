/**
 * Optional LLM client for boss decisions. Safe fallback when env vars are missing.
 */

export type AttackType = 'VOLLEY' | 'SLAM' | 'DASH';

export interface AIDecisionResponse {
  nextAttack: AttackType;
  reason: string;
  taunt?: string;
}

const meta = typeof import.meta !== 'undefined' ? import.meta : ({} as Record<string, unknown>);
const env = (meta as { env?: Record<string, string | undefined> }).env ?? ({} as Record<string, string | undefined>);

/**
 * If VITE_AI_KEY and VITE_AI_ENDPOINT are set, POST prompt and return parsed JSON.
 * Otherwise returns null (no crash).
 */
export async function requestBossDecision(
  prompt: string,
  summary: Record<string, unknown>
): Promise<AIDecisionResponse | null> {
  const key = env.VITE_AI_KEY;
  const endpoint = env.VITE_AI_ENDPOINT;

  if (!endpoint || !key) {
    return null;
  }

  try {
    const body = JSON.stringify({
      prompt,
      context: summary,
    });
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (data && typeof data === 'object' && 'nextAttack' in data && 'reason' in data) {
      const next = (data as { nextAttack: string }).nextAttack?.toUpperCase();
      if (next === 'VOLLEY' || next === 'SLAM' || next === 'DASH') {
        return {
          nextAttack: next,
          reason: String((data as { reason: unknown }).reason ?? ''),
          taunt: (data as { taunt?: string }).taunt,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
