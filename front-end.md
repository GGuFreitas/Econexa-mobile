# Arquitetura Mobile — front-end

App mobile do Mutira. Stack validada em ago/2026: **Expo SDK 57 + Node 24 LTS**.

## Stack

- Expo SDK 57 (React Native 0.86, React 19.2)
- TypeScript (moduleResolution: bundler)
- React Navigation (native-stack) — sem expo-router, para evitar churn
- React Native Paper (tema próprio "Mutira")
- Redux Toolkit (auth + tema) + React Redux
- TanStack Query v5 (dados de servidor: problemas, estatísticas)
- Axios (api.ts + interceptor de token)
- React Hook Form + Zod (formulários/validação)
- react-native-maps + expo-location (Mapa Vivo)
- Vitest (jsdom) para utils puros, camada `api/` e hooks (`renderHook` do
  `@testing-library/react`). **Não há** render de componentes React Native nos testes:
  o `react-native` do SDK 57 é distribuído com sintaxe Flow e o vitest/esbuild não
  consegue transformá-lo (`@testing-library/react-native` exigiria o preset de jest).

## Estrutura

```
src/
  features/            # por domínio (baixo acoplamento)
    auth/              # login, registro
    home/              # HomeScreen = Mapa Vivo
    problemas/
      types.ts         # contrato Problema, ImagemProblema, EventoTimeline
      api/             # listar, buscar, estatisticas, criar, apoios,
                       # denuncias, imagens, listarImagens
      hooks/           # useProblemas, useEstatisticas, useProblema, useApoio,
                       # useDenuncia, useCriarProblema, useImagensProblema, useTimeline
      map/             # ProblemMap, ProblemMarker, ProblemCluster,
                       # MapBottomSheet, MapFilters, MapLegend, PertoDeVoce
      components/      # ProblemCard, ProblemForm, Timeline, AtividadeProblema
      utils/           # clusterUtils (clustering por grade), timeline (montarTimeline)
      screens/         # Feed, Perfil, CriarProblema, DetalheProblema
    comentarios/
      types.ts         # contrato Comentario (autor + pode_excluir do servidor)
      api/             # listar, criar, excluir
      hooks/           # useComentarios, useCriarComentario, useExcluirComentario
      components/      # ComentariosList, ComentarioItem, ComentarioForm
    mobilizations/     # types, api, hooks, components, screens, utils
  shared/
    theme/             # cores, espaçamento, tipografia, theme (light/dark)
    ui/                # Button, TextInput, Chip, Card, BottomSheet, FAB, Tabs...
    hooks/             # useAppTheme, useLocalizacao, useAppQueryClient
    utils/             # dataRelativa (formatarDataRelativa)
  store/               # authSlice, themeSlice (Redux)
  navigation/          # AppNavigator, AuthGuard
  services/            # api.ts (axios)
```

Importações usam aliases (`@features`, `@shared`, `@store`, `@navigation`,
`@services`) resolvidos em `metro.config.js` (extraNodeModules) e `tsconfig.json`
(paths).

## Contrato com backend

`Problema` (em `features/problemas/types.ts`) segue o backend:
`causa_id` (1-8), `tipo` (problema|ponto_positivo|cultural), `status`
(ativo|em_analise|encaminhado|resolvido|removido), `cont_apoios`,
`distancia_m?`. `role` do usuário = `citizen|specialist|organization`.

Endpoints consumidos: `GET/POST /problemas`, `GET /problemas/:id`,
`GET /problemas/estatisticas`, `GET /problemas/tendencias`,
`POST/DELETE /problemas/:id/apoios`, `POST/GET /problemas/:id/denuncias`,
`GET/POST /problemas/:id/comentarios`, `DELETE /problemas/:id/comentarios/:comentarioId`,
`GET /imagens/:tipo_entidade/:entidade_id`,
`GET/POST /mobilizacoes`, `GET /mobilizacoes/:id`, `PATCH /mobilizacoes/:id`,
`PATCH /mobilizacoes/:id/status`, `POST /mobilizacoes/:id/resultado`,
`POST/DELETE /mobilizacoes/:id/participar`.

`Comentario` (em `features/comentarios/types.ts`) traz `autor: { id, nome }` e
`pode_excluir` calculado **no servidor** a partir do token. O app só reflete o que a
API permite — esconder o botão de excluir não é mecanismo de segurança; o
`DELETE` responde `403` para comentário de outro usuário.

## Atividade do problema (timeline)

`DetalheProblemaScreen` tem três abas: `Detalhe`, `Mobilizações` e `Atividade`.

A timeline é montada **no cliente** (`utils/timeline.ts` → `montarTimeline`, pura) a
partir do que já existe na API, em ordem do mais recente para o mais antigo:

| Evento | Origem |
|---|---|
| `problema_criado` | `GET /problemas/:id` (`criado_em`) |
| `evidencia_adicionada` | `GET /imagens/problema/:id` (`criado_em`) |
| `comentario_criado` | `GET /problemas/:id/comentarios` (`criado_em`) |
| `mobilizacao_criada` | `GET /mobilizacoes?problemaId=` (`criado_em`) |
| `mobilizacao_realizada` | idem, quando `status = 'realizada'` (`atualizado_em`) |

O backend **não tem** tabela nem endpoint de eventos/atividade, e as rotas de apoio
não expõem quem apoiou nem quando — por isso "fulano apoiou o problema" fica fora da
timeline. Nenhum sistema genérico de eventos foi criado para preencher essa lacuna.

## Mapa Vivo

- `markerConfig.ts`: `causaConfig` mapeia ids 1-8 do backend → cor + ícone
  (MaterialCommunityIcons) + prioridade. Única fonte de verdade visual das causas.
- `mapTheme.ts`: tamanho do marker por prioridade, cores de estado, animação, sombra.
- `ProblemMap.tsx`: orquestra `MapView` + clustering próprio (grid em
  `clusterUtils`, célula derivada do delta visível) + filtros + legenda +
  bottom sheet + FAB + barra "Perto de você".
- `ProblemMarker.tsx`: ícone + cor + tamanho + anel de mobilização + badge de apoios.
- `ProblemCluster.tsx`: cluster mostra breakdown por categoria (não contador genérico).

Clustering é implementado no app (sem lib externa) para controlar a UI do cluster.

## Tema

`shared/theme/theme.ts` exporta `getAppTheme(mode)` (light/dark) consumido por
`useAppTheme()`. Todos os componentes de `shared/ui` são theme-aware.

## Testes e qualidade

- `npm run typecheck` (tsc --noEmit)
- `npm run lint` (eslint)
- `npm run test` (vitest)
- `npx expo-doctor` (21/21 checks no SDK 57)
