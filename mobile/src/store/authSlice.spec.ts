import { describe, expect, it } from 'vitest';
import reducer, { logout, setCredentials } from './authSlice';

describe('authSlice', () => {
  it('should store the user and token when credentials are set', () => {
    const state = reducer(undefined, setCredentials({
      user: { id: '1', name: 'Ana', email: 'ana@email.com', role: 'citizen', vote_weight: 1 },
      token: 'jwt-token',
    }));

    expect(state.user?.email).toBe('ana@email.com');
    expect(state.token).toBe('jwt-token');
  });

  it('should clear the user and token on logout', () => {
    const state = reducer({ user: { id: '1', name: 'Ana', email: 'ana@email.com', role: 'citizen', vote_weight: 1 }, token: 'jwt-token' }, logout());

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
