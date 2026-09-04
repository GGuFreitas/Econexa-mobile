export interface ProblemaDaPeticao {
  id: number;
  titulo: string;
  descricao?: string | null;
  local_nome?: string | null;
  cont_apoios: number;
  criado_em: Date | string;
}

export interface OrgaoDaPeticao {
  nome: string;
  esfera: string;
}

export interface DadosPeticao {
  problema: ProblemaDaPeticao;
  orgao: OrgaoDaPeticao;
  autor: string;
  linkPublico: string;
  mensagem?: string;
}

export interface Peticao {
  referencia: string;
  assunto: string;
  corpo: string;
}

function formatarData(valor: Date | string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'data não informada';
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function referenciaDoProblema(problemaId: number): string {
  return `MUTIRA-P${String(problemaId).padStart(6, '0')}`;
}

export function gerarPeticao(dados: DadosPeticao): Peticao {
  const referencia = referenciaDoProblema(dados.problema.id);
  const assunto = `[${referencia}] ${dados.problema.titulo}`;

  const linhas = [
    `Ao ${dados.orgao.nome} (esfera ${dados.orgao.esfera}),`,
    '',
    `Encaminhamos, por meio da plataforma Mutira, o registro comunitário abaixo para conhecimento e providências.`,
    '',
    `Referência: ${referencia}`,
    `Título: ${dados.problema.titulo}`,
    `Local: ${dados.problema.local_nome?.trim() || 'não informado'}`,
    `Registrado em: ${formatarData(dados.problema.criado_em)}`,
    `Apoios da comunidade: ${dados.problema.cont_apoios}`,
    '',
    'Descrição:',
    dados.problema.descricao?.trim() || 'Sem descrição adicional informada pelo autor.',
  ];

  const complemento = dados.mensagem?.trim();
  if (complemento) {
    linhas.push('', 'Complemento de quem encaminhou:', complemento);
  }

  linhas.push(
    '',
    `Acompanhe o registro em: ${dados.linkPublico}`,
    '',
    `Solicitamos retorno sobre as providências adotadas, citando a referência ${referencia}.`,
    '',
    'Atenciosamente,',
    `${dados.autor}`,
    'Plataforma Mutira',
  );

  return { referencia, assunto, corpo: linhas.join('\n') };
}
