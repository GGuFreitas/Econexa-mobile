import { describe, expect, it } from 'vitest';
import { ApiError } from '@services/ApiError';
import { mensagemDeErro } from './mensagemDeErro';

const PADRAO = 'Não deu certo.';

describe('mensagemDeErro', () => {
  it('trata 401 como credencial inválida', () => {
    expect(mensagemDeErro(new ApiError('Token inválido ou expirado.', 401), PADRAO)).toBe(
      'E-mail ou senha incorretos.',
    );
  });

  it('trata 429 como excesso de tentativas', () => {
    expect(mensagemDeErro(new ApiError('Muitas requisições.', 429), PADRAO)).toBe(
      'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
    );
  });

  it('distingue falha de rede, que não tem status', () => {
    expect(mensagemDeErro(new ApiError('Network Error'), PADRAO)).toBe(
      'Não foi possível falar com o servidor. Verifique sua conexão.',
    );
  });

  it('repassa a mensagem do servidor nos demais status', () => {
    expect(mensagemDeErro(new ApiError('Já existe um usuário com este e-mail.', 409), PADRAO)).toBe(
      'Já existe um usuário com este e-mail.',
    );
    expect(mensagemDeErro(new ApiError('Problema não encontrado.', 404), PADRAO)).toBe(
      'Problema não encontrado.',
    );
  });

  it('cai no padrão quando o erro não diz nada', () => {
    expect(mensagemDeErro({}, PADRAO)).toBe(PADRAO);
    expect(mensagemDeErro(new Error(''), PADRAO)).toBe(PADRAO);
  });
});
