import type { Aviso, PapelNaAcao } from '../types';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const UM_DIA = 24 * 60 * 60 * 1000;

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${primeira}${ultima}`.toUpperCase();
}

export function membroDesde(iso: string): string {
  const data = new Date(iso);
  return `${MESES[data.getMonth()]}/${data.getFullYear()}`;
}

function inicioDoDia(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
}

export function quandoAcontece(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const dias = Math.round((inicioDoDia(data) - inicioDoDia(agora)) / UM_DIA);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias < 7) return DIAS[data.getDay()];
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}, ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

export function rotuloPapel(papel: PapelNaAcao): string {
  return papel === 'organizadora' ? 'você organiza' : 'você participa';
}

export interface AvisoApresentado {
  chave: string;
  icone: string;
  titulo: string;
  texto: string;
  alerta: boolean;
  progresso?: number;
}

export function apresentarAviso(aviso: Aviso, agora: Date = new Date()): AvisoApresentado {
  if (aviso.tipo === 'perto_da_meta') {
    const faltam = aviso.meta - aviso.cont_apoios;
    return {
      chave: `meta-${aviso.problema_id}`,
      icone: 'flag-checkered',
      titulo: faltam === 1 ? 'Falta 1 apoio' : `Faltam ${faltam} apoios`,
      texto: `"${aviso.titulo}" está perto da meta. Compartilhe com os vizinhos.`,
      alerta: false,
      progresso: Math.min(100, Math.round((aviso.cont_apoios / aviso.meta) * 100)),
    };
  }
  if (aviso.tipo === 'sem_resposta') {
    return {
      chave: `encaminhamento-${aviso.encaminhamento_id}`,
      icone: 'clock-alert-outline',
      titulo: `Sem resposta há ${aviso.dias} dias`,
      texto: `${aviso.orgao} ainda não respondeu sobre "${aviso.titulo}". Que tal reenviar?`,
      alerta: true,
    };
  }
  const confirmadas =
    aviso.cont_participantes === 1 ? '1 confirmada' : `${aviso.cont_participantes} confirmadas`;
  return {
    chave: `acao-${aviso.mobilizacao_id}`,
    icone: 'account-group',
    titulo: `Sua ação é ${quandoAcontece(aviso.data_inicio, agora)}`,
    texto: `${aviso.titulo} · ${confirmadas} · ${rotuloPapel(aviso.papel)}`,
    alerta: false,
  };
}

export { comAlfa } from '@shared/theme/alfa';

