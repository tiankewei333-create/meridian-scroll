type Stats = () => Record<string, string | number>;

/** Live diagnostics overlay, enabled with ?debug. */
export function startHud(el: HTMLElement, stats: Stats) {
  el.hidden = false;
  let frames = 0;
  let since = performance.now();
  let fps = 0;

  const tick = (now: number) => {
    frames++;
    if (now - since >= 500) {
      fps = (frames * 1000) / (now - since);
      frames = 0;
      since = now;
      const lines = Object.entries({ fps: fps.toFixed(0), ...stats() }).map(
        ([key, value]) => `${key.padEnd(9)} ${value}`,
      );
      el.textContent = lines.join('\n');
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
