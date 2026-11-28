/** Aplica opacidade a uma cor hexadecimal da paleta (#RGB ou #RRGGBB). */
export function comAlfa(hex: string, alfa: number): string {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.replace(/./g, (c) => c + c) : limpo.slice(0, 6);
  const r = parseInt(cheio.slice(0, 2), 16);
  const g = parseInt(cheio.slice(2, 4), 16);
  const b = parseInt(cheio.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}
