# Backend do Mutira

Este documento concentra as regras do backend e os padrões mais úteis para o MVP.

## 1. Objetivo do backend

O backend precisa ser simples, previsível e rápido para entregar:
- autenticação e perfis;
- cadastro de problemas;
- apoio da comunidade;
- organização de mutirões e eventos;
- notificações básicas;
- integração com IA via Google API quando necessário.

## 2. Variáveis de ambiente

O backend usa `dotenv` e valida com `zod`. As variáveis obrigatórias são:

- `NODE_ENV`: `development`, `test` ou `production`
- `PORT`: porta do servidor
- `DATABASE_URL`: conexão Postgres
- `CORS_ORIGINS`: origens permitidas separadas por vírgula
- `GOOGLE_API_KEY`: chave da API gratuita do Google para IA

O arquivo de exemplo está em `back-end/.env.example`.

## 3. Padrão de organização

Monolito modular por feature. Estrutura real do projeto:

```text
src/
├── config/      # env, pool do banco, knexfile, migrations
├── shared/      # primitivos: errors, auth, http, validate, cache, queue
├── common/      # blocos reutilizáveis: auth/, imagens/, abilities.ts
├── features/    # domínio: problemas, peticoes, mutiroes, apoios, eventos, usuarios, regioes, niveis
├── routes/      # fios HTTP por feature (routes/<feature>/index.ts)
└── workers/     # reservado para BullMQ (fase futura)
```

### Regras
- `routes/<feature>/index.ts`: adaptador HTTP — valida com zod (`@shared/validate`), chama o handler, responde com `ok/created` (`@shared/http`). Nada de regra de negócio.
- `features/<feature>/`: regra de negócio em handlers funcionais (`handler.ts` + `.sql.ts`). Sem classes, sem DI, sem framework.
- `common/`: building blocks transversais (auth, imagens, permissões). Não são features de domínio.
- `shared/`: utilidades sem dependência de domínio.
- Seams para evoluir sem reescrita: `shared/cache.ts` (interface `Cache` → `MemoryCache` hoje, Redis depois) e `shared/queue.ts` (interface `Queue` → `SyncQueue` hoje, BullMQ depois).
- Cross-feature leve: chama o `.sql` de outra feature. Cross-feature pesada: `queue.enqueue(...)`. Nenhuma feature importa o `routes/` de outra.

## 4. Fluxo de integração com Google AI

1. O frontend envia uma solicitação ao backend.
2. O backend valida e autoriza a requisição.
3. O backend chama a API do Google usando `GOOGLE_API_KEY`.
4. O backend devolve o resultado ao cliente.

Use este padrão para:
- gerar textos e resumos;
- classificar problemas;
- sugerir categorias ou respostas automáticas;
- enriquecer notificações.

### Exemplo de chamada

```ts
const response = await fetch('https://googleapis.com/v1/your-endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.GOOGLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: '...' }),
});
```

## 5. Regras de autenticação e perfil

O sistema de login deve ser simples no MVP:
- email e senha
- perfil básico com papel
- dados mínimos de cadastro

Estrutura recomendada:
- users
- profiles
- roles
- user_roles

Não comece com um sistema de permissões muito complexo. Papel + regra simples resolve bem para a primeira versão.

## 6. Fila para tarefas assíncronas

A fila deve ser usada para tarefas que não precisam bloquear a resposta do usuário.

### Exemplos
- compressão de imagem
- upload para storage
- envio de notificação após criação de problema
- geração de resumo tardio

### Exemplo simples de fluxo

```text
Cliente -> API
  -> salva o problema
  -> enfileira tarefa de processamento
  -> responde imediatamente

Worker -> processa tarefa em segundo plano
```

## 7. Cron para tarefas recorrentes

Use cron apenas para tarefas periódicas e previsíveis.

### Exemplos
- lembrar usuários de mutirões próximos
- enviar resumo diário de problemas ativos
- fechar ou revisar itens sem atividade há X dias

### Regra prática
- se a tarefa precisa ser executada no tempo certo, mas não precisa acontecer na hora da ação, use cron.

## 8. Bibliotecas recomendadas

- `zod` (v4) para validação de `env` e payloads;
- `fastify` (v5) para API leve;
- `@fastify/cors` para controle de origens;
- `@fastify/compress` para compressão;
- `pg` para Postgres (pool em `config/database.ts`);
- `knex` para migrations;
- `@node-rs/argon2` para hash de senha (substitui bcrypt);
- `jsonwebtoken` para tokens;
- `vitest` para testes;
- `tsx` para rodar TS em dev.

## 9. Boas práticas para não exagerar

- não crie fila para tudo;
- não use cron para tarefas de resposta imediata;
- mantenha um worker simples;
- agrupe tarefas por contexto, não por funcionalidade mínima.

## 10. Módulos iniciais sugeridos

- auth (em `common/auth`)
- problemas
- peticoes
- apoios (antes "supports")
- mutiroes
- eventos
- regioes
- niveis

O MVP pode começar com auth, problemas, apoios e mutiroes. Os demais podem entrar depois, sem perder a coerência do sistema.

## 11. Módulo problemas (geoespacial)

O módulo `problemas` é a espinha dorsal do mapa. Implementado em `features/problemas/` (handler + `.sql`) e exposto em `routes/problemas/`.

- PostGIS obrigatório: o container do banco usa `postgis/postgis:15-3.4`; a migration `002` habilita `postgis` + `pgcrypto`.
- `problemas.geom` é `geometry(Point, 4326)`; listagem por raio usa `ST_DWithin` e `ST_Distance` para ordenar por proximidade.
- Coordenadas validadas contra o bbox do Brasil (lat −33.75..5.27, lng −73.99..−34.79).
- `tipo` distingue `problema` | `ponto_positivo` | `cultural`; `status` segue o workflow `ativo → em_analise → encaminhado → resolvido / removido`.
- `causas` fixas (Mobilidade, Infraestrutura, Poluição, Desmatamento, Cultura, Segurança, Saúde, Educação) + `tags` livres para filtro fino no mapa.
- Contadores (`cont_apoios`, `cont_apoios_ponderados`, `cont_visualizacoes`): o apoio já está implementado em `common/apoios/` (idempotente via PK `(problema_id, usuario_id)` + `ON CONFLICT DO NOTHING`; incrementa contadores só quando a linha é nova, ponderado pelo `peso_voto` do usuário). Rotas: `POST/DELETE /problemas/:id/apoios`.

### 11.1 Endpoints
- `POST /problemas` (auth) — cria problema (título obrigatório, ≤10 tags, bbox Brasil).
- `GET /problemas` — lista por proximidade (`lat`,`lng`,`raio`) ou por peso; filtros `status`, `tipo` (`problema`|`ponto_positivo`|`cultural`), `escopo`, `causaId`, `tags` (array, operador `&&`).
- `GET /problemas/estatisticas` — agregações por causa e por tipo (+ total), respeitando os filtros; alimenta filtros do mapa.
- `GET /problemas/tendencias` — top por `cont_apoios_ponderados` (`limite`, default 10) + filtros.
- `GET /problemas/:id` — detalhe (incrementa `cont_visualizacoes`).
- `POST/DELETE /problemas/:id/apoios` (auth) — apoio idempotente ponderado por `peso_voto`.
- `POST /problemas/:id/denuncias` (auth, rate-limit) — denúncia de conteúdo (`motivo` ∈ spam|conteudo_inadequado|duplicado|outro).
- `GET /problemas/:id/denuncias` (auth) — lista denúncias (moderação).

### 11.2 Anti-fake / anti-spam
- **Dedupe de coordenadas**: `criarProblema` verifica se já existe problema da mesma `causa_id` e `tipo` num raio de 15m (`ST_DWithin`); se sim, retorna o existente em vez de criar duplicata.
- **Rate-limit**: primitiva em `shared/ratelimit.ts` (janela fixa em memória; trocar por Redis depois). Aplicada em `POST /problemas` (5/min por usuário) e `POST /problemas/:id/denuncias` (3/min por usuário); estouro responde `429`.
- **Denúncias**: tabela `problema_denuncias` (FK problema/usuário, `motivo`); alimenta moderação e o futuro escalonamento.

## 12. Módulo eventos (mutirões)

Mutirões e eventos cívicos. Implementado em `common/eventos/` e exposto em `routes/eventos/`.

- `eventos` (geom `Point` opcional, `tipo` ∈ `mutirao|encontro|outro`, `status` ∈ `planejado|em_andamento|realizado|cancelado`).
- `evento_problema` (PK `evento_id, problema_id`, `resolveu`): vincula um problema a um mutirão; se `resolveu=true`, o problema vai para `status='resolvido'`.
- `evento_participantes` (PK `evento_id, usuario_id`): inscrições idempotentes (`ON CONFLICT DO NOTHING`).

### 12.1 Endpoints
- `POST /eventos` (auth) — cria evento (validação: título ≥3, bbox Brasil, `dataInicio` obrigatória).
- `GET /eventos` — lista por proximidade (`lat`,`lng`,`raio`) ou data; filtros `status`, `tipo`, `causaId`.
- `GET /eventos/:id` — detalhe.
- `GET /eventos/:id/estatisticas` — `cont_participantes` e `problemas_vinculados`.
- `POST /eventos/:id/problemas/:problemaId` (auth) — vincula problema (`body.resolveu` opcional).
- `POST /eventos/:id/inscricoes` (auth) — inscreve (idempotente).
- `DELETE /eventos/:id/inscricoes` (auth) — desinscreve.

## 13. Módulo comentários

Comentários de um problema. Implementado em `common/comentarios/` (handler + `.sql` + schemas) e exposto dentro de `routes/problemas/`, como já acontece com apoios e denúncias.

- `problema_comentarios` (FK problema/usuário com `ON DELETE CASCADE`, `conteudo` text, `criado_em`), índice `(problema_id, criado_em DESC)`.
- Escopo do MVP: listar, criar e excluir. **Sem** respostas aninhadas, menções, reactions, edição, anexos ou ranking.
- Autorização da exclusão é **do servidor**: o handler carrega o comentário, confere o `problema_id` e compara `usuario_id` com o usuário do token — outro usuário recebe `403`; comentário inexistente ou de outro problema recebe `404`.
- A listagem é pública e usa `optionalAuth` (`shared/auth.ts`): com token válido cada comentário volta com `pode_excluir: true` nos do próprio usuário; sem token, tudo `false`. Assim o cliente não precisa derivar autoria comparando ids.
- Resposta: `{ id, problema_id, conteudo, criado_em, autor: { id, nome }, pode_excluir }`. Não há avatar porque `users` não tem essa coluna.
- Rate-limit: `comentarioLimiter` (10/min por usuário) no `POST`.

### 13.1 Endpoints
- `GET /problemas/:id/comentarios` (público, auth opcional) — lista do mais recente para o mais antigo; `pagina` e `limite` (default 20, máximo 50).
- `POST /problemas/:id/comentarios` (auth, rate-limit) — cria comentário (`conteudo` 1..1000, com trim).
- `DELETE /problemas/:id/comentarios/:comentarioId` (auth) — exclui apenas o próprio comentário; responde `{ excluido: true }`.

### 13.2 Lacuna conhecida: atividade do problema
Não existe tabela nem endpoint de **eventos/atividade**, e `POST/DELETE /problemas/:id/apoios` não expõem quem apoiou nem quando. A timeline do app é montada no cliente com o que já existe (problema, imagens, comentários, mobilizações); eventos de apoio ficam de fora até que essa decisão de modelagem seja tomada.
