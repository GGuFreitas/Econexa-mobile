# Etapas implementadas

Roadmap consolidado do Mutira, de M1 a M12. Cada entrada registra o que entrou,
o que ficou de fora e as dívidas assumidas. Commits granulares por PR.

## PR-M1 — Fundação (já no master)

Estrutura base Expo + React Navigation + Redux + React Query + Paper.
Telas de auth (Login/Registro) funcionando contra o backend.

## PR-0 — Migração Expo 48 → 57 + Node 24 LTS

- `app.json` sdkVersion 57.0.0; `package.json` curado (expo ~57, react 19.2,
  RN 0.86, RTK 2, react-redux 9, react-query 5, Paper 5.12, reanimated 4.5,
  remoção de `moti`, `react-native-picker-select`, `react-native-vector-icons`).
- `metro.config.js` com aliases `@features/@shared/@store/@navigation/@services`.
- `tsconfig.json` → `moduleResolution: bundler`.
- Contrato `role` alinhado ao backend (`citizen|specialist|organization`).
- `useRegister` em forma objeto (react-query v5). `src/app.tsx` → `src/App.tsx`.
- `expo-doctor` 21/21.

## PR-M2 — Design System Mutira

- `shared/theme/` (colors, spacing, typography, theme light/dark + `getAppTheme`).
- `shared/hooks/useAppTheme`.
- `shared/ui/` theme-aware: Button, TextInput, Select, Chip, Card, BottomSheet,
  FAB, Avatar, Badge, Modal, LoadingSpinner, EmptyState, ErrorState, Header,
  ScreenWrapper.
- `features/problemas/map/markerConfig.ts` (causas 1-8) + `mapTheme.ts`.
- `App.tsx` usa tema dinâmico a partir do `themeSlice`.
- Teste `markerConfig.spec.ts`.

## PR-M3 — Mapa Vivo

- `features/problemas/types.ts` (contrato Problema).
- `api/` listar, buscar, estatisticas; `hooks/` useProblemas, useEstatisticas,
  useProblema; `shared/hooks/useLocalizacao` (expo-location, fallback SP).
- `map/ProblemMap`, `ProblemMarker`, `ProblemCluster`, `MapBottomSheet`,
  `MapFilters`, `MapLegend`, `PertoDeVoce`.
- `utils/clusterUtils` (clustering por grade, sem lib externa).
- `HomeScreen` renderiza o Mapa Vivo.
- Deps: react-native-maps + expo-location. `expo-doctor` 21/21; typecheck/lint/test verdes.

## PR-M4 — Criar problema + Mobilização

- `types.ts`: `CriarProblemaPayload` (camelCase p/ backend), `ApoioResultado`,
  `DenunciaMotivo`.
- `api/`: `criar` (POST /problemas), `apoios` (POST/DELETE /problemas/:id/apoios),
  `denuncias` (POST /problemas/:id/denuncias) + testes.
- `hooks/`: `useCriarProblema`, `useApoio` (update otimista do contador), `useDenuncia`.
- `components/ProblemForm` (react-hook-form + zod, foto via picker/manipulator).
- `screens/`: `CriarProblemaScreen`, `DetalheProblemaScreen` (apoiar + denunciar).
- Mapa: bottom sheet apoia via `useApoio`; `Header` com botão de voltar.
- Nota: backend não aceita imagem no create (sem endpoint) — foto fica na UI, envio
  depende de backend.

## PR-M5 — Feed / Perfil / Impacto + Tabs

- Navegação em abas: `Mapa` (ProblemMap), `Feed`, `Perfil` (react-navigation/bottom-tabs).
- RootStack: `Main` (tabs) + `CriarProblema` + `DetalheProblema` full-screen.
- `screens/FeedScreen` (lista + filtros por causa) com `components/ProblemCard`.
- `screens/PerfilScreen` (dados do usuário + impacto via estatísticas locais).
- `LoginScreen` navega para `Main`.

## PR-M6 — Upload de imagens (#8)

- `services/api.ts`: helper `uploadFile` (multipart + `onUploadProgress`).
- `api/imagens.ts` (`uploadImagemProblema`) + `CriarProblemaPayload.imagens`.
- `components/ProblemForm`: foto via expo-image-picker/manipulator com barra de progresso.
- `screens/CriarProblemaScreen`: fluxo two-step (cria o problema e depois associa a imagem).
- `eslint.config.mjs`: global `FormData` para o multipart.
- **Dívida assumida na entrega:** o backend expõe `POST /imagens` com JSON (`url`),
  não um endpoint multipart; o mobile chamava `/imagens/upload/problema/:id`, que
  **não existia**. O upload aparecia pronto na UI e nunca funcionou: `ProblemForm`
  chamava o upload com `problemaId = 0` e `CriarProblemaScreen` apenas dava
  `console.log` na URL da imagem. **Dívida quitada no M8.6.**

## PR-M7 — Mobilizações (#9)

- Backend: módulo `common/mobilizacoes/` (types, schemas, sql, handler), rotas
  `routes/mobilizacoes/` e migration `20260827_006_create_mobilizacoes`
  (`mobilizacoes` + `mobilizacao_participantes`).
- Endpoints: `POST/GET /mobilizacoes`, `GET /mobilizacoes/:id`,
  `PATCH /mobilizacoes/:id`, `PATCH /mobilizacoes/:id/status`,
  `POST /mobilizacoes/:id/resultado`, `POST/DELETE /mobilizacoes/:id/participar`.
- Mobile: feature `features/mobilizations/` completa (types, api, hooks, components,
  screens `MobilizacoesListScreen`/`MobilizacaoDetailScreen`/`CriarMobilizacaoScreen`).
- `shared/ui/Tabs` + integração no `DetalheProblemaScreen`; rotas novas no `AppNavigator`.

## PR-M8 — Comentários + Timeline

- Backend: módulo `common/comentarios/` (types, schemas, sql, handler) e migration
  `20260903_007_create_problema_comentarios` (`problema_comentarios`).
- Endpoints novos: `GET /problemas/:id/comentarios` (público, auth opcional),
  `POST /problemas/:id/comentarios` (auth, 10/min) e
  `DELETE /problemas/:id/comentarios/:comentarioId` (auth, só o autor → 403).
- `shared/auth.ts`: `optionalAuth` (usuário opcional em rota pública) para calcular
  `pode_excluir` no servidor; `shared/ratelimit.ts`: `comentarioLimiter`.
- Mobile: feature `features/comentarios/` (types, `api/` listar/criar/excluir,
  `hooks/` useComentarios/useCriarComentario/useExcluirComentario,
  `components/` ComentariosList/ComentarioItem/ComentarioForm com confirmação de exclusão).
- Mobile: `shared/utils/dataRelativa` (`formatarDataRelativa`, "há 2 horas").
- Mobile: timeline client-side em `features/problemas/` — `utils/timeline.ts`
  (`montarTimeline`, pura), `hooks/useTimeline` (compõe problema + imagens +
  comentários + mobilizações), `components/Timeline` e `components/AtividadeProblema`.
- `DetalheProblemaScreen`: nova aba **Atividade** (Timeline + Comentários).
- Correção: as abas do `DetalheProblemaScreen` comparavam `'detalhe'`/`'mobilizacoes'`
  contra o `label` emitido pelo `Tabs` (`'Detalhe'`/`'Mobilizações'`); a aba de
  mobilizações nunca renderizava. Passou a usar as constantes de label.
- Lacuna assumida: **não existe** tabela/endpoint de eventos ou atividade no backend, e
  `POST/DELETE /problemas/:id/apoios` não expõem quem apoiou nem quando. Portanto
  "fulano apoiou o problema" **ficou fora** da timeline. Nada de sistema genérico de
  eventos foi criado neste PR. **Resolvido no M8.5** (menos o apoio, que continua sem
  evento porque o backend não guarda o instante do apoio).
- Lacuna assumida: `users` não tem coluna de avatar, então o comentário mostra apenas
  nome do autor + data relativa.

## PR-M8.5 — Eventos do problema e timeline real

- Backend: migration `20260903_008_create_problema_eventos` cria `problema_eventos`
  (`id`, `problema_id`, `tipo`, `usuario_id` nulo, `dados` jsonb, `criado_em`) com
  índice `(problema_id, criado_em DESC, id DESC)`, FK `ON DELETE CASCADE` para
  `problemas`, `ON DELETE SET NULL` para `users` e CHECK do conjunto de tipos.
  Histórico **append-only**: sem update, sem delete, sem escrita pelo mobile.
- **Backfill na própria migration**: `PROBLEMA_CRIADO` a partir de `problemas`,
  `EVIDENCIA_ADICIONADA` das `imagens` de `tipo_entidade = 'problema'`,
  `COMENTARIO_CRIADO` de `problema_comentarios`, `MOBILIZACAO_CRIADA` e
  `MOBILIZACAO_REALIZADA` de `mobilizacoes`. Problemas antigos não ficam com
  timeline vazia. Eventos antigos de evidência ficam sem ator (`usuario_id` nulo),
  porque a tabela `imagens` não guarda quem enviou.
- Backend: módulo `common/problemaEventos/` (types, sql, handler, schemas) e
  `shared/transacao.ts` (`emTransacao`, um client do pool com BEGIN/COMMIT/ROLLBACK).
  Não há event bus, CQRS nem fila: é uma tabela histórica e um helper de escrita.
- Consistência transacional: o evento é gravado no mesmo `BEGIN` da operação que o
  originou (criar problema, criar comentário, criar mobilização, concluir mobilização,
  subir evidência, encaminhar, registrar resposta e alterar status).
- Endpoint novo: `GET /problemas/:id/eventos` (público, `pagina`/`limite` até 50,
  ordenado pelo backend do mais recente para o mais antigo). **Não existe** endpoint
  público de escrita de evento.
- Mobile: `api/listarEventos.ts`, `utils/eventos.ts` (`apresentarEvento`, pura),
  `hooks/useTimeline` reescrito sobre `useQuery(['eventos', problemaId])` e
  `components/EventoItem` (representação discriminada por tipo, sem regra no JSX).
- Mobile: removidos `utils/timeline.ts` e o `useTimeline` que compunha quatro
  queries. `useImagensProblema` continua, agora servindo a galeria de evidências.
- Invalidação de `['eventos', problemaId]` em criar comentário, criar mobilização,
  concluir mobilização, subir evidência, encaminhar, registrar resposta e alterar
  status. Sem polling, sem websocket, sem tempo real.
- Evento que o backend não emite não aparece no app: nada de deduzir apoio por
  variação de contador.

## PR-M8.6 — Contrato real de imagens (upload via MinIO)

- `docker-compose.yml`: serviços `minio` (volume `minio_data`, credenciais por
  variável de ambiente, healthcheck) e `minio-bucket` (cria o bucket e libera
  leitura anônima na subida).
- Backend: `@fastify/multipart` + cliente `minio`; `shared/storage.ts`
  (`enviarObjeto`, `removerObjeto`, `urlPublica`).
- Endpoint novo: `POST /imagens/upload/problema/:problemaId` (auth, multipart,
  campo `file`) — **exatamente o caminho que o mobile já chamava desde o M6**, agora
  existente dos dois lados.
- Validação no servidor: MIME em `image/jpeg|image/png|image/webp`, limite de 5 MB
  (no `@fastify/multipart` e na checagem de truncamento) e conferência da assinatura
  do arquivo. PDF renomeado para `.jpg` é recusado com 415.
- Autorização real: só o autor do problema ou quem tem `problemas:moderate` sobe
  evidência; qualquer outro recebe 403 antes de o arquivo tocar o storage.
- A imagem é registrada reaproveitando o módulo `imagens` e emite
  `EVIDENCIA_ADICIONADA` na mesma transação; se a persistência falha, o objeto é
  removido do MinIO.
- Mobile: `api/imagens.ts` passa a devolver o registro da imagem,
  `uploadFile` virou genérico, `ProblemForm` deixa de fazer upload (entrega o arquivo
  escolhido para a tela) e `CriarProblemaScreen` cria o problema e então sobe a
  evidência, com progresso e aviso quando o upload falha.
- Mobile: `components/EvidenciasProblema` mostra a galeria e permite adicionar
  evidência a quem o servidor autoriza.
- Fecha a dívida registrada no M6.

## PR-M9 — Encaminhamento institucional

- Backend: migration `20260903_009_create_encaminhamentos` cria `orgaos`
  (`nome`, `email`, `esfera`, `tipo`, `ativo`) e `problema_encaminhamentos`
  (`problema_id`, `orgao_id`, `usuario_id`, `referencia`, `assunto`, `mensagem`,
  `status`, `enviado_em`, `protocolo`, `resposta`, `respondido_em`).
- Seed de órgãos **marcado como exemplo**: todos os nomes começam com `[EXEMPLO]` e
  os e-mails usam o domínio reservado `exemplo.invalid`, que não resolve.
- `features/peticoes/peticoes.ts`: `gerarPeticao` (pura) monta referência
  (`MUTIRA-Pnnnnnn`), assunto e corpo com os dados do problema e o link público.
  A pasta `features/peticoes/` deixou de ser um `.gitkeep` vazio.
- Backend: módulo `common/encaminhamentos/` (types, schemas, sql, handler).
- Endpoints novos: `GET /orgaos` (auth), `GET/POST /problemas/:id/encaminhamentos`
  (auth, POST com rate-limit de 3/min) e
  `POST /problemas/:id/encaminhamentos/:encaminhamentoId/resposta` (auth).
- Status do problema: `PATCH /problemas/:id/status` com o fluxo
  `ativo → em_analise → encaminhado → resolvido` (+ `removido`), emitindo
  `STATUS_ALTERADO` e, no destino final, `RESOLVIDO`. **Quem pode alterar:** o autor
  do problema ou quem tem `problemas:moderate`; `removido` é exclusivo da moderação.
  Criar encaminhamento leva o problema para `encaminhado` pelo mesmo caminho.
- `GET /problemas/:id` passou a usar `optionalAuth` e devolve `pode_encaminhar` e
  `transicoes_permitidas` calculados no servidor — o app só oferece o que a API
  autoriza.
- **Nenhum e-mail real sai:** `docker-compose.yml` ganhou o **Mailpit**, o transporte
  aponta para ele por variável de ambiente e `shared/email.ts` desvia **toda**
  mensagem para `SMTP_DEV_INBOX` a menos que `NODE_ENV=production` **e**
  `SMTP_ALLOW_EXTERNAL=true`. O corpo desviado carrega o destinatário original.
  Nos testes não há envio de rede.
- Mobile: feature `features/encaminhamentos/` (types, api, hooks, components) com
  `EncaminharProblemaModal` (seleção de órgão + confirmação antes de enviar),
  `EncaminhamentosList`, `EncaminhamentoCard` e `RegistrarRespostaModal`.
- Mobile: `DetalheProblemaScreen` ganhou "Encaminhar problema", "Alterar status",
  a galeria de evidências e a lista de encaminhamentos, todos com loading, vazio,
  erro, ação em andamento e confirmação antes de ação irreversível. O badge fixo
  `0` da aba de mobilizações saiu: `0` não é fallback de dado não carregado.

### Correções de bugs pré-existentes encontrados durante o M8.5/M8.6/M9

- `rateLimitGuard` (`routes/problemas/index.ts`) era uma função **síncrona** de
  aridade 1 usada como `preHandler`: o Fastify esperava o `next` que nunca era
  chamado, então **toda rota com rate-limit ficava pendurada sem responder** —
  `POST /problemas`, `POST /problemas/:id/denuncias` e o `POST` de comentários do M8.
  Agora é assíncrona.
- `knexfile.ts` apontava as migrations para `./src/config/migrations` e carregava o
  `.env` do diretório corrente, mas o knex CLI muda o diretório para a pasta do
  knexfile: `npm run migrate` falhava com `ENOENT` e, depois, sem senha. Passou a
  resolver os dois caminhos a partir do próprio arquivo.
- `pino-pretty` era usado como transport em `app.ts` sem estar declarado: o servidor
  não subia em uma instalação limpa. Entrou como devDependency.

## PR-M9.5 — Auditoria e correções

Milestone sem funcionalidade nova: fecha dívidas do M5 ao M9 que faziam a plataforma
mentir para o cidadão. Nada de M10/M11/M12 entrou aqui.

### Contrato espacial: metro virou metro

- A coluna é `geometry(Point, 4326)`, cuja unidade é **grau**. Os três sítios que
  comparavam distância passaram a comparar em `geography`, onde o argumento é metro:
  `findNearbyProblema` e `listarProblemas` (`common/problemas/problemas.sql.ts`) e
  `listarEventos` (`common/eventos/eventos.sql.ts`). O `ST_Distance` que alimenta o
  alias `distancia_m` também virou `geography` — antes devolvia **grau com nome de
  metro** e o número vazava pela API até o `distancia_m` do mobile.
- Efeito prático: o raio `15` do dedupe valia ~1.665 km (qualquer problema da mesma
  causa no Brasil era duplicata) e o `5000` default da listagem e dos eventos era um
  filtro **no-op**.
- Migration `20260904_010_indices_geografia`: cria `idx_problemas_geom_geog` e
  `idx_eventos_geom_geog` como índices de expressão sobre `(geom::geography)`.
- **Decisão sobre os índices antigos:** `idx_problemas_geom` e `idx_eventos_geom`
  foram **removidos**. Com o cast, nenhum predicado espacial usa mais a coluna crua, e
  as outras consultas que tocam `geom` usam `ST_X`/`ST_Y`, acessores escalares que
  **nunca** usam índice GIST. Mantê-los custaria escrita e disco sem nenhum ganho de
  leitura. O `down` da migration recria os dois. `idx_mobilizacoes_geom` ficou como
  estava: `mobilizacoes` não tem consulta por raio.

### Dedupe de problema: comportamento, não só raio

- `criarProblema` devolvia o problema de outra pessoa com **HTTP 201** e nenhum sinal:
  o cidadão achava que tinha reportado o dele, nenhum evento era emitido, `cont_apoios`
  não subia e ele não ficava ligado ao registro. Agora o handler devolve
  `{ criado, problema }` e a rota responde **201 quando criou** e **200 quando
  encontrou um parecido**.
- A consulta passou a filtrar `status NOT IN ('removido', 'resolvido')` — antes um
  problema removido ou resolvido bloqueava novos registros da mesma causa para sempre —
  e a ordenar por `ST_Distance` real com `LIMIT 1` (antes era `LIMIT 1` sem `ORDER BY`,
  ou seja, linha arbitrária).
- **Raio do dedupe: 15 m → 30 m.** Decisão de produto tomada aqui: 15 m é menor que o
  erro típico de GPS de celular (5-20 m), então duas pessoas relatando o mesmo buraco
  de lados opostos da rua criariam registros distintos. 30 m cobre o erro sem juntar
  problemas de quadras diferentes. `back-end.md` foi atualizado.
- Mobile: `CriarProblemaScreen` não finge mais publicação. Quando o servidor devolve
  `criado: false`, o app explica que já existe um registro no mesmo ponto e navega para
  o detalhe dele, convidando a apoiar — que é também o que libera adicionar a foto.

### Apoio: atomicidade e eventos

- **A unicidade já estava correta e não foi tocada:** PK composta
  `(problema_id, usuario_id)` + `ON CONFLICT DO NOTHING` já tornam apoio duplicado
  impossível sob qualquer concorrência.
- O problema era atomicidade: `apoiarProblema` fazia até 6 queries soltas **sem
  transação**. Uma falha entre o `INSERT` e o `UPDATE` era irrecuperável — a
  retentativa caía no `ON CONFLICT`, `inseriu` voltava `false` e o contador nunca mais
  subia. Os `GREATEST(..., 0)` do decremento eram a cicatriz disso.
- Apoiar e desapoiar viraram **um statement cada**, no idioma `WITH ... AS (INSERT/DELETE)`
  que o projeto já usa em `marcarEnvio`. `jaApoiou()` foi **removida**: era
  *check-then-act* que não protegia nada. Os `GREATEST` saíram: o `DELETE` é que
  autoriza o decremento, então o contador não tem como ficar negativo.
- `APOIO_CRIADO` e `APOIO_REMOVIDO` entraram em `problema_eventos`, emitidos dentro do
  `emTransacao` como todos os outros domínios. O CHECK `chk_problema_eventos_tipo`
  (migration `008`) travava os 9 tipos antigos e foi recriado com 11 na migration
  `20260904_011_eventos_de_apoio`.
- A mesma migration **reconcilia os contadores**: `cont_apoios` e
  `cont_apoios_ponderados` são recalculados a partir de `problema_apoios` onde estiverem
  divergentes, limpando o estrago que o bug de atomicidade já tenha causado.
- **Limitação de backfill, assumida:** `APOIO_CRIADO` foi reconstruído de
  `problema_apoios.criado_em`, então só aparece quem **ainda apoia**. Quem apoiou e
  retirou o apoio antes desta migration **sumiu**: a remoção é `DELETE` físico, a PK não
  guarda histórico e não havia trigger. `APOIO_REMOVIDO` **não é derivável de nada** e
  só existe daqui para frente. A timeline de problemas antigos, portanto, mostra apoios
  vivos sem a data real de quem já saiu, e nenhum evento de retirada anterior a este PR.

### Denúncia: uma por usuário por problema

- `problema_denuncias` só tinha `id` serial — **nenhum unique**. O mesmo usuário
  denunciava o mesmo problema infinitas vezes; o único freio era o `denunciaLimiter`,
  em memória por processo.
- Regra adotada: **uma denúncia por usuário por problema**, `UNIQUE (problema_id, usuario_id)`.
- Migration `20260904_012_denuncia_unica_por_usuario` **deduplica antes** de criar a
  constraint (a ordem importa: com dado sujo a criação falharia), preservando a
  denúncia **mais antiga** de cada par por `criado_em ASC NULLS LAST, id ASC`.
- `inserirDenuncia` virou `ON CONFLICT (problema_id, usuario_id) DO UPDATE SET motivo = EXCLUDED.motivo`:
  denunciar de novo troca o motivo, não cria linha. `contarDenuncias` passou a
  `COUNT(DISTINCT usuario_id)`, correto sob a garantia nova e correto também sobre dado
  legado ainda não migrado.

### Evidência: quem apoiou também acumula

- `DetalheProblemaScreen` usava `pode_encaminhar` para decidir se mostrava o botão de
  adicionar evidência — um booleano servindo a três conceitos diferentes.
- Regra adotada: **autor, quem já apoiou ou a moderação**. Isso alinha com a visão do
  produto (evidência acumula da comunidade).
- O servidor calcula e expõe `pode_adicionar_evidencia` como campo próprio em
  `GET /problemas/:id`, separado de `pode_encaminhar`, e **a autorização real está no
  caminho do upload** (`common/imagens/imagens.handler.ts`): esconder botão não é
  segurança, quem não tem relação com o problema recebe 403 antes de o arquivo tocar o
  storage.

### Resposta do órgão: relato do cidadão, não fato institucional

- O órgão não tem conta, token, callback nem verificação de inbound. Quem digita "o
  órgão respondeu" é o próprio autor do encaminhamento, em texto livre, e `protocolo`
  não é validado contra nada. O autorrelato foi **mantido**, mas a plataforma parou de
  afirmá-lo como fato.
- `Encaminhamento` ganhou `resposta_verificada` (hoje sempre `false`); o evento
  `RESPOSTA_RECEBIDA` carrega `relato_do_cidadao: true`; o título na timeline virou
  "Resposta relatada pelo cidadão" e tanto o `EncaminhamentoCard` quanto o
  `RegistrarRespostaModal` avisam que o Mutira não confirma a resposta junto ao órgão.
- **Trava no servidor:** `pode_registrar_resposta` só excluía `status === 'respondido'`
  e não olhava `enviado_em`, então dava para registrar resposta de um e-mail em
  `pendente` ou `falhou`. Agora `registrarResposta` recusa com 400 enquanto
  `enviado_em` for nulo, e o campo do payload reflete isso.

### Incoerências do M9

- **`pode_encaminhar` parou de mentir.** Era calculado só como dono-ou-moderação e não
  refletia as travas que o `POST /:id/encaminhamentos` aplica de fato: problema
  `removido` → 400 e encaminhamento já aberto para aquele órgão → 400. Agora exige
  também `status <> 'removido'` e a existência de pelo menos um órgão ativo sem
  encaminhamento aberto (`existeOrgaoDisponivel`). A UI só oferece o que a API aceita.
- **Encaminhar não faz mais o problema sumir.** `GET /problemas` tinha `status` com
  default `'ativo'`, então mudar para `encaminhado` tirava o problema da listagem. O
  default saiu: sem `status` explícito a listagem esconde apenas `removido` e mostra
  `ativo`, `em_analise`, `encaminhado` e `resolvido`. Quem quiser só os ativos passa
  `status=ativo`.
- **O cache de 30s passou a ser invalidado.** `cache.delete` existia em
  `shared/cache.ts` e não era chamado em fluxo nenhum. A interface `Cache` ganhou
  `deletePorPrefixo` (implementável em Redis com `SCAN`) e
  `invalidarCacheDeProblemas()` roda depois do commit em criar problema, alterar status,
  encaminhar, apoiar, desapoiar e vincular problema a evento.
- **`catch {}` vazio morreu.** A exceção do SMTP era engolida sem log e sem motivo
  persistido. Agora o erro é logado e gravado na coluna nova
  `problema_encaminhamentos.falha_motivo` (migration `20260904_013`), que volta no
  payload — a UI mostra por que falhou em vez de só "Falha no envio".
- **`falhou` deixou de ser estado morto.** `encaminhamentoAberto` usava
  `status <> 'respondido'`, então um envio que falhou travava novos envios àquele órgão
  **para sempre**; o mesmo valia para um `pendente` eterno (processo morto entre o
  COMMIT e o `marcarEnvio`). Duas mudanças, sem fila, worker, scheduler ou retry
  automático: "aberto" passou a ser `status IN ('pendente', 'enviado')`, então um
  `falhou` não bloqueia mais nada; e entrou
  `POST /problemas/:id/encaminhamentos/:encaminhamentoId/reenviar`, um reenvio
  **disparado por pessoa** para os estados `pendente` e `falhou`, com botão próprio no
  `EncaminhamentoCard` e o campo `pode_reenviar` no payload.
- **`MOBILIZACAO_REALIZADA` fora da transação: falso positivo da auditoria.** Nos dois
  pontos de emissão (`atualizarStatusMobilizacao` e `registrarResultadoMobilizacao`) o
  `registrarEvento` já recebia o `executor` dentro do `emTransacao`. O que **estava**
  fora da transação em `registrarResultadoMobilizacao` eram os `saveImagem` das imagens
  do resultado, gravados depois do COMMIT: se falhassem, a mobilização ficava concluída
  sem as fotos. Foram trazidos para dentro (`saveImagem` passou a aceitar `executor`).
- **Unique parcial em `encaminhamentoAberto` — decisão: sim, criado.**
  `encaminhamentoAberto` é um *read-then-write* fora de transação, sem lock: duas
  requisições concorrentes criavam encaminhamentos duplicados para o mesmo órgão. A
  migration `013` cria
  `CREATE UNIQUE INDEX uq_encaminhamento_aberto ON problema_encaminhamentos (problema_id, orgao_id) WHERE status IN ('pendente', 'enviado')`.
  O índice parcial é o que casa com a regra: `respondido` e `falhou` ficam de fora, então
  liberam o órgão naturalmente. A migration **encerra como `falhou` os duplicados
  abertos que já existiam**, com o motivo gravado em `falha_motivo`, antes de criar o
  índice. A checagem prévia continua no handler pela mensagem de erro amigável, e a
  violação `23505` é convertida no mesmo `AppError` de 400 para fechar a corrida.

### `helperText` do `TextInput` era engolido

- `mobile/src/shared/ui/TextInput.tsx` declarava `helperText?: string` na assinatura e
  fazia `{...props}` no `PaperInput`: como não é prop do Paper, a mensagem **nunca era
  renderizada**. Todo erro de validação era invisível.
- Agora o componente renderiza o `HelperText` do Paper com `type` ligado ao `error` do
  campo. Isso corrige de uma vez **10 usos** em 4 formulários — mais do que os 5
  apontados na auditoria: `ProblemForm` (3), `RegistrarRespostaModal` (2),
  `CriarMobilizacaoForm` (4) e `ResultadoForm` (1).
- A decisão de mostrar (e com qual tipo) saiu para `shared/ui/helperText.ts`, função
  pura, porque a stack de teste do mobile não renderiza árvore React Native.

### Testes

- **`npm run test` continua verde sem nenhum serviço no ar.** Os specs seguem mockando
  `dbPool` inteiro e o glob continua `src/**/*.spec.ts`. Nada de integração entrou nele.
- Os testes espaciais **precisavam** ser de integração: os specs atuais só afirmavam
  `expect(...).toContain('ST_DWithin')`, o que passa com raio 15, 15000 ou 0,0000001 e é
  estruturalmente incapaz de detectar o defeito de unidade.
- Entrou uma suíte separada: glob `src/**/*.itest.ts`, `vitest.integration.config.ts`
  próprio e `npm run test:integration`. **Não** é incluída no `npm run test` e o
  workflow do CI **não foi tocado** (fora de escopo).
- A suíte de integração recria o banco `econexa_itest` do zero, roda as migrations e
  testa contra PostGIS real: distância em metros nos três sítios, dedupe a ~20 m
  (deduplica) e a ~2 km (cria novo), problema `removido`/`resolvido` não bloqueando
  registro novo, apoio concorrente resultando em uma linha e contador 1, `cont_apoios`
  batendo com `COUNT(*)`, denúncia repetida com motivo diferente virando uma linha com
  motivo atualizado, migration de dedupe rodando sobre dados sujos semeados de
  propósito, upload permitido a quem apoiou e 403 a quem não tem relação, e resposta
  bloqueada em encaminhamento não enviado.
- Storage e SMTP são mockados **também** na integração: o que está sob teste ali é o
  Postgres. MinIO e Mailpit continuam cobertos pelos specs de unidade.
- No mobile a stack não mudou: vitest + `renderHook` do `@testing-library/react` +
  funções puras. **Jest não entrou.**

## PR-A — Segurança e modelo de papéis

Milestone sem funcionalidade nova. Fecha buracos de autorização que deixavam qualquer
pessoa autenticada agir sobre conteúdo alheio, e arruma o modelo de papéis para que ele
signifique alguma coisa. Nada de M10/M11/M12 entrou aqui.

### Escalada de privilégio no cadastro

- `registerSchema` aceitava `role: z.enum(['citizen','specialist','organization']).optional()`
  e `registerUser` repassava o valor direto para o `INSERT`. **Qualquer pessoa se
  cadastrava como `specialist` e, com isso, ganhava `problemas:moderate`** — poder de
  mudar status e remover problema dos outros. Era escalada de privilégio por payload,
  sem nenhuma verificação.
- `role` **saiu do corpo do cadastro**. Todo registro cria `citizen`; um `role` enviado
  no JSON é ignorado pelo zod, não recusado — o cliente não precisa saber que existia.
- **`organization` saiu do enum de papéis.** Era decorativo: a única habilidade que só
  ele tinha, `mutiroes:manage`, nunca foi consultada em linha de código nenhuma. O papel
  e seu fluxo ficam fora de escopo até existir produto para eles.
- Mobile: `RegisterInput` perdeu `role`, e `User['role']`, `ApiUser['role']` e o
  `ROLE_LABEL` do `PerfilScreen` passaram a `citizen|specialist|admin`.

### Especialista deixou de ser moderador

- `common/abilities.ts` dava `problemas:moderate` ao `specialist`, conflando competência
  técnica ("entende de saneamento") com poder sobre conteúdo alheio. **A habilidade
  agora é exclusiva do `admin`**, e com isso `podeGerenciarProblema` virou de fato
  "autor ou admin" — a trava de `removido` idem.
- **Nove das dez habilidades declaradas eram órfãs** (`problemas:create`, `peticoes:create`,
  `peticoes:moderate`, `apoios:give`, `mutiroes:create`, `mutiroes:manage`,
  `eventos:create`, `usuarios:read`, `usuarios:manage`): nenhum `can(...)` no projeto
  perguntava por elas. Foram removidas. `Ability` hoje é um tipo de um valor só,
  `problemas:moderate`, e a matriz diz a verdade sobre o que existe. Nenhum uso novo foi
  inventado para as que saíram.
- Entrou `ehAdmin(role)` para as checagens que são de **papel**, não de habilidade:
  gestão de mobilização e leitura da lista de denunciantes.
- **`admin` era inalcançável por qualquer caminho de código** — nenhuma rota, flag ou
  variável de ambiente promovia alguém. Entrou um bootstrap **explicitamente manual**:
  `npm run admin:promover -- <email>` (`src/scripts/promoverAdmin.ts`), com o SQL
  equivalente documentado em `back-end.md` §5.1. É operação administrativa, feita com
  acesso ao banco, deliberadamente fora do alcance da API.
- **Consequência aceita:** num banco novo não existe `admin`, então ninguém remove
  problema alheio até que alguém seja promovido à mão. É estritamente mais seguro que o
  estado anterior e não regride tela nenhuma — não existe UI de moderação no mobile.

### Domínio `eventos` removido inteiro

`common/eventos/`, `routes/eventos/`, o registro em `routes/index.ts`, os testes do
domínio e as tabelas `eventos`, `evento_problema` e `evento_participantes` (migration
`20260904_014_remove_eventos`, com `down` que recria as três).

- O motivo forte: **`vincularProblema` fazia `UPDATE problemas SET status = 'resolvido'`
  sem nenhuma checagem de dono**. Pulava `podeGerenciarProblema`, pulava
  `TRANSICOES_STATUS` e não emitia `STATUS_ALTERADO` nem `RESOLVIDO`. Qualquer pessoa
  autenticada resolvia problema alheio, e a timeline não registrava. Era a dívida
  "vincularProblema muda status sem emitir evento" — resolvida deletando o caminho, não
  remendando.
- Nenhum cliente consumia: o mobile chama `/problemas/:id/eventos`, que é o domínio
  `problemaEventos` (a timeline), coisa diferente. Não havia uma única chamada a
  `/eventos`.
- `mobilizacoes` já é o domínio vivo para o mesmo conceito, e passa por transação,
  permissão e timeline.
- Foram junto: `features/eventos/` e `features/mutiroes/` (pastas só com `.gitkeep`) e
  `idx_mobilizacoes_geom`, um GIST morto — nenhuma consulta de `mobilizacoes` faz
  predicado espacial, a listagem filtra por `problema_id`.

### Mobilização tinha dono só no papel

- `atualizarMobilizacao`, `atualizarStatusMobilizacao` e `registrarResultadoMobilizacao`
  só chamavam `exigirMobilizacao(id)` — checavam **existência**, não autoria. Qualquer
  pessoa autenticada cancelava, concluía ou reescrevia mobilização alheia. As três agora
  exigem criador ou `admin` e respondem 403.
- A permissão sai no payload como `pode_gerenciar` (`GET /mobilizacoes/:id` ganhou
  `optionalAuth` para calculá-la). O mobile trocou o
  `const isCriador = true; // TODO` do `MobilizacaoDetailScreen` pelo campo real.
- **`registrarResultado` forçava `status = 'realizada'` no SQL** sem consultar
  `TRANSICOES_PERMITIDAS`, tornando `agendada → realizada` e `cancelada → realizada`
  alcançáveis por essa rota enquanto o `PATCH /:id/status` as recusaria. Agora passa
  pela mesma validação. Registrar resultado numa mobilização **já** `realizada` continua
  valendo (é preencher o relato) e não reemite `MOBILIZACAO_REALIZADA`.

### `POST /imagens` era bypass do fluxo de evidência

`tipo_entidade` era `z.string().min(1)` livre, `entidade_id` um `z.number()` sem FK e
`url` qualquer URL. Contornava `podeAdicionarEvidencia`, o limite de 5 MB, a validação
de MIME e a conferência de assinatura de `enviarEvidenciaProblema`, e não emitia
`EVIDENCIA_ADICIONADA`. Sem consumidor no mobile. **A rota foi removida**, junto com o
`createImagemSchema` que só ela usava. O caminho legítimo é
`POST /imagens/upload/problema/:problemaId`; `GET /imagens/:tipo/:id`, que o mobile usa,
ficou. `saveImagem` continua como função interna, chamada pelo resultado de mobilização
dentro da transação.

### Vazamento de denúncia e força bruta

- `GET /problemas/:id/denuncias` fazia `SELECT *` com só `requireAuth`: **qualquer
  pessoa logada via `usuario_id` e `motivo` de cada denunciante**, inclusive o autor do
  problema descobrindo quem o denunciou. Passou a exigir `admin` (403 para o resto). Não
  há consumidor no mobile.
- `POST /auth/login` e `POST /auth/register` **não tinham rate-limit nenhum** — as duas
  únicas rotas anônimas, sem freio contra força bruta de senha nem contra criação de
  contas em massa. Entraram `loginLimiter` (10/min) e `registroLimiter` (5/min), com
  chave por **IP**, já que não há usuário autenticado.
- `rateLimitGuard` saiu de `routes/problemas/index.ts` para `shared/ratelimit.ts`, junto
  com as chaves `porUsuario` e `porOrigem`, para as rotas de auth reaproveitarem o mesmo
  mecanismo em vez de duplicá-lo.

### Testes

- `src/tests/integracao/servidor.ts`: monta um Fastify com o mesmo `registerRoutes` da
  aplicação e responde a `app.inject`, mais `tokenDe(id, role)` para assinar JWT de
  teste. É o que permite provar autorização e superfície HTTP de verdade, não só
  comportamento de handler.
- `auth.itest.ts`: cadastro pedindo `specialist` (e pedindo `admin`) cria `citizen`,
  conferido também na linha do banco; `429` no cadastro depois de 5 e no login depois de
  10, por origem.
- `rotas.itest.ts`: `POST /imagens` responde 404; `/eventos` responde 404 em listagem,
  criação e no vínculo que resolvia problema alheio; o upload legítimo continua
  registrado (401 sem token) e a leitura de imagens segue pública.
- `mobilizacoes.itest.ts`: 403 para não-criador em editar, cancelar e registrar
  resultado; `specialist` não herda poder; `admin` gerencia; `pode_gerenciar` reflete
  quem pediu; resultado a partir de `agendada` e de `cancelada` recusado com 400.
- `problemas.permissoes.itest.ts`: 403 para não-autor no `PATCH /status`, `specialist`
  sem moderação (nem sobre o próprio problema, para `removido`), autor movendo o próprio
  e `admin` removendo o alheio.
- `denuncias.itest.ts`: nem o autor do problema lê a lista de denunciantes.
- Specs mockados ajustados: `mobilizacoes.handler.spec.ts` (assinaturas novas com
  `usuario_id` e `role`) e `denuncias.handler.spec.ts` (403 para não-moderação).
  `eventos.handler.spec.ts` e `eventos.itest.ts` foram deletados com o domínio.
- `npm run test` continua verde **sem nenhum serviço no ar**. `npm run test:integration`
  ainda exige `docker compose up postgres` — Testcontainers é o PR seguinte.

## PR-B1 — Testcontainers e CI

Milestone **só de infraestrutura de teste e build**. Nenhuma mudança de comportamento de
produto: nenhum handler, rota, schema ou migration foi tocado.

### A integração sobe o próprio banco

- `preparar.ts` (o `globalSetup`) passou a subir um contêiner **`postgis/postgis:15-3.4`**
  via `@testcontainers/postgresql`, escrever a URI dele em `process.env.DATABASE_URL`,
  recriar o banco e rodar as migrations. Um `teardown` novo derruba o contêiner.
- A imagem **tem** de ser a com PostGIS: a migration `002` faz `CREATE EXTENSION postgis`.
  Um `postgres:15` puro falharia no `globalSetup`.
- **A armadilha que quebrava tudo:** `test.env.DATABASE_URL` no
  `vitest.integration.config.ts` é resolvido no *load* da config — antes do
  `globalSetup` — e injetado no `process.env` de cada worker. Ele sobrescreveria a URI
  dinâmica do contêiner e a suíte inteira falaria com o banco errado (ou com nenhum).
  Saiu do `test.env`, junto com o `process.env.DATABASE_URL = ...` que a config fazia no
  topo. As demais variáveis continuam lá porque são estáticas.
- A escapatória `DATABASE_URL_ITEST` foi mantida: se estiver definida, nenhum contêiner
  sobe e a suíte usa aquele banco. É o caminho para apontar para o Postgres do compose.
- `npm run test:integration` **não exige mais `docker compose up`** — exige Docker.
- **`npm run test` continua verde sem Docker nenhum rodando.** Foi verificado com o
  `econexa-postgres` do compose parado: 11 arquivos, 101 testes.

### CI enxergando banco real

`.github/workflows/ci.yml` ganhou um quarto job, `integration`, com os três atuais
intactos. O runner do GitHub já traz Docker, então **não há bloco `services:`**: quem
sobe o banco é o Testcontainers, com a mesma imagem que roda na máquina de quem
desenvolve — um jeito a menos de o CI e o local divergirem.

### Cobertura que passou a existir

O código espacial já estava correto desde o M9.5; o que faltava era **prova de
comportamento**. O que já existia (distância em metros, dedupe a 20 m / 2 km,
`uq_denuncias_problema_usuario` e `uq_encaminhamento_aberto` recusando com `23505`,
apoio concorrente com uma linha e contador 1, ciclo `migrate → rollback → migrate` sobre
dados sujos) foi conferido e continua passando. Entrou o que faltava, em
`src/tests/integracao/esquema.itest.ts`:

- **CHECK de `problema_eventos.tipo`** direto no banco: os 11 tipos emitidos passam,
  um tipo inventado e um tipo em minúsculas são recusados com `23514`.
- **`EXPLAIN` confirmando os índices `(geom::geography)`.** O teste não escreve a
  consulta à mão: espia `dbPool.query`, captura o SQL que `listarProblemas` e
  `findNearbyProblema` **realmente** executaram e roda `EXPLAIN` em cima dele, sobre
  4.001 linhas com `ANALYZE` feito. Afirma que o plano cita `idx_problemas_geom_geog` e
  que **não** há `Seq Scan on problemas`. Quebra se alguém trocar o predicado por um que
  não case com o índice de expressão — que é exatamente o defeito que o M9.5 corrigiu.
- `listarEventos` **não** foi coberto: o domínio saiu no PR-A.

### Build não leva teste

`tsconfig.json` incluía `src/**/*` sem `exclude`, então `*.spec.ts` e `*.itest.ts` iam
para o `dist/` — 12 e 11 arquivos, respectivamente. Com o Testcontainers isso piorava:
`dist/tests/integracao/preparar.js` passaria a importar `@testcontainers/postgresql`,
uma **devDependency**, dentro do bundle de produção.

**Decisão: `tsconfig.json` ficou como está e entrou um `tsconfig.build.json`** que herda
tudo e exclui `src/**/*.spec.ts`, `src/**/*.itest.ts` e `src/tests/**`. Só o `build`
usa o novo. O motivo de não simplesmente pôr `exclude` no `tsconfig.json`: ele é o que
`npm run typecheck` e o CI usam, e os arquivos de teste **precisam** continuar sendo
checados por tipo — o vitest transpila com esbuild, que não checa tipo nenhum. Excluir
ali trocaria peso morto no `dist/` por um buraco de verificação.

Depois da mudança, `npm run build` produz um `dist/` com zero `*.spec.js`, zero
`*.itest.js` e nenhuma pasta `tests/`.

## Planejado — M10, M11, M12

Os três estão **apenas planejados**. Nada deles foi implementado.

### M10 — Níveis de engajamento

Objetivo: transformar a participação em progressão visível, sem virar gamificação
vazia. Base já existente: `users.peso_voto` e `common/abilities.ts`.

- Modelo: tabela de contribuições por usuário derivada dos dados que já existem
  (problemas criados, apoios, comentários, mobilizações realizadas, evidências,
  encaminhamentos respondidos), com um nível calculado a partir dela.
- O nível deve influenciar algo real — o `peso_voto` do apoio ponderado — e não só
  um selo.
- Endpoint de leitura do próprio nível e do nível público de um usuário.
- Mobile: nível no `PerfilScreen` e ao lado do autor no comentário.
- Fora de escopo deliberado: ranking global, badges decorativos, streaks.
- **Decisão pendente:** de onde sai a contagem — agregação por consulta em cima de
  `problema_eventos` ou contadores materializados. `problema_eventos` já é a fonte
  natural e, desde o M9.5, tem `APOIO_CRIADO` e `APOIO_REMOVIDO`; o histórico anterior
  ao M9.5, porém, é parcial (ver dívidas em aberto).

### M11 — Notificações

Objetivo: avisar quem acompanha um problema quando ele anda.

- Gatilho: os tipos de `problema_eventos` que importam para o autor e para quem
  apoiou (`ENCAMINHADO`, `RESPOSTA_RECEBIDA`, `STATUS_ALTERADO`, `RESOLVIDO`,
  `MOBILIZACAO_CRIADA`).
- Modelo: tabela de notificações por usuário com lido/não lido, alimentada a partir
  do evento; `shared/queue.ts` (hoje `SyncQueue`) é o ponto de troca para processar
  fora do request.
- Endpoints: listar notificações, marcar como lida.
- Mobile: badge no ícone e uma tela de lista.
- Fora de escopo deliberado: push nativo, OneSignal, e-mail para o cidadão,
  preferências finas por tipo.
- **Decisão pendente:** quem é notificado — só o autor, ou também quem apoiou.
  Notificar todos os apoiadores exige saber quem apoiou e quando; `problema_apoios`
  guarda isso e o M9.5 passou a emitir `APOIO_CRIADO`/`APOIO_REMOVIDO`, então a decisão
  já não depende de infraestrutura nova.

### M12 — Busca e filtros

Objetivo: achar um problema por texto, não só por proximidade no mapa.

- Backend: busca textual em `titulo`/`descricao`/`tags` no Postgres
  (`to_tsvector` em português + índice GIN), somada aos filtros que já existem
  (`causaId`, `tipo`, `status`, `escopo`, `tags`).
- Combinar texto com o filtro geoespacial que o `GET /problemas` já faz.
- Mobile: barra de busca no `FeedScreen` com debounce e os filtros atuais do mapa
  reaproveitados.
- Fora de escopo deliberado: Elasticsearch, sugestão automática, busca semântica.
- **Decisão pendente:** ordenação quando há texto — relevância (`ts_rank`) ou o
  peso de apoios que a listagem usa hoje.

## Dívidas em aberto

Quitadas no M9.5: **apoio sem evento** (agora `APOIO_CRIADO`/`APOIO_REMOVIDO`) e
**dedupe de coordenadas com raio errado** (agora comparado em `geography`, em metros).

Quitada no PR-A: **`vincularProblema` mudava status sem emitir evento e sem checar
dono** — o domínio `eventos` inteiro saiu, então o caminho não existe mais.

- **Histórico de apoio anterior ao M9.5 é parcial e não tem conserto.** O backfill
  reconstruiu `APOIO_CRIADO` a partir de `problema_apoios.criado_em`, então cobre só
  quem **ainda apoia**. Apoios que já tinham sido retirados sumiram: `DELETE` físico, PK
  sem histórico, sem trigger. `APOIO_REMOVIDO` **não é derivável de nada** e só existe a
  partir deste PR. Qualquer métrica de M10/M11 que dependa de "quantas vezes fulano
  apoiou e desapoiou" precisa tratar a data de corte, não fingir histórico completo.
- **`falha_motivo` de encaminhamentos anteriores é nulo.** A coluna nasceu no M9.5; as
  falhas de envio antes disso foram engolidas pelo `catch {}` e não deixaram rastro em
  lugar nenhum.
- **Não há verificação real de resposta institucional.** O órgão continua sem conta,
  token, callback ou inbound de e-mail. O M9.5 rotulou a resposta como relato do cidadão
  e travou o registro em encaminhamento não enviado, mas verificar de verdade
  (inbound e-mail, magic link, conta de órgão) segue fora de escopo.
- **Reenvio é manual e sem retry.** `POST .../reenviar` depende de alguém apertar o
  botão. Não há fila, worker, scheduler nem retry automático — decisão deliberada.
- **`existeOrgaoDisponivel` responde por problema, não por órgão.** `pode_encaminhar`
  diz "existe pelo menos um órgão ativo sem encaminhamento aberto"; a UI ainda pode
  oferecer no modal um órgão específico que o servidor vai recusar com 400. Resolver
  exigiria a listagem de órgãos saber o problema em questão.
- `users` continua sem avatar; comentários e eventos mostram só o nome.
- `shared/cache.ts` e `shared/ratelimit.ts` seguem em memória: com mais de uma
  instância do backend, o rate-limit é por processo e o `deletePorPrefixo` novo só
  limpa o cache **daquele** processo.
- **Não existe interface de moderação.** `admin` só nasce por promoção manual no banco
  (`npm run admin:promover`), e o mobile não tem tela para as ações que só ele pode
  fazer (remover problema, ler a lista de denunciantes). Enquanto ninguém for promovido,
  essas capacidades existem no servidor e não são exercidas por ninguém.
- **`specialist` hoje não faz nada.** Depois do PR-A ele tem exatamente as mesmas
  permissões de `citizen`; o que sobra é o rótulo no perfil. Dar sentido ao papel
  depende de verificação por certificado, que segue fora de escopo.
- **A suíte de integração exige Docker na máquina.** Não é uma dívida a quitar, é o
  preço de testar PostGIS de verdade — mas quem não tem Docker no ambiente roda só
  `npm run test`.
