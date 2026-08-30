import { describe, expect, it } from 'vitest';
import { mapUser } from './mapUser';
import { buildLoginPayload } from './buildLoginPayload';

describe('auth helpers', () => {
  it('mapUser converte id numerico e mantem campos', () => {
    const result = mapUser({
      id: 7,
      name: 'Bia',
      email: 'b@e.com',
      role: 'organization',
      vote_weight: 3,
    });
    expect(result).toEqual({
      id: '7',
      name: 'Bia',
      email: 'b@e.com',
      role: 'organization',
      vote_weight: 3,
    });
  });

  it('buildLoginPayload normaliza email', () => {
    expect(buildLoginPayload('  B@E.com ', '123')).toEqual({
      email: 'b@e.com',
      password: '123',
    });
  });
});
