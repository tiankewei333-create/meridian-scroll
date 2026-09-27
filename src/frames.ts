export type Drawable = ImageBitmap | HTMLImageElement;

export interface ReadyFrame {
  index: number;
  image: Drawable;
}

interface FrameStoreOptions {
  baseUrl: string;
  count: number;
  /** Max decoded frames kept in memory. Compressed blobs are always kept. */
  capacity: number;
  fetchConcurrency?: number;
  decodeConcurrency?: number;
}

/**
 * Downloads every frame as a compressed blob, but only keeps a bounded window of
 * decoded bitmaps. Holding hundreds of full-size decoded frames is what makes
 * image-sequence pages stutter on Chrome and get killed on iOS Safari.
 */
export class FrameStore {
  readonly count: number;
  readonly capacity: number;
  loaded = 0;
  bytes = 0;
  onProgress?: (loaded: number, total: number) => void;
  onFrameReady?: (index: number) => void;

  private readonly blobs: (Blob | null)[];
  private readonly attempts: Uint8Array;
  private readonly images = new Map<number, Drawable>();
  private readonly inflight = new Set<number>();
  private readonly decoding = new Set<number>();
  private fetchQueue: number[] = [];
  private decodeQueue: number[] = [];
  private wanted = new Set<number>();
  private wantedOrder: number[] = [];
  private waiters: { indices: number[]; resolve: () => void }[] = [];

  constructor(private readonly options: FrameStoreOptions) {
    this.count = options.count;
    this.capacity = options.capacity;
    this.blobs = new Array(options.count).fill(null);
    this.attempts = new Uint8Array(options.count);
  }

  get decodedCount() {
    return this.images.size;
  }

  url(index: number) {
    return `${this.options.baseUrl}/${String(index).padStart(4, '0')}.webp`;
  }

  start(priority: number[]) {
    this.fetchQueue = this.normalize([...priority, ...Array.from({ length: this.count }, (_, i) => i)]);
    this.pumpFetch();
  }

  waitFor(indices: number[]): Promise<void> {
    if (indices.every((i) => this.blobs[i])) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ indices, resolve }));
  }

  /** Frames to keep decoded, most important first. Truncated to capacity. */
  setWindow(order: number[]) {
    const list = this.normalize(order).slice(0, this.capacity);
    this.wantedOrder = list;
    this.wanted = new Set(list);

    const missing = list.filter((i) => !this.blobs[i] && !this.inflight.has(i));
    if (missing.length) {
      const skip = new Set(missing);
      this.fetchQueue = [...missing, ...this.fetchQueue.filter((i) => !skip.has(i))];
      this.pumpFetch();
    }
    this.rebuildDecodeQueue();
    this.pumpDecode();
    this.evict();
  }

  nearestReady(index: number): ReadyFrame | null {
    for (let d = 0; d < this.count; d++) {
      for (const i of d === 0 ? [index] : [index - d, index + d]) {
        const image = i >= 0 && i < this.count ? this.images.get(i) : undefined;
        if (image) {
          this.images.delete(i);
          this.images.set(i, image);
          return { index: i, image };
        }
      }
    }
    return null;
  }

  private normalize(list: number[]) {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const raw of list) {
      const i = Math.round(raw);
      if (i < 0 || i >= this.count || seen.has(i)) continue;
      seen.add(i);
      out.push(i);
    }
    return out;
  }

  private pumpFetch() {
    const limit = this.options.fetchConcurrency ?? 6;
    while (this.inflight.size < limit && this.fetchQueue.length) {
      const i = this.fetchQueue.shift()!;
      if (this.blobs[i] || this.inflight.has(i)) continue;
      this.inflight.add(i);
      fetch(this.url(i))
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => this.onBlob(i, blob))
        .catch(() => {
          if (++this.attempts[i] < 3) this.fetchQueue.push(i);
        })
        .finally(() => {
          this.inflight.delete(i);
          this.pumpFetch();
        });
    }
  }

  private onBlob(index: number, blob: Blob) {
    this.blobs[index] = blob;
    this.loaded++;
    this.bytes += blob.size;
    this.onProgress?.(this.loaded, this.count);
    if (this.wanted.has(index)) {
      this.rebuildDecodeQueue();
      this.pumpDecode();
    }
    this.waiters = this.waiters.filter((w) => {
      if (!w.indices.every((i) => this.blobs[i])) return true;
      w.resolve();
      return false;
    });
  }

  private rebuildDecodeQueue() {
    this.decodeQueue = this.wantedOrder.filter((i) => this.blobs[i] && !this.images.has(i) && !this.decoding.has(i));
  }

  private pumpDecode() {
    const limit = this.options.decodeConcurrency ?? 3;
    while (this.decoding.size < limit && this.decodeQueue.length) {
      const i = this.decodeQueue.shift()!;
      const blob = this.blobs[i];
      if (!blob || this.images.has(i) || this.decoding.has(i)) continue;
      this.decoding.add(i);
      decodeBlob(blob)
        .then((image) => {
          if (!this.wanted.has(i) && this.images.size >= this.capacity) {
            release(image);
            return;
          }
          this.images.set(i, image);
          this.evict();
          this.onFrameReady?.(i);
        })
        .catch(() => undefined)
        .finally(() => {
          this.decoding.delete(i);
          this.pumpDecode();
        });
    }
  }

  private evict() {
    if (this.images.size <= this.capacity) return;
    for (const [i, image] of this.images) {
      if (this.images.size <= this.capacity) break;
      if (this.wanted.has(i)) continue;
      release(image);
      this.images.delete(i);
    }
  }
}

async function decodeBlob(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Fall back to <img> decoding below.
    }
  }
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

function release(image: Drawable) {
  if (image instanceof HTMLImageElement) URL.revokeObjectURL(image.src);
  else image.close();
}
