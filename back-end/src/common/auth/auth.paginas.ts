import { paginaHtml } from '@shared/html.js';
import { VALIDADE_DA_VERIFICACAO_HORAS } from './auth.emails.js';
import type { ResultadoDaConfirmacao } from './auth.types.js';

const VOLTAR_AO_APP = '<p>Pode fechar esta página e voltar para o app Mutira.</p>';

const PAGINAS: Record<ResultadoDaConfirmacao, { titulo: string; conteudo: string }> = {
  confirmado: {
    titulo: 'E-mail confirmado',
    conteudo: `<p>Pronto! Seu e-mail foi confirmado.</p>${VOLTAR_AO_APP}`,
  },
  ja_confirmado: {
    titulo: 'E-mail já confirmado',
    conteudo: `<p>Este e-mail já estava confirmado. Não é preciso fazer mais nada.</p>${VOLTAR_AO_APP}`,
  },
  invalido: {
    titulo: 'Link inválido ou expirado',
    conteudo:
      `<p>Este link de confirmação não vale mais. Os links valem por ${VALIDADE_DA_VERIFICACAO_HORAS} horas.</p>` +
      '<p>No app Mutira, abra o seu perfil e peça um novo e-mail de confirmação.</p>',
  },
};

export function paginaDaConfirmacao(resultado: ResultadoDaConfirmacao): string {
  return paginaHtml(PAGINAS[resultado]);
}

export function paginaDeMuitasTentativas(): string {
  return paginaHtml({
    titulo: 'Muitas tentativas',
    conteudo:
      '<p>Recebemos tentativas demais a partir desta conexão. Espere um minuto e abra o link de novo.</p>',
  });
}
