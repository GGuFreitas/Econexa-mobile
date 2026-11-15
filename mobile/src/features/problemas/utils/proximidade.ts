export const RAIO_PERTO_METROS = 8000;

export function formatarDistancia(metros: number): string {
  const arredondado = Math.round(metros / 10) * 10;
  if (arredondado < 1000) return `${Math.max(10, arredondado)} m`;
  const km = metros / 1000;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

export function rotuloProblemas(total: number): string {
  return total === 1 ? '1 problema' : `${total} problemas`;
}
