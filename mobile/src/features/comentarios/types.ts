export interface ComentarioAutor {
  id: number;
  nome: string;
}

export interface Comentario {
  id: number;
  problema_id: number;
  conteudo: string;
  criado_em: string;
  autor: ComentarioAutor;
  pode_excluir: boolean;
}

export interface ComentarioQuery {
  problemaId: number;
  pagina?: number;
  limite?: number;
}

export interface CriarComentarioPayload {
  problemaId: number;
  conteudo: string;
}

export interface ExcluirComentarioPayload {
  problemaId: number;
  comentarioId: number;
}

export interface ExclusaoComentarioResultado {
  excluido: boolean;
}
