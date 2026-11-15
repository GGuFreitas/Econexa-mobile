export const META_APOIOS = 50;

export function progressoMeta(apoios: number): number {
  return Math.min(100, Math.max(0, Math.round((apoios / META_APOIOS) * 100)));
}
