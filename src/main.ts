import 'lenis/dist/lenis.css';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import sequence from './sequence.json';
import manifest from './frames.generated.json';
import { FrameStore } from './frames';
import { startHud } from './hud';
import { GestureInput } from './input';
import { SequencePlayer } from './player';

gsap.registerPlugin(ScrollTrigger);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

function $<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}
const $$ = <T extends Element>(selector: string) => Array.from(document.querySelectorAll<T>(selector));

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const portrait = window.innerHeight > window.innerWidth;
const setName = portrait ? 'mobile' : 'desktop';
const setConfig = sequence.sets[setName];
const setInfo = manifest.sets[setName];
const sceneFrames = sequence.scenes.map((p) => Math.round(p * (setInfo.count - 1)));

const canvas = $<HTMLCanvasElement>('.stage__canvas');
const hint = $<HTMLElement>('.hint');
const loader = $<HTMLElement>('.loader');
const loaderBar = $<HTMLElement>('.loader__bar i');

const store = new FrameStore({
  baseUrl: `${manifest.basePath}/${setName}`,
  count: setInfo.count,
  capacity: setConfig.cache,
});

// The hero owns input while captured; after the last chapter it hands the page to Lenis.
let stageActive = true;
let releasing = false;

const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

const player = new SequencePlayer({
  canvas,
  store,
  frameSize: { width: setInfo.width, height: setInfo.height },
  sceneFrames,
  scenes: $$<HTMLElement>('.scene'),
  dots: $$<HTMLButtonElement>('.dots button'),
  reducedMotion,
  canNavigate: () => stageActive,
  onExit: () => releaseStage(),
  onSceneChange: (scene) => hint.classList.toggle('is-hidden', scene !== 0),
});

const input = new GestureInput((dir) => player.step(dir));

function releaseStage({ animate = true } = {}) {
  if (!stageActive) return;
  stageActive = false;
  input.enabled = false;
  lenis.start();
  if (!animate) return;
  releasing = true;
  lenis.scrollTo('#after', {
    duration: 1.2,
    immediate: reducedMotion,
    lock: true,
    force: true,
    onComplete: () => {
      releasing = false;
    },
  });
}

function captureStage() {
  stageActive = true;
  lenis.scrollTo(0, { immediate: true, force: true });
  lenis.stop();
  window.scrollTo(0, 0);
  input.enabled = true;
  input.suppressCurrentGesture();
}

lenis.on('scroll', () => {
  if (!stageActive && !releasing && lenis.direction < 0 && lenis.scroll <= 1) captureStage();
});

// Keyboard focus, anchors or find-in-page can move the page while the hero is
// captured; follow them instead of trapping the visitor.
window.addEventListener('scroll', () => {
  if (stageActive && window.scrollY > 8) releaseStage({ animate: false });
});

$$('[data-action="explore"]').forEach((el) => el.addEventListener('click', () => releaseStage()));
$$('[data-action="top"]').forEach((el) =>
  el.addEventListener('click', () => lenis.scrollTo(0, { duration: 1.4, immediate: reducedMotion })),
);
$$<HTMLButtonElement>('[data-action="reserve"]').forEach((el) =>
  el.addEventListener('click', () => {
    el.textContent = 'Demo only, nothing to buy';
  }),
);

const firstChapter = Array.from({ length: sceneFrames[1] + 1 }, (_, i) => i);
store.onProgress = (loaded) => {
  loaderBar.style.transform = `scaleX(${Math.min(1, loaded / firstChapter.length)})`;
};
store.start([...firstChapter, ...sceneFrames]);

const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
Promise.race([store.waitFor(firstChapter), timeout]).then(() => {
  gsap.to(loader, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' });
  input.enabled = stageActive;
});

// Portrait and landscape use different sequences; switch when a phone rotates.
if (matchMedia('(pointer: coarse)').matches) {
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (window.innerHeight > window.innerWidth !== portrait) location.reload();
    }, 400);
  });
}

const statText: Record<string, string> = {
  set: setName,
  frames: String(setInfo.count),
  size: `${(setInfo.bytes / 1048576).toFixed(1)} MB`,
  res: `${setInfo.width}×${setInfo.height}`,
  cache: String(setConfig.cache),
};
$$<HTMLElement>('[data-stat]').forEach((el) => {
  el.textContent = statText[el.dataset.stat ?? ''] ?? '—';
});

if (!reducedMotion) {
  $$<HTMLElement>('.reveal').forEach((el) =>
    gsap.from(el, {
      autoAlpha: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    }),
  );
}

if (new URLSearchParams(location.search).has('debug')) {
  startHud($<HTMLElement>('.hud'), () => ({
    set: `${setName} ${setInfo.width}x${setInfo.height}`,
    canvas: `${canvas.width}x${canvas.height} @${Math.min(window.devicePixelRatio, 2).toFixed(2)}x`,
    scene: `${player.scene + 1}/${sceneFrames.length}`,
    frame: `${player.requestedFrame} (drawn ${player.drawnFrame})`,
    decoded: `${store.decodedCount}/${store.capacity}`,
    loaded: `${store.loaded}/${store.count} ${(store.bytes / 1048576).toFixed(1)} MB`,
    input: input.last ? `${input.last.source} ${input.last.delta.toFixed(1)}` : '-',
    stage: stageActive ? 'captured' : 'released',
  }));
}
