export type ProblemaDenunciado = {
  problema_id: number;
  titulo: string;
  status: string;
  autor_id: number;
  autor_nome: string;
  autor_bloqueado: boolean;
  total_denuncias: number;
  ultima_denuncia_em: string;
  motivos: string[];
};
