// Renders the product image sequence procedurally (SVG -> WebP) so the demo ships
// without licensed assets. Output is content-addressed by a hash of this script and
// src/sequence.json, which lets Cloudflare cache frames as immutable.
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), '..');
const configPath = path.join(root, 'src', 'sequence.json');
const manifestPath = path.join(root, 'src', 'frames.generated.json');
const framesRoot = path.join(root, 'public', 'frames');

const config = JSON.parse(await readFile(configPath, 'utf8'));
const hash = createHash('sha1')
  .update(await readFile(scriptPath))
  .update(JSON.stringify(config))
  .digest('hex')
  .slice(0, 10);

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const r2 = (v) => +v.toFixed(2);
const r4 = (v) => +v.toFixed(4);

// One key per chapter in sequence.json. dx/dy position the watch on landscape
// frames, mx/my on portrait frames (fractions of the frame size).
const KEYS = [
  { zoom: 1.0, tilt: 0.0, yaw: 0.0, explode: 0, glass: 0, strap: 1, glow: 0.9, dx: 0.66, dy: 0.52, mx: 0.5, my: 0.36 },
  { zoom: 1.12, tilt: 0.95, yaw: -0.1, explode: 0.12, glass: 1, strap: 0, glow: 0.7, dx: 0.64, dy: 0.56, mx: 0.5, my: 0.38 },
  { zoom: 0.9, tilt: 1.05, yaw: 0.28, explode: 1, glass: 1, strap: 0, glow: 1.0, dx: 0.64, dy: 0.53, mx: 0.5, my: 0.37 },
  { zoom: 1.22, tilt: 0.4, yaw: 0.8, explode: 0, glass: 0, strap: 0.4, glow: 0.8, dx: 0.63, dy: 0.5, mx: 0.5, my: 0.36 },
  { zoom: 0.98, tilt: 0.1, yaw: 0.0, explode: 0, glass: 0, strap: 1, glow: 1.0, dx: 0.64, dy: 0.5, mx: 0.5, my: 0.35 },
];

if (KEYS.length !== config.scenes.length) {
  throw new Error(`KEYS (${KEYS.length}) must match scenes in sequence.json (${config.scenes.length})`);
}

async function main() {
  if (!process.argv.includes('--force') && (await isCurrent())) {
    console.log(`[frames] up to date (${hash})`);
    return;
  }

  await rm(framesRoot, { recursive: true, force: true });
  const manifest = { hash, basePath: `/frames/${hash}`, sets: {} };

  for (const [name, set] of Object.entries(config.sets)) {
    const dir = path.join(framesRoot, hash, name);
    await mkdir(dir, { recursive: true });
    const started = Date.now();
    let bytes = 0;
    await pool(set.frames, 4, async (i) => {
      const t = set.frames === 1 ? 0 : i / (set.frames - 1);
      const svg = renderFrame(set.width, set.height, t);
      const buf = await sharp(Buffer.from(svg))
        .webp({ quality: set.quality, effort: 5, smartSubsample: true })
        .toBuffer();
      bytes += buf.length;
      await writeFile(path.join(dir, `${String(i).padStart(4, '0')}.webp`), buf);
    });
    manifest.sets[name] = { count: set.frames, width: set.width, height: set.height, bytes };
    const mb = (bytes / 1048576).toFixed(1);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`[frames] ${name}: ${set.frames} x ${set.width}x${set.height}, ${mb} MB in ${secs}s`);
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function isCurrent() {
  try {
    const existing = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (existing.hash !== hash) return false;
    await access(path.join(framesRoot, hash));
    return true;
  } catch {
    return false;
  }
}

async function pool(count, concurrency, task) {
  let next = 0;
  const worker = async () => {
    while (next < count) await task(next++);
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

function paramsAt(t) {
  const { scenes } = config;
  let s = 0;
  while (s < scenes.length - 2 && t > scenes[s + 1]) s++;
  const u = clamp((t - scenes[s]) / (scenes[s + 1] - scenes[s]));
  const a = KEYS[s];
  const b = KEYS[s + 1];
  return Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], u)]));
}

const circ = (r, cx = 0, cy = 0) =>
  `M${r4(cx + r)} ${r4(cy)}A${r4(r)} ${r4(r)} 0 1 0 ${r4(cx - r)} ${r4(cy)}A${r4(r)} ${r4(r)} 0 1 0 ${r4(cx + r)} ${r4(cy)}Z`;
const ring = (ro, ri) => circ(ro) + circ(ri);
const polar = (a, r) => [r4(Math.cos(a) * r), r4(Math.sin(a) * r)];
const radialLine = (a, r1, r2, extra = '') => {
  const [x1, y1] = polar(a, r1);
  const [x2, y2] = polar(a, r2);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
};

// All part drawings below use unit coordinates: the case radius is 1.

function gear(x, y, r, teeth, rotDeg) {
  const ri = r * 0.88;
  const step = TAU / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [rr, aa] of [[ri, a], [r, a + step * 0.2], [r, a + step * 0.48], [ri, a + step * 0.68]]) {
      const [px, py] = polar(aa, rr);
      d += `${d ? 'L' : 'M'}${px} ${py}`;
    }
  }
  const spokes = [0, 1, 2, 3, 4].map((k) => radialLine((k * TAU) / 5, 0, ri * 0.75)).join('');
  return `<g transform="translate(${r4(x)} ${r4(y)}) rotate(${r2(rotDeg)})">
<path d="${d}Z" fill="url(#gold)"/>
<circle r="${r4(ri * 0.78)}" fill="#1b1e23"/>
<g stroke="#c99a52" stroke-width="${r4(r * 0.09)}" stroke-linecap="round">${spokes}</g>
<circle r="${r4(r * 0.2)}" fill="url(#gold)"/>
</g>`;
}

function jewels(points) {
  return points
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="0.032" fill="#a3122e"/><circle cx="${r4(x - 0.01)}" cy="${r4(y - 0.01)}" r="0.01" fill="#ff8a9a" fill-opacity="0.8"/>`,
    )
    .join('');
}

function lugs(fill) {
  let s = '';
  for (const lx of [-1, 1]) {
    for (const ly of [-1, 1]) {
      s += `<rect x="${lx > 0 ? 0.34 : -0.62}" y="${ly > 0 ? 0.74 : -1.1}" width="0.28" height="0.36" rx="0.09"${fill ? ` fill="${fill}"` : ''}/>`;
    }
  }
  return s;
}

function caseSilhouette(fill) {
  return `<g fill="${fill}">${lugs()}<circle r="1"/><rect x="0.97" y="-0.13" width="0.18" height="0.26" rx="0.045"/></g>`;
}

function caseFace() {
  const pushers = [-32, 32]
    .map((a) => `<rect x="0.95" y="-0.055" width="0.11" height="0.11" rx="0.025" transform="rotate(${a})" fill="url(#metal)"/>`)
    .join('');
  const knurl = Array.from({ length: 6 }, (_, k) => {
    const x = r4(1.0 + k * 0.025);
    return `<line x1="${x}" y1="-0.12" x2="${x}" y2="0.12"/>`;
  }).join('');
  return `${lugs('url(#metal)')}${pushers}
<rect x="0.97" y="-0.13" width="0.18" height="0.26" rx="0.045" fill="url(#metal)"/>
<g stroke="#2a2e35" stroke-width="0.008">${knurl}</g>
<path d="${ring(1, 0.86)}" fill="url(#metal)" fill-rule="evenodd"/>
<circle r="0.995" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="0.008"/>
<circle r="0.862" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="0.012"/>`;
}

function caseback() {
  const screws = Array.from({ length: 6 }, (_, k) => {
    const [x, y] = polar((k * TAU) / 6 + 0.3, 0.85);
    return `<circle cx="${x}" cy="${y}" r="0.035" fill="#1d2025" stroke="#8b929b" stroke-width="0.008"/>`;
  }).join('');
  return `<circle r="0.96" fill="url(#metal)"/>
<circle r="0.78" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="0.01"/>
<circle r="0.6" fill="url(#sapphire)"/>
<circle r="0.6" fill="none" stroke="#c9d1da" stroke-opacity="0.35" stroke-width="0.01"/>
${screws}`;
}

function movement(g, osc) {
  const perlage = [0.2, 0.35, 0.5, 0.65, 0.78]
    .map((r) => `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity="0.04" stroke-width="0.05"/>`)
    .join('');
  const balanceSpokes = [0, 1, 2, 3].map((k) => radialLine((k * TAU) / 4, 0, 0.17)).join('');
  return `<circle r="0.84" fill="url(#plate)"/>${perlage}
${gear(0, 0.06, 0.3, 40, g)}
${gear(0.42, -0.28, 0.19, 24, -g * 1.58)}
${gear(-0.44, 0.27, 0.22, 28, -g * 1.36)}
${gear(0.34, 0.44, 0.14, 18, g * 2.14)}
<g transform="translate(-0.36 -0.4) rotate(${r2(osc)})">
<circle r="0.2" fill="none" stroke="#c99a52" stroke-width="0.035"/>
<g stroke="#c99a52" stroke-width="0.02">${balanceSpokes}</g>
<circle r="0.1" fill="none" stroke="#d6dbe1" stroke-opacity="0.5" stroke-width="0.006"/>
<circle r="0.065" fill="none" stroke="#d6dbe1" stroke-opacity="0.5" stroke-width="0.006"/>
</g>
<rect x="-0.09" y="-0.8" width="0.18" height="0.78" rx="0.09" transform="rotate(38)" fill="url(#bridge)"/>
<rect x="-0.08" y="0.05" width="0.16" height="0.7" rx="0.08" transform="rotate(-62)" fill="url(#bridge)"/>
${jewels([[0, 0.06], [0.42, -0.28], [-0.44, 0.27], [0.34, 0.44], [-0.36, -0.4], [0.2, -0.55], [-0.55, -0.05]])}
<circle r="0.84" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="0.02"/>`;
}

function dial() {
  let s = '<circle r="0.86" fill="url(#dial)"/><g stroke="#fff" stroke-opacity="0.035" stroke-width="0.004">';
  for (let i = 0; i < 90; i++) s += radialLine((i * TAU) / 90, 0.1, 0.84);
  s += '</g><g stroke="#e9e2d0" stroke-linecap="round">';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    s += radialLine(
      (i * TAU) / 60 - TAU / 4,
      major ? 0.68 : 0.79,
      0.82,
      ` stroke-width="${major ? 0.03 : 0.007}" stroke-opacity="${major ? 0.95 : 0.55}"`,
    );
  }
  s += '</g>';
  for (const x of [-0.36, 0.36]) {
    let ticks = '';
    for (let i = 0; i < 12; i++) ticks += radialLine((i * TAU) / 12, 0.13, 0.16);
    s += `<g transform="translate(${x} 0.2)"><circle r="0.17" fill="#08101c" stroke="#9aa3ad" stroke-opacity="0.35" stroke-width="0.006"/><g stroke="#cfd5dc" stroke-opacity="0.6" stroke-width="0.006">${ticks}</g></g>`;
  }
  s += '<rect x="-0.06" y="0.5" width="0.12" height="0.09" rx="0.012" fill="#e9e2d0"/>';
  s += '<rect x="-0.018" y="0.525" width="0.036" height="0.04" rx="0.005" fill="#1b1e23"/>';
  return s;
}

function hands(t) {
  const hand = (angle, len, w) => {
    const body = `M${r4(-w)} 0.09L${r4(-w * 0.62)} ${r4(-len + 0.06)}L0 ${r4(-len)}L${r4(w * 0.62)} ${r4(-len + 0.06)}L${r4(w)} 0.09Z`;
    const lume = `M${r4(-w * 0.4)} -0.12L${r4(-w * 0.3)} ${r4(-len + 0.1)}L0 ${r4(-len + 0.05)}L${r4(w * 0.3)} ${r4(-len + 0.1)}L${r4(w * 0.4)} -0.12Z`;
    return `<g transform="rotate(${r2(angle)})"><path d="${body}" fill="url(#gold)"/><path d="${lume}" fill="#efe9d8" fill-opacity="0.9"/></g>`;
  };
  const wave = Math.sin(t * Math.PI);
  const subHands = [-0.36, 0.36]
    .map(
      (x) =>
        `<g transform="translate(${x} 0.2) rotate(${r2(t * 720 * (x > 0 ? 1 : 0.25))})"><line x1="0" y1="0.03" x2="0" y2="-0.14" stroke="#e9e2d0" stroke-width="0.012" stroke-linecap="round"/><circle r="0.018" fill="#e9e2d0"/></g>`,
    )
    .join('');
  return `${subHands}${hand(304.5 + wave * 3, 0.46, 0.036)}${hand(54 + wave * 36, 0.7, 0.028)}
<g transform="rotate(${r2(t * 1080)})"><rect x="-0.006" y="-0.78" width="0.012" height="0.96" fill="#d9483b"/><circle cy="0.12" r="0.03" fill="#d9483b"/></g>
<circle r="0.04" fill="url(#gold)"/><circle r="0.014" fill="#1b1e23"/>`;
}

function bezel() {
  let s = `<path d="${ring(0.975, 0.875)}" fill="url(#ceramic)" fill-rule="evenodd"/><g fill="#e9e2d0">`;
  for (let i = 0; i < 12; i++) {
    s += `<rect x="-0.01" y="-0.965" width="0.02" height="${i === 0 ? 0.07 : 0.045}" rx="0.006" transform="rotate(${i * 30})" fill-opacity="${i === 0 ? 1 : 0.75}"/>`;
  }
  return `${s}</g><circle r="0.973" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="0.006"/><circle r="0.877" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="0.008"/>`;
}

function glass() {
  return `<circle r="0.9" fill="#dce6f5" fill-opacity="0.05" stroke="#fff" stroke-opacity="0.25" stroke-width="0.008"/>
<ellipse cx="-0.22" cy="-0.42" rx="0.58" ry="0.2" transform="rotate(-28 -0.22 -0.42)" fill="url(#glassHi)"/>`;
}

function strap(amount) {
  if (amount < 0.01) return '';
  const len = 2.3 * amount;
  const piece = (top) => {
    const y0 = top ? -0.92 - len : 0.92;
    return `<rect x="-0.42" y="${r4(y0)}" width="0.84" height="${r4(len)}" rx="0.12" fill="url(#leather)"/>
<rect x="-0.35" y="${r4(y0 + 0.05)}" width="0.7" height="${r4(Math.max(0, len - 0.1))}" rx="0.08" fill="none" stroke="#6b5842" stroke-opacity="0.7" stroke-width="0.008" stroke-dasharray="0.035 0.025"/>`;
  };
  return `<g opacity="${r2(amount)}">${piece(true)}${piece(false)}</g>`;
}

function defs(cx, cy, bgR, light) {
  const rot = `gradientTransform="rotate(${r2(light)} 0.5 0.5)"`;
  const stops = (list) => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  return `<defs>
<radialGradient id="bg" gradientUnits="userSpaceOnUse" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(bgR)}">${stops([[0, '#171c26'], [0.45, '#0b0d12'], [1, '#050608']])}</radialGradient>
<radialGradient id="glow">${stops([[0, '#6b4d27', 0.55], [0.45, '#2a2014', 0.25], [1, '#000', 0]])}</radialGradient>
<radialGradient id="vignette" r="0.75">${stops([[0.55, '#000', 0], [1, '#000', 0.6]])}</radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1" ${rot}>${stops([[0, '#2b3037'], [0.3, '#8f97a1'], [0.45, '#e6eaee'], [0.58, '#6a717a'], [0.82, '#b9c0c8'], [1, '#3a4048']])}</linearGradient>
<linearGradient id="metalSide" x1="0" y1="0" x2="0" y2="1">${stops([[0, '#0f1114'], [0.5, '#4a5058'], [1, '#15181c']])}</linearGradient>
<radialGradient id="ceramic">${stops([[0, '#262a31'], [0.8, '#111317'], [1, '#08090b']])}</radialGradient>
<radialGradient id="dial" cx="0.42" cy="0.36" r="0.75">${stops([[0, '#1c2d48'], [0.55, '#0c1628'], [1, '#050a13']])}</radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1" ${rot}>${stops([[0, '#f5dca0'], [0.35, '#c79a55'], [0.6, '#8c6632'], [1, '#e9c98a']])}</linearGradient>
<radialGradient id="plate">${stops([[0, '#3b4048'], [1, '#1d2126']])}</radialGradient>
<linearGradient id="bridge" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#7c838c'], [0.5, '#d5dae0'], [1, '#858c95']])}</linearGradient>
<radialGradient id="sapphire" cx="0.4" cy="0.35">${stops([[0, '#2d4a78'], [0.6, '#10203d'], [1, '#070d19']])}</radialGradient>
<linearGradient id="leather" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#121417'], [0.5, '#25282d'], [1, '#121417']])}</linearGradient>
<linearGradient id="glassHi" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#fff', 0.32], [1, '#fff', 0]])}</linearGradient>
<radialGradient id="shadow">${stops([[0, '#000', 0.7], [0.6, '#000', 0.3], [1, '#000', 0]])}</radialGradient>
</defs>`;
}

function renderFrame(W, H, t) {
  const p = paramsAt(t);
  const portrait = H > W;
  const R = (portrait ? W * 0.3 : H * 0.27) * p.zoom;
  const cx = (portrait ? p.mx : p.dx) * W;
  const cy = (portrait ? p.my : p.dy) * H;

  // Pseudo-3D: a disc tilted by `tilt` (x axis) and `yaw` (y axis) is drawn as an
  // ellipse; layers separate along the projected disc normal (nx, ny).
  const sx = Math.cos(p.yaw);
  const sy = Math.cos(p.tilt);
  const nx = Math.sin(p.yaw) * 0.7;
  const ny = -Math.sin(p.tilt);
  const depthVisible = Math.abs(nx) + Math.abs(ny) > 0.02;
  const light = 25 + p.yaw * 70 - p.tilt * 15 + t * 20;
  const e = p.explode;

  const place = (units) => {
    const k = 1 + units * 0.05;
    return { x: cx + nx * R * units, y: cy + ny * R * units, kx: sx * R * k, ky: sy * R * k };
  };
  const tf = (pl, dx = 0, dy = 0) =>
    `translate(${r2(pl.x + dx)} ${r2(pl.y + dy)}) scale(${r4(pl.kx)} ${r4(pl.ky)})`;

  // When exploded, the movement rises above the case ring so it is not hidden by it.
  const layers = [
    { units: -0.16 - 1.0 * e, thick: 0.05, side: '<circle r="0.96" fill="url(#metalSide)"/>', body: caseback() },
    { units: -0.42 * e, thick: 0.24, side: caseSilhouette('url(#metalSide)'), before: strap(p.strap), body: caseFace() },
    { units: -0.1 + 0.1 * e, shadow: true, body: movement(t * 720, Math.sin(t * TAU * 5) * 160) },
    { units: 0.02 + 0.38 * e, shadow: true, body: dial() },
    { units: 0.05 + 0.58 * e, body: hands(t) },
    { units: 0.07 + 0.82 * e, body: bezel() },
    { units: 0.09 + 1.08 * e + 0.3 * p.glass, body: glass() },
  ].sort((a, b) => a.units - b.units);

  let body = '';
  for (const layer of layers) {
    const pl = place(layer.units);
    if (layer.before) body += `<g transform="${tf(pl)}">${layer.before}</g>`;
    if (layer.shadow && e > 0.02) {
      const off = R * 0.14;
      body += `<ellipse cx="${r2(pl.x - nx * off)}" cy="${r2(pl.y - ny * off + R * 0.02)}" rx="${r2(pl.kx * 1.08)}" ry="${r2(pl.ky * 1.08)}" fill="url(#shadow)" opacity="${r2(0.45 * e)}"/>`;
    }
    if (layer.thick && depthVisible) {
      const depthPx = layer.thick * R * Math.hypot(nx, ny);
      const slices = Math.max(4, Math.ceil(depthPx / 1.5));
      for (let i = slices; i >= 1; i--) {
        const off = (layer.thick * R * i) / slices;
        body += `<g transform="${tf(pl, -nx * off, -ny * off)}">${layer.side}</g>`;
      }
    }
    body += `<g transform="${tf(pl)}">${layer.body}</g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs(cx, cy, Math.max(W, H) * 0.95, light)}
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(R * 2.6)}" fill="url(#glow)" opacity="${r2(clamp(p.glow))}"/>
${body}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

await main();
