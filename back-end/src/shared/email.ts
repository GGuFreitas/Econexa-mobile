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

export interface ConfiguracaoSmtp {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
}

export interface OpcoesDoTransporte {
  host: string;
  port: number;
  secure: boolean;
  ignoreTLS?: boolean;
  requireTLS?: boolean;
  auth?: { user: string; pass: string };
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

export function opcoesDoTransporte(config: ConfiguracaoSmtp): OpcoesDoTransporte {
  const base = { host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE };

  if (!config.SMTP_USER) {
    return { ...base, ignoreTLS: true };
  }

  return {
    ...base,
    requireTLS: !config.SMTP_SECURE,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  };
}

let transporte: Transporter | null = null;

function obterTransporte(): Transporter {
  if (!transporte) {
    transporte = nodemailer.createTransport(opcoesDoTransporte(env));
  }
  return transporte;
}

export async function enviarEmail(mensagem: MensagemEmail): Promise<EnvelopeEmail> {
  const envelope = montarEnvelope(mensagem);
  await obterTransporte().sendMail(envelope);
  return envelope;
}
