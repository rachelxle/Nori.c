/**
 * Free browser TTS for narration and boss taunts.
 * Uses speechSynthesis only; no paid APIs.
 */

export type VoiceMode = 'NARRATOR' | 'BOSS';

let cachedVoices: SpeechSynthesisVoice[] = [];

function getVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length > 0) return cachedVoices;
  const v = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
  if (v.length > 0) cachedVoices = v;
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    cachedVoices = speechSynthesis.getVoices();
  };
  cachedVoices = speechSynthesis.getVoices();
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (voices.length === 0) return null;
  const preferred = ['Google', 'Samantha', 'Microsoft', 'Karen', 'Daniel', 'en-US', 'en-GB'];
  for (const name of preferred) {
    const found = voices.find((v) => v.name.includes(name) || v.lang.includes(name));
    if (found) return found;
  }
  return voices[0];
}

/**
 * Speak text using browser TTS. Cancel any current speech first.
 * NARRATOR: rate ~1.0, pitch ~1.0. BOSS: rate ~0.95, pitch ~0.7 (deeper).
 */
export function speak(text: string, mode: VoiceMode = 'NARRATOR'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickBestVoice();
  if (voice) u.voice = voice;
  if (mode === 'NARRATOR') {
    u.rate = 1.0;
    u.pitch = 1.0;
  } else {
    u.rate = 0.95;
    u.pitch = 0.7;
  }
  u.volume = mode === 'BOSS' ? 1.0 : 0.9;
  window.speechSynthesis.speak(u);
}
