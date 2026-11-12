import type { FastifyReply } from 'fastify';

const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caractere) => ENTIDADES[caractere]);
}

export interface PaginaHtml {
  titulo: string;
  conteudo: string;
}

export function paginaHtml({ titulo, conteudo }: PaginaHtml): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escaparHtml(titulo)} · Mutira</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 24px 16px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 17px;
    line-height: 1.5;
    background: #fafafa;
    color: #1a1a1a;
  }
  main {
    max-width: 32rem;
    margin: 0 auto;
    padding: 24px;
    background: #fff;
    border: 1px solid #e2e6ec;
    border-radius: 12px;
  }
  .marca { margin: 0 0 8px; color: #2e7d32; font-weight: 700; letter-spacing: 0.04em; }
  h1 { margin: 0 0 12px; font-size: 1.4rem; line-height: 1.3; }
  p { margin: 0 0 12px; }
  @media (prefers-color-scheme: dark) {
    body { background: #121212; color: #ececec; }
    main { background: #1e1e1e; border-color: #2c2c2c; }
    .marca { color: #66bb6a; }
  }
</style>
</head>
<body>
<main>
<p class="marca">Mutira</p>
<h1>${escaparHtml(titulo)}</h1>
${conteudo}
</main>
</body>
</html>
`;
}

export function responderHtml(reply: FastifyReply, html: string, status = 200): FastifyReply {
  return reply
    .status(status)
    .header('Content-Type', 'text/html; charset=utf-8')
    .header('Cache-Control', 'no-store')
    .header('Referrer-Policy', 'no-referrer')
    .header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
    .send(html);
}
