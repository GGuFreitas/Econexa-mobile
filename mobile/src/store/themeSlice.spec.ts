import { describe, it, expect } from 'vitest';
import reducer, { resolverTema, setTheme, toggleTheme } from './themeSlice';

describe('tema', () => {
  it('começa seguindo o sistema', () => {
    expect(reducer(undefined, { type: '@@init' }).mode).toBe('system');
  });

  it('segue o tema do aparelho quando a preferência é "system"', () => {
    expect(resolverTema('system', 'dark')).toBe('dark');
    expect(resolverTema('system', 'light')).toBe('light');
    expect(resolverTema('system', null)).toBe('light');
  });

  it('respeita a escolha manual', () => {
    expect(resolverTema('dark', 'light')).toBe('dark');
    expect(resolverTema('light', 'dark')).toBe('light');
  });

  it('alterna e define o tema', () => {
    expect(reducer({ mode: 'system' }, toggleTheme()).mode).toBe('dark');
    expect(reducer({ mode: 'dark' }, toggleTheme()).mode).toBe('light');
    expect(reducer({ mode: 'light' }, setTheme('system')).mode).toBe('system');
  });
});
