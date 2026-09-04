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
  natural, mas ainda não tem evento de apoio (ver dívida abaixo).

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
  Notificar todos os apoiadores exige saber quem apoiou e quando, o que hoje
  `problema_apoios` guarda, mas sem evento correspondente.

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

- **Apoio sem evento:** `problema_apoios` guarda `criado_em`, mas nenhum evento de
  apoio é emitido, então "fulano apoiou" continua fora da timeline. Decidir antes do
  M10/M11, porque os dois dependem disso.
- **Dedupe de coordenadas com raio errado:** `findNearbyProblema`
  (`common/problemas/problemas.sql.ts`, do M5) usa
  `ST_DWithin(geom, ..., 15)` com `geometry(Point, 4326)`, cuja unidade é **grau**,
  não metro. Os 15 metros pretendidos viram ~1.665 km: qualquer problema novo da
  mesma causa e tipo no Brasil é tratado como duplicata e a criação devolve o
  registro existente. A correção é comparar em `geography`. Não foi alterado aqui
  por ser regra de produto do M5.
- `users` continua sem avatar; comentários e eventos mostram só o nome.
- `shared/cache.ts` e `shared/ratelimit.ts` seguem em memória: com mais de uma
  instância do backend, o rate-limit é por processo.
