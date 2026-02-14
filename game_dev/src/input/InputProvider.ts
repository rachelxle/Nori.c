/**
 * Input abstraction interface.
 * All player control reads from this interface - no direct key handling in game entities.
 * Easily replaceable with vision/other input later.
 */
export interface InputProvider {
  /** Edge-trigger: true on the frame the flap button was pressed (Runner: flap) */
  flapPressed(): boolean;

  /** Edge-trigger: true on the frame the attack button was pressed (Arena: melee attack) */
  attackPressed(): boolean;

  /** Continuous: true while block button is held (Arena: block/reduce damage) */
  blockHeld(): boolean;

  /** Continuous: horizontal axis -1 (left) to 1 (right) (Arena: move) */
  moveAxis(): number;

  /** Edge-trigger: true on the frame jump/dodge was pressed (Arena: dodge optional) */
  jumpPressed(): boolean;
}
