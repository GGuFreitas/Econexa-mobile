import { describe, expect, it, vi } from 'vitest';
import {
  destinatarioEfetivo,
  enviarEmail,
  envioExternoLiberado,
  montarEnvelope,
  opcoesDoTransporte,
} from './email.js';

const sendMail = vi.fn().mockResolvedValue({ messageId: 'local' });

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

describe('email em desenvolvimento', () => {
  it('não libera envio externo fora de produção', () => {
    expect(envioExternoLiberado()).toBe(false);
  });

  it('desvia qualquer destinatário para a caixa local', () => {
    expect(destinatarioEfetivo('ouvidoria@exemplo.invalid')).toBe('caixa-dev@mutira.local');
  });

  it('marca o envelope como desenvolvimento e preserva o destinatário original no corpo', () => {
    const envelope = montarEnvelope({
      para: 'ouvidoria@exemplo.invalid',
      assunto: '[MUTIRA-P000042] Alagamento',
      corpo: 'Conteúdo da petição.',
    });

    expect(envelope.to).toBe('caixa-dev@mutira.local');
    expect(envelope.subject).toBe('[DESENVOLVIMENTO] [MUTIRA-P000042] Alagamento');
    expect(envelope.text).toContain('Destinatário original: ouvidoria@exemplo.invalid');
    expect(envelope.text).toContain('Conteúdo da petição.');
  });

  it('entrega o envelope ao transporte local sem sair para a rede', async () => {
    const envelope = await enviarEmail({
      para: 'prefeitura@exemplo.invalid',
      assunto: 'Assunto',
      corpo: 'Corpo',
    });

    expect(sendMail).toHaveBeenCalledWith(envelope);
    expect(envelope.to).toBe('caixa-dev@mutira.local');
  });
});

describe('opções do transporte SMTP', () => {
  const base = { SMTP_HOST: 'smtp.exemplo.invalid', SMTP_PORT: 587, SMTP_USER: '', SMTP_PASS: '' };

  it('sem usuário, fala com o SMTP local sem TLS nem autenticação', () => {
    expect(opcoesDoTransporte({ ...base, SMTP_SECURE: false })).toEqual({
      host: 'smtp.exemplo.invalid',
      port: 587,
      secure: false,
      ignoreTLS: true,
    });
  });

  it('com usuário e sem TLS implícito, exige STARTTLS antes de mandar a senha', () => {
    const opcoes = opcoesDoTransporte({ ...base, SMTP_SECURE: false, SMTP_USER: 'app', SMTP_PASS: 'segredo' });

    expect(opcoes.requireTLS).toBe(true);
    expect(opcoes.ignoreTLS).toBeUndefined();
    expect(opcoes.auth).toEqual({ user: 'app', pass: 'segredo' });
  });

  it('com TLS implícito não pede STARTTLS', () => {
    const opcoes = opcoesDoTransporte({
      ...base,
      SMTP_PORT: 465,
      SMTP_SECURE: true,
      SMTP_USER: 'app',
      SMTP_PASS: 'segredo',
    });

    expect(opcoes.secure).toBe(true);
    expect(opcoes.requireTLS).toBe(false);
  });
});
