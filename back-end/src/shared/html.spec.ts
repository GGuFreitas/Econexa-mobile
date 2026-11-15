import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply } from 'fastify';
import { escaparHtml, paginaHtml, responderHtml } from './html.js';

function respostaFalsa() {
  const reply = { status: vi.fn(), header: vi.fn(), send: vi.fn() };
  reply.status.mockReturnValue(reply);
  reply.header.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
}

describe('html', () => {
  it('escapa os cinco caracteres que abrem tag ou atributo', () => {
    expect(escaparHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;',
    );
  });

  it('a página escapa o título, mantém o conteúdo e é legível no celular', () => {
    const html = paginaHtml({ titulo: 'Ana <b>', conteudo: '<p>Olá</p>' });

    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<h1>Ana &lt;b&gt;</h1>');
    expect(html).not.toContain('Ana <b>');
    expect(html).toContain('<p>Olá</p>');
  });

  it('responde com os cabeçalhos que mantêm a página fora de cache, de referer e de script', () => {
    const reply = respostaFalsa();

    responderHtml(reply as unknown as FastifyReply, '<p>x</p>');

    expect(reply.status).toHaveBeenCalledWith(200);
    const cabecalhos = Object.fromEntries(reply.header.mock.calls);
    expect(cabecalhos).toEqual({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    });
    expect(reply.send).toHaveBeenCalledWith('<p>x</p>');
  });

  it('aceita outro status', () => {
    const reply = respostaFalsa();

    responderHtml(reply as unknown as FastifyReply, '<p>x</p>', 429);

    expect(reply.status).toHaveBeenCalledWith(429);
  });
});
