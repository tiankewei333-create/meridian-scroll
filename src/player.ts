import gsap from 'gsap';
import type { Direction } from './input';
import type { FrameStore } from './frames';

interface PlayerOptions {
  canvas: HTMLCanvasElement;
  store: FrameStore;
  frameSize: { width: number; height: number };
  /** Frame index of each chapter. */
  sceneFrames: number[];
  scenes: HTMLElement[];
  dots: HTMLButtonElement[];
  reducedMotion: boolean;
  canNavigate: () => boolean;
  onExit: () => void;
  onSceneChange?: (scene: number) => void;
}

const MAX_DPR = 2;

/**
 * Plays the image sequence chapter by chapter. The frame index is tweened with a
 * fixed duration, so playback speed never depends on the input device.
 */
export class SequencePlayer {
  scene = 0;

  private readonly state = { frame: 0 };
  private readonly ctx: CanvasRenderingContext2D;
  private tween: gsap.core.Tween | null = null;
  private queued: Direction | 0 = 0;
  private drawn = -1;
  private sizeDirty = true;
  private rafId = 0;
  private windowAnchor = -1;

  constructor(private readonly o: PlayerOptions) {
    const ctx = o.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;

    new ResizeObserver(() => {
      this.sizeDirty = true;
      this.invalidate();
    }).observe(o.canvas);
    o.store.onFrameReady = () => this.invalidate();
    o.dots.forEach((dot, i) =>
      dot.addEventListener('click', () => {
        if (o.canNavigate()) this.goTo(i);
      }),
    );

    this.showScene(0, 0, true);
    this.restWindow();
  }

  get requestedFrame() {
    return Math.round(this.state.frame);
  }

  get drawnFrame() {
    return this.drawn;
  }

  get animating() {
    return this.tween !== null;
  }

  get isLastScene() {
    return this.scene === this.o.sceneFrames.length - 1;
  }

  step(dir: Direction) {
    if (this.tween) {
      this.queued = dir;
      return;
    }
    const target = this.scene + dir;
    if (target >= this.o.sceneFrames.length) {
      this.o.onExit();
      return;
    }
    if (target >= 0) this.goTo(target);
  }

  goTo(target: number) {
    if (target === this.scene && !this.tween) return;
    this.tween?.kill();
    this.queued = 0;

    const from = this.scene;
    this.scene = target;
    this.showScene(from, target);
    this.o.onSceneChange?.(target);

    const to = this.o.sceneFrames[target];
    const segment = this.o.sceneFrames[1] - this.o.sceneFrames[0];
    const segments = Math.abs(to - this.state.frame) / segment;
    const duration = this.o.reducedMotion ? 0.01 : Math.min(0.9 + 0.3 * Math.max(0, segments - 1), 2);

    this.pathWindow(to);
    this.tween = gsap.to(this.state, {
      frame: to,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (Math.abs(this.state.frame - this.windowAnchor) >= 8) this.pathWindow(to);
        this.invalidate();
      },
      onComplete: () => {
        this.tween = null;
        this.restWindow();
        this.invalidate();
        const next = this.queued;
        this.queued = 0;
        if (next) this.step(next);
      },
    });
  }

  /** While moving: decode frames along the path first, then the destination. */
  private pathWindow(to: number) {
    const from = Math.round(this.state.frame);
    this.windowAnchor = from;
    const dir = to >= from ? 1 : -1;
    const path: number[] = [];
    for (let i = from; dir > 0 ? i <= to : i >= to; i += dir) path.push(i);
    const budget = this.o.store.capacity - this.o.sceneFrames.length - 1;
    this.o.store.setWindow([to, ...path.slice(0, budget), ...this.o.sceneFrames]);
  }

  /** At rest: the next chapter's frames first, then some of the previous chapter's. */
  private restWindow() {
    const frames = this.o.sceneFrames;
    const here = frames[this.scene];
    const order = [here];
    const next = frames[this.scene + 1];
    const prev = frames[this.scene - 1];
    if (next !== undefined) for (let i = here + 1; i <= next; i++) order.push(i);
    if (prev !== undefined) for (let i = here - 1; i >= prev; i--) order.push(i);
    this.windowAnchor = here;
    this.o.store.setWindow([...order.slice(0, this.o.store.capacity - frames.length), ...frames]);
  }

  private showScene(from: number, to: number, immediate = false) {
    const { scenes, dots } = this.o;
    dots.forEach((dot, i) => {
      if (i === to) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    if (immediate) {
      gsap.set(scenes, { autoAlpha: 0 });
      gsap.set(scenes[to], { autoAlpha: 1, y: 0 });
      return;
    }
    const dir = to > from ? 1 : -1;
    const shift = this.o.reducedMotion ? 0 : 28;
    scenes.forEach((el, i) => {
      if (i !== to) gsap.to(el, { autoAlpha: 0, y: -shift * dir, duration: 0.35, ease: 'power2.in', overwrite: true });
    });
    gsap.fromTo(
      scenes[to],
      { autoAlpha: 0, y: shift * dir },
      { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.3, ease: 'power3.out', overwrite: true },
    );
  }

  private invalidate() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.draw();
    });
  }

  private draw() {
    const { canvas, store } = this.o;
    if (this.sizeDirty) {
      // Never allocate more canvas pixels than the frames contain: upscaling in
      // drawImage looks the same as letting the compositor stretch the canvas,
      // but fills far more pixels on high-DPI Windows laptops.
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const cover = Math.max(cssW / this.o.frameSize.width, cssH / this.o.frameSize.height);
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR, 1 / cover));
      const w = Math.max(1, Math.round(cssW * dpr));
      const h = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      this.sizeDirty = false;
      this.drawn = -1;
    }

    const ready = store.nearestReady(this.requestedFrame);
    if (!ready || ready.index === this.drawn) return;

    const { image } = ready;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / image.width, ch / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.drawn = ready.index;
  }
}
