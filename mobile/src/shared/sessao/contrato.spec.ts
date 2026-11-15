import { describe, expect, it } from 'vitest';
import { credenciaisDaSessao, mapUser, type SessaoDaApi } from './contrato';

const sessao: SessaoDaApi = {
  accessToken: 'jwt-de-acesso',
  refreshToken: 'refresh-opaco',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: {
    id: 7,
    name: 'Bia',
    email: 'b@e.com',
    role: 'specialist',
    vote_weight: 3,
    email_verified: false,
    has_password: true,
  },
};

describe('contrato da sessão', () => {
  it('mapUser converte id numérico e mantém os campos, inclusive os de verificação', () => {
    expect(mapUser(sessao.user)).toEqual({
      id: '7',
      name: 'Bia',
      email: 'b@e.com',
      role: 'specialist',
      vote_weight: 3,
      email_verified: false,
      has_password: true,
    });
  });

  it('mapUser reflete conta só-Google, sem senha e com e-mail confirmado', () => {
    const usuario = mapUser({ ...sessao.user, email_verified: true, has_password: false });

    expect(usuario.email_verified).toBe(true);
    expect(usuario.has_password).toBe(false);
  });

  it('credenciaisDaSessao leva os dois tokens e descarta expiresIn e tokenType', () => {
    expect(credenciaisDaSessao(sessao)).toEqual({
      user: mapUser(sessao.user),
      accessToken: 'jwt-de-acesso',
      refreshToken: 'refresh-opaco',
    });
  });
});
