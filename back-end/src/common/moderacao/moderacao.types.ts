export interface ProblemaDenunciado {
  problema_id: number;
  titulo: string;
  status: string;
  autor_id: number;
  autor_nome: string;
  autor_bloqueado: boolean;
  total_denuncias: number;
  ultima_denuncia_em: Date | string;
  motivos: string[];
}

export interface FilaDeDenunciasQuery {
  pagina: number;
  limite: number;
}

export interface AlvoDoBloqueio {
  id: number;
  role: string;
  bloqueado_em: Date | null;
  excluido_em: Date | null;
}
