# Etapas implementadas

Registro simples de cada PR entregue no mobile. Commits granulares por PR.

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

## Próximas

- **PR-M4** — Criar problema (form + foto via expo-image-picker/manipulator) +
  Mobilização (apoiar, denunciar) funcional no mapa/bottom sheet.
- **PR-M5** — Feed/Perfil/Impacto + navegação em tabs (Mapa/Feed/Perfil).

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
- Nota: o backend expõe `POST /imagens` com JSON (`url`), não um endpoint multipart;
  o mobile chama `/imagens/upload/problema/:id`, que **não existe**. A associação
  da imagem ficou pendente de backend.

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
  eventos foi criado neste PR.
- Lacuna assumida: `users` não tem coluna de avatar, então o comentário mostra apenas
  nome do autor + data relativa.

