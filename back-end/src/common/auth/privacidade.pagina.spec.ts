import { describe, expect, it } from 'vitest';
import { paginaDePoliticaDePrivacidade } from './privacidade.pagina.js';

describe('página de política de privacidade', () => {
  it('cobre os itens que a Play Store e a LGPD exigem', () => {
    const html = paginaDePoliticaDePrivacidade('privacidade@mutira.app');

    expect(html).toContain('Política de privacidade');
    expect(html).toContain('Dados que coletamos');
    expect(html).toContain('Com quem compartilhamos');
    expect(html).toContain('Seus direitos');
    expect(html).toContain('mailto:privacidade@mutira.app');
    expect(html).toContain('href="exclusao"');
  });

  it('declara que o nome do autor vai no encaminhamento ao órgão', () => {
    const html = paginaDePoliticaDePrivacidade('privacidade@mutira.app');

    expect(html).toContain('o seu nome como autor do pedido');
  });

  it('escapa o contato configurado', () => {
    const html = paginaDePoliticaDePrivacidade('"><script>alert(1)</script>');

    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
