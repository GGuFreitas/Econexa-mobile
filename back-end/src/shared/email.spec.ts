import { describe, expect, it, vi } from 'vitest';
import { destinatarioEfetivo, enviarEmail, envioExternoLiberado, montarEnvelope } from './email.js';

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
