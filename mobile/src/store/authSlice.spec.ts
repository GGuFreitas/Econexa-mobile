import { describe, expect, it } from 'vitest';
import reducer, {
  logout,
  restauracaoFalhou,
  restauracaoIniciada,
  setCredentials,
  type AuthState,
  type User,
} from './authSlice';

const ana: User = {
  id: '1',
  name: 'Ana',
  email: 'ana@email.com',
  role: 'citizen',
  vote_weight: 1,
};

const autenticado: AuthState = {
  user: ana,
  accessToken: 'acesso',
  refreshToken: 'refresh',
  situacao: 'autenticado',
  motivoDoEncerramento: null,
};

describe('authSlice', () => {
  it('nasce restaurando: o app só sabe se há sessão depois de ler o armazenamento', () => {
    expect(reducer(undefined, { type: '@@init' })).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      situacao: 'restaurando',
      motivoDoEncerramento: null,
    });
  });

  it('guarda usuário, access e refresh token e passa a autenticado', () => {
    const state = reducer(
      undefined,
      setCredentials({ user: ana, accessToken: 'acesso', refreshToken: 'refresh' }),
    );

    expect(state).toEqual(autenticado);
  });

  it('um login novo apaga o motivo do encerramento anterior', () => {
    const encerrado = reducer(autenticado, logout('CONTA_BLOQUEADA'));
    const state = reducer(
      encerrado,
      setCredentials({ user: ana, accessToken: 'outro', refreshToken: 'outro' }),
    );

    expect(state.motivoDoEncerramento).toBeNull();
  });


  it('a falha na restauração mantém o refresh token para tentar de novo', () => {
    const restaurando = reducer(undefined, restauracaoIniciada());
    const state = reducer(restaurando, restauracaoFalhou({ refreshToken: 'refresh', user: ana }));

    expect(state).toMatchObject({
      situacao: 'erroDeRede',
      refreshToken: 'refresh',
      accessToken: null,
      user: ana,
    });
    expect(reducer(state, restauracaoIniciada()).situacao).toBe('restaurando');
  });

  it('logout limpa tudo e fica anônimo, sem motivo quando a pessoa pediu', () => {
    const state = reducer(autenticado, logout());

    expect(state).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      situacao: 'anonimo',
      motivoDoEncerramento: null,
    });
  });

  it('logout encerrado pelo servidor guarda o motivo para o login explicar', () => {
    expect(reducer(autenticado, logout('SESSAO_COMPROMETIDA')).motivoDoEncerramento).toBe(
      'SESSAO_COMPROMETIDA',
    );
  });
});
