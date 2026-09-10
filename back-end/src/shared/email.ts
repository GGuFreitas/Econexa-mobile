import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@config/env.js';

export interface MensagemEmail {
  para: string;
  assunto: string;
  corpo: string;
}

export interface EnvelopeEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export function envioExternoLiberado(): boolean {
  return env.NODE_ENV === 'production' && env.SMTP_ALLOW_EXTERNAL;
}

export function destinatarioEfetivo(para: string): string {
  return envioExternoLiberado() ? para : env.SMTP_DEV_INBOX;
}

export function montarEnvelope(mensagem: MensagemEmail): EnvelopeEmail {
  const destinatario = destinatarioEfetivo(mensagem.para);
  const desviado = destinatario !== mensagem.para;

  return {
    from: env.SMTP_FROM,
    to: destinatario,
    subject: desviado ? `[DESENVOLVIMENTO] ${mensagem.assunto}` : mensagem.assunto,
    text: desviado
      ? [
          `Destinatário original: ${mensagem.para}`,
          'Este ambiente não entrega e-mail para fora: a mensagem foi desviada para a caixa local.',
          '',
          mensagem.corpo,
        ].join('\n')
      : mensagem.corpo,
  };
}

let transporte: Transporter | null = null;

function obterTransporte(): Transporter {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      ignoreTLS: true,
    });
  }
  return transporte;
}

export async function enviarEmail(mensagem: MensagemEmail): Promise<EnvelopeEmail> {
  const envelope = montarEnvelope(mensagem);
  await obterTransporte().sendMail(envelope);
  return envelope;
}
