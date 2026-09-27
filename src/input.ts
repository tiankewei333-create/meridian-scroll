export type InputSource = 'wheel' | 'trackpad' | 'touch' | 'keyboard';
export type Direction = 1 | -1;

// A pause longer than this between wheel events starts a new gesture. Trackpad
// inertia and fast wheel spins both emit events far more often than this.
const GESTURE_GAP_MS = 160;
const WHEEL_THRESHOLD_PX = 24;
const TOUCH_THRESHOLD_PX = 44;
const LINE_HEIGHT_PX = 16;

const NEXT_KEYS = new Set(['ArrowDown', 'PageDown', 'ArrowRight', ' ']);
const PREV_KEYS = new Set(['ArrowUp', 'PageUp', 'ArrowLeft']);

/**
 * Turns wheel, trackpad, touch and keyboard input into discrete "next/previous"
 * intents. Each physical gesture produces at most one step, so a notched mouse
 * wheel and a trackpad with a long inertia tail behave the same.
 */
export class GestureInput {
  enabled = false;
  last: { source: InputSource; delta: number } | null = null;

  private lastEventAt = 0;
  private lastAbs = 0;
  private lastSign = 0;
  private accum = 0;
  private consumed = false;
  private consumedAt = 0;
  private touchY: number | null = null;
  private touchConsumed = false;

  constructor(private readonly onStep: (dir: Direction, source: InputSource) => void) {
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    window.addEventListener('keydown', this.onKey);
  }

  /** Ignore the rest of whatever gesture is in progress (e.g. the scroll that re-entered the stage). */
  suppressCurrentGesture() {
    const now = performance.now();
    this.consumed = true;
    this.consumedAt = now;
    this.lastEventAt = now;
    this.lastSign = 0;
    this.lastAbs = Number.POSITIVE_INFINITY;
    this.touchConsumed = true;
  }

  private emit(dir: Direction, source: InputSource, delta: number) {
    this.last = { source, delta };
    this.onStep(dir, source);
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.enabled || e.ctrlKey) return;
    e.preventDefault();

    // Firefox on Windows reports lines (deltaMode 1), everyone else pixels.
    const delta =
      e.deltaMode === 1 ? e.deltaY * LINE_HEIGHT_PX : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    if (delta === 0) return;

    const now = performance.now();
    const abs = Math.abs(delta);
    const sign = Math.sign(delta);
    const paused = now - this.lastEventAt > GESTURE_GAP_MS;
    const reversed = this.lastSign !== 0 && sign !== this.lastSign && abs > 4;
    // A new swipe started before the previous inertia tail died out.
    const reaccelerated = this.consumed && now - this.consumedAt > 280 && abs > 10 && abs > this.lastAbs * 1.8;
    if (paused || reversed || reaccelerated) {
      this.accum = 0;
      this.consumed = false;
    }
    this.lastEventAt = now;
    this.lastAbs = abs;
    this.lastSign = sign;
    if (this.consumed) return;

    this.accum += delta;
    if (Math.abs(this.accum) < WHEEL_THRESHOLD_PX) return;
    this.consumed = true;
    this.consumedAt = now;
    const source: InputSource = e.deltaMode !== 0 || (abs >= 50 && Number.isInteger(delta)) ? 'wheel' : 'trackpad';
    this.emit(this.accum > 0 ? 1 : -1, source, delta);
  };

  private onTouchStart = (e: TouchEvent) => {
    this.touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    this.touchConsumed = false;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.enabled || e.touches.length > 1) return;
    if (e.cancelable) e.preventDefault();
    if (this.touchConsumed || this.touchY === null) return;
    const dy = this.touchY - e.touches[0].clientY;
    if (Math.abs(dy) < TOUCH_THRESHOLD_PX) return;
    this.touchConsumed = true;
    this.emit(dy > 0 ? 1 : -1, 'touch', dy);
  };

  private onTouchEnd = () => {
    this.touchY = null;
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.enabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === ' ' && target?.closest('button, a')) return;

    let dir: Direction | 0 = 0;
    if (e.key === ' ') dir = e.shiftKey ? -1 : 1;
    else if (NEXT_KEYS.has(e.key)) dir = 1;
    else if (PREV_KEYS.has(e.key)) dir = -1;
    if (!dir) return;

    e.preventDefault();
    if (!e.repeat) this.emit(dir, 'keyboard', 0);
  };
}
