export interface CriarDenunciaInput {
  problemaId: number;
  usuarioId: number;
  motivo: string;
}

export interface Denuncia {
  id: number;
  problema_id: number;
  usuario_id: number;
  motivo: string;
  criado_em: Date | string;
}
