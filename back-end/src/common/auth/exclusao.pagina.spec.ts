import { describe, expect, it } from 'vitest';
import { paginaDeExclusaoDeConta } from './exclusao.pagina.js';

describe('página de exclusão de conta', () => {
  it('explica o caminho pelo app, o pedido por e-mail e o que é apagado', () => {
    const html = paginaDeExclusaoDeConta('privacidade@mutira.app');

    expect(html).toContain('Excluir conta');
    expect(html).toContain('mailto:privacidade@mutira.app');
    expect(html).toContain('O que é apagado');
    expect(html).toContain('Conta excluída');
  });

  it('escapa o contato configurado', () => {
    const html = paginaDeExclusaoDeConta('"><script>alert(1)</script>');

    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
