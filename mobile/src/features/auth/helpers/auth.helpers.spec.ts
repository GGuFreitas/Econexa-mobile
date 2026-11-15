import { describe, expect, it } from 'vitest';
import { buildLoginPayload } from './buildLoginPayload';

describe('auth helpers', () => {
  it('buildLoginPayload normaliza email', () => {
    expect(buildLoginPayload('  B@E.com ', '123')).toEqual({
      email: 'b@e.com',
      password: '123',
    });
  });

  it('buildLoginPayload não mexe na senha', () => {
    expect(buildLoginPayload('a@e.com', ' Senha Com Espaço ').password).toBe(' Senha Com Espaço ');
  });
});
