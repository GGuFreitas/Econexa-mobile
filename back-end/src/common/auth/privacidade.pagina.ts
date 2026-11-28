import { escaparHtml, paginaHtml } from '@shared/html.js';

// Política de privacidade exigida pela Play Store (URL pública na ficha do app).
// O texto descreve o que o código faz hoje: se um dado novo passar a ser coletado ou
// compartilhado, esta página muda no mesmo PR.
export const VIGENCIA_POLITICA = '28 de novembro de 2026';

export function paginaDePoliticaDePrivacidade(contato: string): string {
  const email = escaparHtml(contato);
  const linkContato = `<a href="mailto:${email}">${email}</a>`;

  return paginaHtml({
    titulo: 'Política de privacidade',
    conteudo: [
      `<p><em>Em vigor desde ${VIGENCIA_POLITICA}.</em></p>`,
      '<p>O Mutira é um app para registrar problemas do bairro, apoiar, comentar e organizar ',
      'mutirões. Esta página explica quais dados pessoais tratamos, para quê e como você ',
      `controla isso, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018). `,
      `Dúvidas e pedidos: ${linkContato}.</p>`,

      '<h2>Dados que coletamos</h2>',
      '<ul>',
      '<li><strong>Conta:</strong> nome, e-mail e senha (guardada apenas como hash, nunca em texto). ',
      'Se você entrar com o Google, recebemos do Google seu nome, e-mail e um identificador da conta.</li>',
      '<li><strong>O que você publica:</strong> problemas (título, descrição, categoria e o local ',
      'do problema no mapa), fotos, comentários, apoios, denúncias e mutirões.</li>',
      '<li><strong>Fotos:</strong> antes de guardar, removemos os metadados do arquivo, incluindo ',
      'a localização GPS que a câmera grava na imagem.</li>',
      '<li><strong>Localização do aparelho:</strong> usada, com sua permissão, para mostrar ',
      'problemas perto de você e sugerir o local de um problema novo. Ela não é salva no seu ',
      'perfil. Você pode negar a permissão e usar o mapa normalmente.</li>',
      '<li><strong>Registros técnicos:</strong> o servidor registra o endereço IP e as ',
      'requisições recebidas, para segurança e para investigar falhas.</li>',
      '</ul>',
      '<p>Não usamos publicidade, não usamos ferramentas de rastreamento ou análise de ',
      'terceiros e não vendemos dados.</p>',

      '<h2>Para que usamos</h2>',
      '<ul>',
      '<li>Criar e manter sua conta, confirmar seu e-mail e permitir recuperar a senha.</li>',
      '<li>Mostrar o que você publica para a comunidade, assinado com seu nome.</li>',
      '<li>Encaminhar um problema ao órgão público responsável, quando você pede.</li>',
      '<li>Moderar conteúdo denunciado e evitar abuso e spam.</li>',
      '</ul>',

      '<h2>Com quem compartilhamos</h2>',
      '<ul>',
      '<li><strong>Público:</strong> problemas, fotos, comentários e mutirões ficam visíveis a ',
      'qualquer pessoa no app, com seu nome. Seu e-mail nunca é exibido.</li>',
      '<li><strong>Órgãos públicos:</strong> ao encaminhar um problema, enviamos por e-mail ao ',
      'órgão escolhido os dados do problema, o link público dele e o seu nome como autor do pedido.</li>',
      '<li><strong>Google:</strong> apenas se você escolher entrar com o Google, para confirmar ',
      'sua identidade.</li>',
      '<li><strong>Prestadores de infraestrutura:</strong> hospedagem do servidor e envio de ',
      'e-mails, que tratam os dados só para prestar esse serviço.</li>',
      '</ul>',

      '<h2>Por quanto tempo guardamos</h2>',
      '<p>Enquanto sua conta existir. Ao excluir a conta, apagamos nome, e-mail, senha, sessões e ',
      'o vínculo com o Google; o que você publicou continua visível como ',
      '<strong>Conta excluída</strong>, sem dados que identifiquem você. ',
      'Veja <a href="exclusao">como excluir sua conta</a>.</p>',

      '<h2>Seus direitos</h2>',
      '<p>Você pode pedir confirmação de que tratamos seus dados, acesso, correção, ',
      'anonimização, portabilidade, exclusão e informações sobre compartilhamento, além de ',
      `revogar o consentimento a qualquer momento. Escreva para ${linkContato}; respondemos em `,
      'até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>',

      '<h2>Segurança</h2>',
      '<p>A comunicação com o app é sempre criptografada (HTTPS), senhas são guardadas como hash ',
      'e o acesso ao banco de dados é restrito.</p>',

      '<h2>Crianças e adolescentes</h2>',
      '<p>O Mutira não é direcionado a menores de 13 anos. Adolescentes devem usar o app com ',
      'o acompanhamento dos responsáveis.</p>',

      '<h2>Mudanças nesta política</h2>',
      '<p>Se esta política mudar, atualizamos a data no topo e avisamos no app quando a mudança ',
      'afetar o uso dos seus dados.</p>',
    ].join(''),
  });
}
