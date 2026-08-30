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
- Vitest + @testing-library/react-native (testes unitários)

## Estrutura

```
src/
  features/            # por domínio (baixo acoplamento)
    auth/              # login, registro
    home/              # HomeScreen = Mapa Vivo
    problemas/
      types.ts         # contrato Problema (espelha backend)
      api/             # listar, buscar, estatisticas
      hooks/           # useProblemas, useEstatisticas, useProblema
      map/             # ProblemMap, ProblemMarker, ProblemCluster,
                       # MapBottomSheet, MapFilters, MapLegend, PertoDeVoce
      components/      # ProblemCard (lista)
      utils/           # clusterUtils (clustering por grade)
  shared/
    theme/             # cores, espaçamento, tipografia, theme (light/dark)
    ui/                # Button, TextInput, Chip, Card, BottomSheet, FAB...
    hooks/             # useAppTheme, useLocalizacao
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
`POST/DELETE /problemas/:id/apoios`, `POST/GET /problemas/:id/denuncias`.

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
