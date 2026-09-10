export interface Imagem {
  id: number;
  tipo_entidade: string;
  entidade_id: number;
  url: string;
  principal: boolean;
  ordem: number;
  criado_em: Date;
}

export interface ImagemInput {
  tipo_entidade: string;
  entidade_id: number;
  url: string;
  principal?: boolean;
  ordem?: number;
}

export interface EvidenciaProblemaInput {
  problemaId: number;
  usuarioId: number;
  role: string;
  nomeArquivo: string;
  mimetype: string;
  conteudo: Buffer;
}
