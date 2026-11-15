import type { MensagemEmail } from '@shared/email.js';

export const VALIDADE_DA_VERIFICACAO_HORAS = 24;
export const VALIDADE_DO_CODIGO_MINUTOS = 30;

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

export function emailDeCodigo(para: string, codigo: string): MensagemEmail {
  return {
    para,
    assunto: 'Seu código para redefinir a senha do Mutira',
    corpo: [
      'Olá!',
      '',
      'Use este código para redefinir a senha da sua conta no Mutira:',
      '',
      codigo,
      '',
      `O código vale por ${VALIDADE_DO_CODIGO_MINUTOS} minutos e só pode ser usado uma vez.`,
      '',
      'Se não foi você que pediu, ignore esta mensagem: sua senha continua a mesma.',
      '',
      'Equipe Mutira',
    ].join('\n'),
  };
}
