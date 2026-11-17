export function alternarId(ids: number[] | undefined, id: number, apoiado: boolean): number[] {
  const atuais = ids ?? [];
  if (apoiado) return atuais.includes(id) ? atuais : [...atuais, id];
  return atuais.filter((atual) => atual !== id);
}

export function ajustarApoios<T extends { id: number; cont_apoios: number }>(
  itens: T[] | undefined,
  id: number,
  delta: number,
): T[] | undefined {
  if (!itens || delta === 0) return itens;
  return itens.map((item) =>
    item.id === id ? { ...item, cont_apoios: Math.max(0, item.cont_apoios + delta) } : item,
  );
}

export function deltaDeApoio(jaApoiava: boolean, apoiar: boolean): number {
  if (jaApoiava === apoiar) return 0;
  return apoiar ? 1 : -1;
}
