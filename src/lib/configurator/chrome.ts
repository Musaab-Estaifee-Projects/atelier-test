const FALLBACK_SWATCHES = [
  "/images/configurator/swatch-1.png",
  "/images/configurator/swatch-2.png",
  "/images/configurator/swatch-3.png",
] as const;

const FINISH_SWATCHES = [
  "/images/configurator/finish-1.png",
  "/images/configurator/finish-2.png",
  "/images/configurator/finish-3.png",
] as const;

function hashedAsset(id: string, pool: readonly string[]): string {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n += id.charCodeAt(i);
  return pool[n % pool.length] ?? pool[0];
}

export function materialThumb(id: string, thumbnailUrl?: string): string {
  return thumbnailUrl || hashedAsset(id, FALLBACK_SWATCHES);
}

export function finishThumb(id: string, thumbnailUrl?: string): string {
  return thumbnailUrl || hashedAsset(id, FINISH_SWATCHES);
}
