import { atualizarUsuario } from '@shared/sessao/sessao';
import { buscarUsuarioAtual } from '../api/usuarioAtual';

export async function recarregarUsuario(): Promise<void> {
  const usuario = await buscarUsuarioAtual();
  await atualizarUsuario(usuario);
}
