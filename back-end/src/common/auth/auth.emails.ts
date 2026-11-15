import type { MensagemEmail } from '@shared/email.js';

export const VALIDADE_DA_VERIFICACAO_HORAS = 24;

export function emailDeVerificacao(para: string, link: string): MensagemEmail {
  return {
    para,
    assunto: 'Confirme seu e-mail no Mutira',
    corpo: [
      'Olá!',
      '',
      'Para confirmar seu e-mail no Mutira, abra o link abaixo:',
      '',
      link,
      '',
      `O link vale por ${VALIDADE_DA_VERIFICACAO_HORAS} horas.`,
      '',
      'Se você não criou uma conta no Mutira, ignore esta mensagem.',
      '',
      'Equipe Mutira',
    ].join('\n'),
  };
}
