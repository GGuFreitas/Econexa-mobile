import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { dbPool } from '@config/database.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { contarDenuncias, criarDenuncia, listarDenuncias } from './denuncias.handler.js';

describe('denuncias: uma por usuário por problema', () => {
  let autor: number;
  let problemaId: number;

  beforeEach(async () => {
    await limparBanco();
    autor = await criarUsuario('Nina Denuncia');
    problemaId = await criarProblemaNoBanco({ usuarioId: autor });
  });

  afterAll(encerrarBanco);

  it('denunciar de novo com outro motivo vira uma linha só, com o motivo atualizado', async () => {
    const denunciante = await criarUsuario('Otávio');

    await criarDenuncia({ problemaId, usuarioId: denunciante, motivo: 'spam' });
    const segunda = await criarDenuncia({
      problemaId,
      usuarioId: denunciante,
      motivo: 'conteudo_inadequado',
    });

    const denuncias = await listarDenuncias(problemaId);

    expect(denuncias).toHaveLength(1);
    expect(denuncias[0].motivo).toBe('conteudo_inadequado');
    expect(denuncias[0].id).toBe(segunda.id);
    expect(await contarDenuncias(problemaId)).toBe(1);
  });

  it('o banco recusa a segunda linha do mesmo par mesmo por fora do handler', async () => {
    const denunciante = await criarUsuario('Paula');
    await criarDenuncia({ problemaId, usuarioId: denunciante, motivo: 'spam' });

    await expect(
      dbPool.query(
        'INSERT INTO problema_denuncias (problema_id, usuario_id, motivo) VALUES ($1, $2, $3)',
        [problemaId, denunciante, 'outro'],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('denunciantes diferentes continuam contando separado', async () => {
    const primeiro = await criarUsuario('Quel');
    const segundo = await criarUsuario('Rui');

    await criarDenuncia({ problemaId, usuarioId: primeiro, motivo: 'spam' });
    await criarDenuncia({ problemaId, usuarioId: segundo, motivo: 'duplicado' });
    await criarDenuncia({ problemaId, usuarioId: segundo, motivo: 'outro' });

    expect(await contarDenuncias(problemaId)).toBe(2);
    expect(await listarDenuncias(problemaId)).toHaveLength(2);
  });
});
