import { describe, it, expect } from 'vitest';
import { ETAPAS_STATUS, iconeStatus, opcoesDeStatus, rotuloStatus } from './status';

describe('opcoesDeStatus', () => {
  it('oferece apenas as transições que o backend autorizou', () => {
    expect(opcoesDeStatus(['em_analise', 'resolvido'])).toEqual([
      { label: 'Em análise', value: 'em_analise' },
      { label: 'Resolvido', value: 'resolvido' },
    ]);
  });

  it('não oferece nada quando o backend não autoriza nenhuma transição', () => {
    expect(opcoesDeStatus([])).toEqual([]);
    expect(opcoesDeStatus()).toEqual([]);
  });
});

describe('rotuloStatus', () => {
  it('traduz o status do backend', () => {
    expect(rotuloStatus('em_analise')).toBe('Em análise');
    expect(rotuloStatus('encaminhado')).toBe('Encaminhado');
  });

  it('devolve o valor cru para status desconhecido em vez de inventar rótulo', () => {
    expect(rotuloStatus('arquivado')).toBe('arquivado');
  });
});

describe('trilha de status', () => {
  it('segue o caminho até o resultado, na ordem', () => {
    expect(ETAPAS_STATUS).toEqual(['ativo', 'em_analise', 'encaminhado', 'resolvido']);
  });

  it('dá um ícone próprio a cada etapa (status nunca só por cor)', () => {
    const icones = ETAPAS_STATUS.map(iconeStatus);
    expect(new Set(icones).size).toBe(ETAPAS_STATUS.length);
    expect(iconeStatus('removido')).not.toBe(iconeStatus('ativo'));
  });
});
