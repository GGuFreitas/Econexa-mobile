const ROTULO_POR_MOTIVO: Record<string, string> = {
  spam: 'Spam',
  conteudo_inadequado: 'Conteúdo inadequado',
  duplicado: 'Duplicado',
  outro: 'Outro',
};

export function rotuloDoMotivo(motivo: string): string {
  return ROTULO_POR_MOTIVO[motivo] ?? motivo;
}

export function resumoDosMotivos(motivos: string[]): { rotulo: string; quantidade: number }[] {
  const contagem = new Map<string, number>();
  for (const motivo of motivos) contagem.set(motivo, (contagem.get(motivo) ?? 0) + 1);
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([motivo, quantidade]) => ({ rotulo: rotuloDoMotivo(motivo), quantidade }));
}
