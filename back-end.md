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
- `JWT_SECRET`: segredo do token (mínimo 16 caracteres)

As demais têm default e só precisam ser informadas para sair do padrão local:

| Variável | Default | Para que serve |
|---|---|---|
| `APP_PUBLIC_URL` | `http://localhost:19006` | base do link do problema citado na petição |
| `MINIO_ENDPOINT` | `localhost` | host do MinIO (`minio` dentro do compose) |
| `MINIO_PORT` | `9000` | porta da API do MinIO |
| `MINIO_USE_SSL` | `false` | `true`/`false` |
| `MINIO_ACCESS_KEY` | `minioadmin` | credencial de acesso |
| `MINIO_SECRET_KEY` | `minioadmin123` | credencial secreta |
| `MINIO_BUCKET` | `econexa-evidencias` | bucket das evidências |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | base da URL guardada em `imagens.url` |
| `SMTP_HOST` | `localhost` | host SMTP (`mailpit` dentro do compose) |
| `SMTP_PORT` | `1025` | porta SMTP |
| `SMTP_FROM` | `Mutira <nao-responda@mutira.local>` | remetente |
| `SMTP_DEV_INBOX` | `caixa-dev@mutira.local` | caixa que recebe **todo** e-mail fora de produção |
| `SMTP_ALLOW_EXTERNAL` | `false` | única chave que libera entrega externa, e só em produção |

O arquivo de exemplo está em `back-end/.env.example`.

## 2.1 Serviços do docker-compose

| Serviço | Imagem | Portas | Para que |
|---|---|---|---|
| `postgres` | `postgis/postgis:15-3.4` | 5432 | banco principal com PostGIS |
| `redis` | `redis:7-alpine` | 6379 | reservado (cache/fila ainda em memória) |
| `minio` | `minio/minio` | 9000 (API), 9001 (console) | storage das evidências, volume `minio_data` |
| `minio-bucket` | `minio/mc` | — | cria o bucket e libera leitura anônima na subida |
| `mailpit` | `axllent/mailpit` | 1025 (SMTP), 8025 (web) | caixa de entrada local, volume `mailpit_data` |
| `backend` | build local | 5000 | API |
| `mobile` | build local | 19006/19001/19002 | Expo |

## 2.2 Política de e-mail: nenhum e-mail real sai em desenvolvimento

Disparar mensagem para um órgão público real com dado de teste é inaceitável, então
o caminho é fechado no código, não na configuração:

- `shared/email.ts` calcula o destinatário efetivo em `destinatarioEfetivo()`. Ele só
  devolve o endereço original quando `NODE_ENV === 'production'` **e**
  `SMTP_ALLOW_EXTERNAL === 'true'`. Em qualquer outro caso a mensagem vai para
  `SMTP_DEV_INBOX`.
- O envelope desviado recebe o prefixo `[DESENVOLVIMENTO]` no assunto e o
  destinatário original no início do corpo, para conferência no Mailpit
  (http://localhost:8025).
- O transporte aponta para o Mailpit por variável de ambiente, sem credencial SMTP
  real em lugar nenhum do repositório.
- O seed de `orgaos` usa o domínio reservado `exemplo.invalid` (RFC 2606), que não
  resolve: mesmo com o envio externo ligado por engano, não há para onde entregar.
- Os testes mockam `nodemailer`/`@shared/email.js`: nenhuma requisição de rede.

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
- `shared/transacao.ts`: `emTransacao(fn)` pega um client do pool, roda `BEGIN`, entrega o `Executor` para o handler e faz `COMMIT`/`ROLLBACK`. As funções `.sql` que participam de transação recebem o executor como último parâmetro, com `dbPool` como default — quem não precisa de transação continua chamando igual.
- `shared/storage.ts`: cliente MinIO (`enviarObjeto`, `removerObjeto`, `urlPublica`).
- `shared/email.ts`: transporte nodemailer e a regra de destinatário seguro (seção 2.2).
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
- `@fastify/multipart` para upload de arquivo;
- `minio` como cliente S3-compatível do storage de evidências;
- `nodemailer` para o envio (apontado para o Mailpit em desenvolvimento);
- `vitest` para testes;
- `tsx` para rodar TS em dev;
- `pino-pretty` (dev) para o transport do logger configurado em `app.ts`.

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
- `problemas.geom` é `geometry(Point, 4326)`, e a unidade do SRID 4326 é **grau**. Por isso toda comparação de distância faz cast para `geography`, onde o argumento é **metro**: `ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)`, e o mesmo cast no `ST_Distance` que alimenta o alias `distancia_m`. Vale para `findNearbyProblema`, `listarProblemas` e `listarEventos` — comparar em `geometry` fazia o raio valer graus (o `15` do dedupe eram ~1.665 km e o `5000` da listagem era um filtro no-op).
- Índices: `idx_problemas_geom_geog` e `idx_eventos_geom_geog` são índices de **expressão** sobre `(geom::geography)` (migration `010`), porque o planner não usa um GIST da coluna crua quando a consulta compara o valor com cast. Os GIST antigos sobre `geom` foram removidos: nenhuma consulta usa mais predicado espacial em `geometry`, e o que sobrou (`ST_X`/`ST_Y`) são acessores escalares que não usam índice.
- Coordenadas validadas contra o bbox do Brasil (lat −33.75..5.27, lng −73.99..−34.79).
- `tipo` distingue `problema` | `ponto_positivo` | `cultural`; `status` segue o workflow `ativo → em_analise → encaminhado → resolvido / removido`.
- `causas` fixas (Mobilidade, Infraestrutura, Poluição, Desmatamento, Cultura, Segurança, Saúde, Educação) + `tags` livres para filtro fino no mapa.
- Contadores (`cont_apoios`, `cont_apoios_ponderados`, `cont_visualizacoes`): o apoio está em `common/apoios/`, idempotente via PK `(problema_id, usuario_id)` + `ON CONFLICT DO NOTHING` e ponderado pelo `peso_voto` do usuário. Inserção e contador são **um único statement** (`WITH novo AS (INSERT ...) UPDATE problemas ...`), dentro de `emTransacao` junto do evento — não há mais janela entre inserir a linha e mexer no contador. Rotas: `POST/DELETE /problemas/:id/apoios`.
- Cache: `listarProblemas` guarda 30 s em `shared/cache.ts` sob o prefixo `problemas:`. `invalidarCacheDeProblemas()` (`cache.deletePorPrefixo`) roda **depois do commit** em criar problema, alterar status, encaminhar, apoiar, desapoiar e vincular problema a evento.

### 11.1 Endpoints
- `POST /problemas` (auth, rate-limit) — cria problema (título obrigatório, ≤10 tags, bbox Brasil). Responde `{ criado, problema }`: **201** quando criou e emitiu `PROBLEMA_CRIADO`, **200** quando encontrou um registro parecido no mesmo ponto e devolveu o existente. O cliente precisa olhar `criado` — o status HTTP sozinho não deve virar "publicado com sucesso".
- `GET /problemas` — lista por proximidade (`lat`,`lng`,`raio` em metros) ou por peso; filtros `status`, `tipo` (`problema`|`ponto_positivo`|`cultural`), `escopo`, `causaId`, `tags` (array, operador `&&`). **`status` não tem default**: sem ele a listagem esconde apenas `removido`, para que encaminhar um problema não o faça sumir do mapa. Quem quiser só os ativos passa `status=ativo`.
- `GET /problemas/estatisticas` — agregações por causa e por tipo (+ total), respeitando os filtros (mesma regra de `status`); alimenta filtros do mapa.
- `GET /problemas/tendencias` — top por `cont_apoios_ponderados` (`limite`, default 10) + filtros.
- `GET /problemas/:id` (público, auth opcional) — detalhe (incrementa `cont_visualizacoes`); com token devolve também `pode_encaminhar`, `pode_adicionar_evidencia` e `transicoes_permitidas`.
- `PATCH /problemas/:id/status` (auth) — muda o status; emite `STATUS_ALTERADO` e `RESOLVIDO`.
- `GET /problemas/:id/eventos` (público) — histórico do problema (seção 14).
- `POST/DELETE /problemas/:id/apoios` (auth) — apoio idempotente ponderado por `peso_voto`; emite `APOIO_CRIADO` / `APOIO_REMOVIDO`.
- `POST /problemas/:id/denuncias` (auth, rate-limit) — denúncia de conteúdo (`motivo` ∈ spam|conteudo_inadequado|duplicado|outro). Uma por usuário por problema: denunciar de novo troca o motivo.
- `GET /problemas/:id/denuncias` (auth) — lista denúncias (moderação).

### 11.2 Anti-fake / anti-spam
- **Dedupe de coordenadas**: `criarProblema` procura problema da mesma `causa_id` e `tipo` num raio de **30 m** (`ST_DWithin` em `geography`), ignorando `removido` e `resolvido` e ordenando por `ST_Distance` para pegar o mais próximo. Achando um, devolve `{ criado: false, problema }` em vez de criar duplicata. Os 30 m são deliberados: o erro típico de GPS de celular é de 5 a 20 m, e um raio menor faria duas pessoas relatarem o mesmo buraco de lados opostos da rua como registros diferentes.
- **Rate-limit**: primitiva em `shared/ratelimit.ts` (janela fixa em memória; trocar por Redis depois). Aplicada em `POST /problemas` (5/min por usuário) e `POST /problemas/:id/denuncias` (3/min por usuário); estouro responde `429`.
- **Denúncias**: tabela `problema_denuncias` com `UNIQUE (problema_id, usuario_id)`; `contarDenuncias` usa `COUNT(DISTINCT usuario_id)`. Alimenta moderação e o futuro escalonamento.

## 12. Módulo eventos (mutirões)

Mutirões e eventos cívicos. Implementado em `common/eventos/` e exposto em `routes/eventos/`.

- `eventos` (geom `Point` opcional, `tipo` ∈ `mutirao|encontro|outro`, `status` ∈ `planejado|em_andamento|realizado|cancelado`).
- `evento_problema` (PK `evento_id, problema_id`, `resolveu`): vincula um problema a um mutirão; se `resolveu=true`, o problema vai para `status='resolvido'`.
- `evento_participantes` (PK `evento_id, usuario_id`): inscrições idempotentes (`ON CONFLICT DO NOTHING`).

### 12.1 Endpoints
- `POST /eventos` (auth) — cria evento (validação: título ≥3, bbox Brasil, `dataInicio` obrigatória).
- `GET /eventos` — lista por proximidade (`lat`,`lng`,`raio` em **metros**, comparado em `geography`) ou data; filtros `status`, `tipo`, `causaId`.
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

## 14. Módulo eventos do problema (`problema_eventos`)

Histórico **append-only** por problema, implementado em `common/problemaEventos/`
(handler + `.sql` + schemas) e exposto dentro de `routes/problemas/`. Não é um sistema
genérico de eventos: não há event bus, event sourcing, CQRS nem fila. É uma tabela de
histórico e um helper de escrita.

- `problema_eventos`: `id`, `problema_id` (FK `ON DELETE CASCADE`), `tipo`,
  `usuario_id` (FK `ON DELETE SET NULL`, **nulo** para evento sem ator conhecido),
  `dados` (jsonb, só o necessário para renderizar), `criado_em`.
- Índice `(problema_id, criado_em DESC, id DESC)` e CHECK do conjunto de tipos.
- Sem update, sem delete, sem rota pública de escrita.

### 14.1 Tipos e onde cada um é emitido

| Tipo | Emitido em | `dados` |
|---|---|---|
| `PROBLEMA_CRIADO` | `criarProblema` | `titulo` |
| `EVIDENCIA_ADICIONADA` | `enviarEvidenciaProblema` | `imagem_id`, `url` |
| `COMENTARIO_CRIADO` | `criarComentario` | `comentario_id`, `trecho` (140 chars) |
| `APOIO_CRIADO` | `apoiarProblema` (só quando a linha é nova) | — |
| `APOIO_REMOVIDO` | `desapoiarProblema` (só quando a linha existia) | — |
| `MOBILIZACAO_CRIADA` | `criarMobilizacao` | `mobilizacao_id`, `titulo` |
| `MOBILIZACAO_REALIZADA` | `atualizarStatusMobilizacao` / `registrarResultadoMobilizacao` | `mobilizacao_id`, `titulo` |
| `ENCAMINHADO` | `criarEncaminhamento` | `encaminhamento_id`, `orgao_nome`, `referencia` |
| `RESPOSTA_RECEBIDA` | `registrarResposta` | `encaminhamento_id`, `orgao_nome`, `protocolo`, `relato_do_cidadao` |
| `STATUS_ALTERADO` | `aplicarStatusProblema` | `de`, `para` |
| `RESOLVIDO` | `aplicarStatusProblema` quando o destino é `resolvido` | `de` |

`dados` nunca carrega e-mail de órgão nem qualquer dado que não vá para a tela.

### 14.2 Consistência e backfill

- Toda emissão roda dentro do `emTransacao` da operação que a originou: se a operação
  persistiu, o evento persistiu.
- A migration `20260903_008` faz o **backfill** dos eventos deriváveis do que já
  existia (`problemas`, `imagens` de `tipo_entidade='problema'`,
  `problema_comentarios`, `mobilizacoes`), para que problemas antigos não fiquem sem
  timeline. Eventos antigos de evidência ficam sem ator, porque `imagens` não guarda
  quem enviou.
- A migration `20260904_011` recria o CHECK com os 11 tipos e faz o backfill **possível**
  de `APOIO_CRIADO` a partir de `problema_apoios.criado_em`. Ela também reconcilia
  `cont_apoios`/`cont_apoios_ponderados` com as linhas de `problema_apoios`.

### 14.3 Endpoint
- `GET /problemas/:id/eventos` (público) — `pagina` e `limite` (default 20, máximo 50),
  ordenado no backend por `criado_em DESC, id DESC`. Resposta:
  `{ id, problema_id, tipo, dados, criado_em, autor: { id, nome } | null }`.

### 14.4 Limitação do backfill de apoio
`APOIO_CRIADO` só foi reconstruído para quem **ainda apoia**: apoios retirados antes da
migration `011` sumiram (`DELETE` físico, PK sem histórico, sem trigger).
`APOIO_REMOVIDO` **não é derivável de nada** e só existe a partir dela. A timeline de
problemas antigos, portanto, não tem retirada de apoio anterior ao M9.5.

## 15. Módulo imagens (upload de evidência)

`common/imagens/` continua registrando qualquer imagem por URL
(`POST /imagens`, usado pelo resultado de mobilização), e ganhou o upload real.

- `POST /imagens/upload/problema/:problemaId` (auth, `multipart/form-data`, campo
  `file`). É o mesmo caminho que o mobile já chamava desde o M6 e que não existia.
- `@fastify/multipart` é registrado dentro de `routes/imagens/`, com
  `limits: { fileSize: 5 MB, files: 1 }`.
- `validarArquivoImagem` recusa: MIME fora de `image/jpeg|image/png|image/webp` (415),
  arquivo vazio (400), acima de 5 MB (413) e arquivo cuja assinatura não bate com o
  MIME declarado (415) — um PDF renomeado para `.jpg` não passa.
- Autorização: o autor do problema, **quem já apoiou aquele problema** ou quem tem
  `problemas:moderate`; qualquer outro recebe 403 **antes** de o arquivo ir para o
  storage. A evidência acumula da comunidade, e apoiar é o gesto que dá esse direito —
  quem retira o apoio o perde. A mesma regra volta em `GET /problemas/:id` no campo
  `pode_adicionar_evidencia`, separado de `pode_encaminhar`; esconder o botão não é
  mecanismo de segurança.
- Fluxo: valida → checa problema e permissão → `enviarObjeto` no MinIO com chave
  `problema/<id>/<uuid>.<ext>` → transação com `insertImagem` + `EVIDENCIA_ADICIONADA`.
  Se a transação falha, o objeto é removido do MinIO.
- A primeira imagem do problema entra como `principal`; a `ordem` segue a contagem.

## 16. Módulo encaminhamentos (M9)

Encaminhamento institucional do problema, em `common/encaminhamentos/`, com a geração
do texto em `features/peticoes/peticoes.ts`.

- `orgaos`: `nome`, `email`, `esfera` (`municipal|estadual|federal`), `tipo`, `ativo`.
  O seed é **dado de exemplo**: nomes prefixados com `[EXEMPLO]` e e-mails em
  `exemplo.invalid`.
- `problema_encaminhamentos`: `problema_id`, `orgao_id`, `usuario_id`, `referencia`,
  `assunto`, `mensagem` (a petição gerada), `status`
  (`pendente|enviado|respondido|falhou`), `enviado_em`, `falha_motivo`, `protocolo`,
  `resposta`, `respondido_em`. Índice `(problema_id, criado_em DESC)` e índice único
  **parcial** `uq_encaminhamento_aberto (problema_id, orgao_id) WHERE status IN ('pendente','enviado')`.
- **"Aberto" é `pendente` ou `enviado`.** `respondido` e `falhou` liberam o órgão para
  um novo pedido: com a regra antiga (`status <> 'respondido'`) um envio que falhou
  travava aquele órgão para sempre. O índice parcial fecha a corrida entre duas
  requisições concorrentes — `encaminhamentoAberto` é um read-then-write sem lock — e a
  violação `23505` vira o mesmo `AppError` de 400 da checagem prévia.
- `gerarPeticao` é pura: monta a referência `MUTIRA-Pnnnnnn`, o assunto e um corpo
  com título, local, data, apoios, descrição, complemento de quem encaminhou e o link
  público. Trocar o Mailpit por SMTP real é só configuração.
- Fluxo de `criarEncaminhamento`: valida autorização → confere o órgão ativo → recusa
  segundo encaminhamento aberto para o mesmo órgão → transação (grava o
  encaminhamento, emite `ENCAMINHADO` e leva o problema para `encaminhado` emitindo
  `STATUS_ALTERADO`) → envia o e-mail → marca `enviado` ou `falhou`. A falha de envio
  não desfaz o registro: o erro é **logado** e o motivo gravado em `falha_motivo`, que
  volta no payload para a UI dizer o que houve.
- `POST .../reenviar` reenvia a petição de um encaminhamento em `pendente` ou `falhou`.
  É retomada **disparada por pessoa**: não há fila, worker, scheduler nem retry
  automático. Resolve tanto o envio que falhou quanto o `pendente` eterno de um processo
  que morreu entre o COMMIT e o `marcarEnvio`.
- `registrarResposta` grava resposta e protocolo, muda o status para `respondido` e
  emite `RESPOSTA_RECEBIDA`. **Recusa com 400 enquanto `enviado_em` for nulo**: não se
  registra resposta de um e-mail que nunca saiu.
- A listagem não expõe o e-mail do órgão e devolve `pode_registrar_resposta` e
  `pode_reenviar` calculados no servidor.

### 16.1 Endpoints
- `GET /orgaos` (auth) — órgãos ativos (`id`, `nome`, `esfera`, `tipo`).
- `GET /problemas/:id/encaminhamentos` (auth) — encaminhamentos do problema.
- `POST /problemas/:id/encaminhamentos` (auth, 3/min) — body `{ orgaoId, mensagem? }`.
- `POST /problemas/:id/encaminhamentos/:encaminhamentoId/reenviar` (auth, 3/min) — sem
  body; só para `pendente` e `falhou`.
- `POST /problemas/:id/encaminhamentos/:encaminhamentoId/resposta` (auth) — body
  `{ resposta, protocolo? }`; só depois de `enviado_em`.

### 16.2 Autorização
Não há sistema de papéis novo: tudo usa `common/abilities.ts`.

| Ação | Quem pode |
|---|---|
| Encaminhar problema | autor do problema ou `problemas:moderate`, com o problema fora de `removido` e ao menos um órgão ativo sem encaminhamento aberto |
| Registrar resposta | quem criou o encaminhamento ou `problemas:moderate`, e só depois de `enviado_em` |
| Reenviar encaminhamento | quem criou o encaminhamento ou `problemas:moderate`, em `pendente` ou `falhou` |
| Adicionar evidência | autor do problema, quem apoiou o problema, ou `problemas:moderate` |
| Alterar status | autor do problema ou `problemas:moderate` |
| Marcar como `removido` | apenas `problemas:moderate` |

### 16.2.1 A resposta do órgão é relato do cidadão

O órgão não tem conta, token, callback nem verificação de inbound. Quem escreve "o órgão
respondeu" é o próprio autor do encaminhamento, em texto livre, e `protocolo` não é
validado contra nada. O autorrelato é aceito, mas a plataforma **não** o apresenta como
fato institucional: `Encaminhamento.resposta_verificada` é sempre `false`, o evento
`RESPOSTA_RECEBIDA` carrega `relato_do_cidadao: true`, e a UI rotula a resposta pelo nome
de quem a relatou. Verificação real (inbound e-mail, magic link, conta de órgão) segue
fora de escopo.

### 16.3 Transições de status do problema

```text
ativo       → em_analise | encaminhado | resolvido | removido
em_analise  → encaminhado | resolvido | removido
encaminhado → em_analise | resolvido | removido
resolvido   → removido
removido    → (nenhuma)
```

`GET /problemas/:id` com token devolve `transicoes_permitidas` já filtrado pela
autorização de quem pediu, de modo que o app só ofereça o que a API aceita.

## 17. Testes: duas suítes, dois comandos

O CI (`.github/workflows/ci.yml`) **não sobe serviço nenhum** — sem Postgres, sem
PostGIS, sem MinIO, sem Mailpit. Por isso as suítes são separadas por glob e por script.

| Comando | Glob | Precisa de serviço? |
|---|---|---|
| `npm run test` | `src/**/*.spec.ts` | **Não.** `dbPool` é mockado inteiro; storage e e-mail também. |
| `npm run test:integration` | `src/**/*.itest.ts` | **Sim**: Postgres com PostGIS no ar. |

- `npm run test` é o que o CI roda e precisa continuar verde sem nada no ar. Nunca
  adicione um teste que fale com banco como `.spec.ts`: o glob é único e derruba o CI
  inteiro.
- `npm run test:integration` usa `vitest.integration.config.ts`: recria o banco
  `econexa_itest` (ou `DATABASE_URL_ITEST`), roda as migrations no `globalSetup` e
  executa os arquivos em série (`fileParallelism: false`, banco compartilhado).
- Só o **Postgres** é real na integração. Storage (MinIO) e e-mail (SMTP) continuam
  mockados: o que está sob teste ali é o comportamento do banco — unidade real de
  distância, atomicidade do apoio, unicidade da denúncia, índice parcial do
  encaminhamento e as migrations sobre dado sujo.
- Testes espaciais **têm** de ser de integração. Um spec que só afirma
  `expect(sql).toContain('ST_DWithin')` passa com raio 15, 15000 ou 0,0000001 — é
  estruturalmente incapaz de detectar erro de unidade. Só um teste que insere dois
  pontos a distância conhecida e confere metros prova a correção.
- O workflow do CI **não foi alterado**: subir Postgres lá é decisão separada.
