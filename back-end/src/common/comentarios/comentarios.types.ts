export interface ComentarioRow {
  id: number;
  problema_id: number;
  usuario_id: number;
  conteudo: string;
  criado_em: Date | string;
  autor_nome: string;
}

export interface ComentarioAutor {
  id: number;
  nome: string;
}

export interface Comentario {
  id: number;
  problema_id: number;
  conteudo: string;
  criado_em: Date | string;
  autor: ComentarioAutor;
  pode_excluir: boolean;
}

export interface CriarComentarioInput {
  problemaId: number;
  usuarioId: number;
  conteudo: string;
}

export interface ListarComentariosQuery {
  problemaId: number;
  usuarioId?: number;
  pagina?: number;
  limite?: number;
}

export interface ExcluirComentarioInput {
  comentarioId: number;
  problemaId: number;
  usuarioId: number;
}
