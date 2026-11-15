import { escaparHtml, paginaHtml } from '@shared/html.js';

export function paginaDeExclusaoDeConta(contato: string): string {
  const email = escaparHtml(contato);
  const assunto = encodeURIComponent('Excluir minha conta no Mutira');

  return paginaHtml({
    titulo: 'Excluir sua conta',
    conteudo: [
      '<p>Você pode excluir sua conta do Mutira a qualquer momento.</p>',
      '<h2>Pelo app</h2>',
      '<p>Abra o Mutira, entre em <strong>Perfil</strong> e toque em <strong>Excluir conta</strong>. ',
      'A exclusão acontece na hora.</p>',
      '<h2>Sem o app</h2>',
      `<p>Envie um e-mail para <a href="mailto:${email}?subject=${assunto}">${email}</a> a partir do `,
      'endereço cadastrado, pedindo a exclusão. Atendemos em até 15 dias.</p>',
      '<h2>O que é apagado</h2>',
      '<p>Nome, e-mail, senha, sessões abertas e o vínculo com o Google. Você deixa de conseguir ',
      'entrar com essa conta.</p>',
      '<h2>O que continua</h2>',
      '<p>Problemas, comentários e apoios que você publicou continuam visíveis para a comunidade, ',
      'assinados como <strong>Conta excluída</strong>, sem nenhum dado que identifique você.</p>',
    ].join(''),
  });
}
