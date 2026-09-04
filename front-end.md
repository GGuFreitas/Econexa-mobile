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
      types.ts         # Problema, ProblemaDetalhe, ImagemProblema,
                       # ProblemaEvento, EventoApresentado
      api/             # listar, buscar, estatisticas, criar, apoios, denuncias,
                       # imagens (upload multipart), listarImagens,
                       # listarEventos, alterarStatus
      hooks/           # useProblemas, useEstatisticas, useProblema, useApoio,
                       # useDenuncia, useCriarProblema, useImagensProblema,
                       # useEnviarEvidencia, useAlterarStatus, useTimeline
      map/             # ProblemMap, ProblemMarker, ProblemCluster,
                       # MapBottomSheet, MapFilters, MapLegend, PertoDeVoce
      components/      # ProblemCard, ProblemForm, Timeline, EventoItem,
                       # AtividadeProblema, EvidenciasProblema, AlterarStatusModal
      utils/           # clusterUtils (clustering por grade),
                       # eventos (apresentarEvento), status (opcoesDeStatus)
      screens/         # Feed, Perfil, CriarProblema, DetalheProblema
    comentarios/
      types.ts         # contrato Comentario (autor + pode_excluir do servidor)
      api/             # listar, criar, excluir
      hooks/           # useComentarios, useCriarComentario, useExcluirComentario
      components/      # ComentariosList, ComentarioItem, ComentarioForm
    encaminhamentos/
      types.ts         # Orgao, Encaminhamento (+ pode_registrar_resposta do servidor)
      api/             # listarOrgaos, listar, criar, registrarResposta
      hooks/           # useOrgaos, useEncaminhamentos, useCriarEncaminhamento,
                       # useRegistrarResposta
      components/      # EncaminhamentosList, EncaminhamentoCard,
                       # EncaminharProblemaModal, RegistrarRespostaModal
      utils/           # status (rótulos, cores, opcoesDeOrgao)
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

Endpoints consumidos:

| Endpoint | Onde |
|---|---|
| `GET/POST /problemas` | mapa, feed, criar problema |
| `GET /problemas/:id` | `useProblema` (traz `pode_encaminhar` e `transicoes_permitidas`) |
| `GET /problemas/estatisticas`, `GET /problemas/tendencias` | filtros do mapa, perfil |
| `POST/DELETE /problemas/:id/apoios` | `useApoio` |
| `POST/GET /problemas/:id/denuncias` | `useDenuncia` |
| `GET/POST /problemas/:id/comentarios`, `DELETE .../:comentarioId` | feature comentários |
| `GET /problemas/:id/eventos` | `useTimeline` |
| `PATCH /problemas/:id/status` | `useAlterarStatus` |
| `POST /imagens/upload/problema/:problemaId` | `enviarEvidenciaProblema` (multipart) |
| `GET /imagens/:tipo_entidade/:entidade_id` | `useImagensProblema` |
| `GET /orgaos` | `useOrgaos` |
| `GET/POST /problemas/:id/encaminhamentos` | feature encaminhamentos |
| `POST /problemas/:id/encaminhamentos/:id/resposta` | `useRegistrarResposta` |
| `GET/POST /mobilizacoes`, `GET /mobilizacoes/:id`, `PATCH /mobilizacoes/:id`, `PATCH /mobilizacoes/:id/status`, `POST /mobilizacoes/:id/resultado`, `POST/DELETE /mobilizacoes/:id/participar` | feature mobilizations |

`Comentario` (em `features/comentarios/types.ts`) traz `autor: { id, nome }` e
`pode_excluir` calculado **no servidor** a partir do token. O app só reflete o que a
API permite — esconder o botão de excluir não é mecanismo de segurança; o
`DELETE` responde `403` para comentário de outro usuário.

O mesmo vale para o M9: `pode_encaminhar`, `transicoes_permitidas` (no detalhe do
problema) e `pode_registrar_resposta` (em cada encaminhamento) vêm calculados do
servidor. `opcoesDeStatus` só monta as opções que a API listou; se a lista vier
vazia, o botão nem aparece — e a API responde `403` de qualquer forma.

## Upload de evidência

O app envia a foto por `multipart/form-data` para
`POST /imagens/upload/problema/:problemaId` usando `uploadFile<T>` de
`services/api.ts` (com `onUploadProgress`). O servidor valida MIME, tamanho e
assinatura do arquivo, guarda no MinIO e devolve o registro da imagem.

- `ProblemForm` só **escolhe** a foto (picker + manipulator) e entrega o arquivo para
  a tela; ele não faz mais upload por conta própria.
- `CriarProblemaScreen` cria o problema, sobe a evidência para o id retornado e avisa
  se a foto falhar — o problema publicado não é perdido.
- `EvidenciasProblema` mostra a galeria e permite adicionar novas fotos a quem o
  servidor autoriza.

## Atividade do problema (timeline)

`DetalheProblemaScreen` tem três abas: `Detalhe`, `Mobilizações` e `Atividade`.

A timeline vem do backend: `useTimeline` faz uma única query
(`['eventos', problemaId]` → `GET /problemas/:id/eventos`) e passa cada linha pela
função pura `apresentarEvento`, que decide título e descrição por tipo. O `EventoItem`
só escolhe o ícone e desenha. Não há composição client-side nem ordenação no app: o
backend já devolve do mais recente para o mais antigo.

Tipos renderizados: `PROBLEMA_CRIADO`, `EVIDENCIA_ADICIONADA`, `COMENTARIO_CRIADO`,
`MOBILIZACAO_CRIADA`, `MOBILIZACAO_REALIZADA`, `ENCAMINHADO`, `RESPOSTA_RECEBIDA`,
`STATUS_ALTERADO` e `RESOLVIDO`.

A query é invalidada quando uma ação do app cria evento (comentar, criar/concluir
mobilização, subir evidência, encaminhar, registrar resposta, alterar status). **Sem
polling, sem websocket, sem tempo real.** Evento que o backend não emite não aparece:
o app não deduz apoio por variação de contador. Apoio segue fora da timeline porque
o backend ainda não emite evento para ele.

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

## Encaminhamento institucional

`features/encaminhamentos/` cobre o fluxo do M9 dentro da aba `Detalhe`:

- "Encaminhar problema" abre `EncaminharProblemaModal`, que carrega os órgãos só
  quando o modal abre, deixa escolher o órgão e um complemento e **pede confirmação
  explícita** antes de disparar o e-mail (ação irreversível).
- `EncaminhamentosList` mostra cada encaminhamento com estado
  (`Aguardando envio`, `Enviado ao órgão`, `Respondido`, `Falha no envio`),
  referência e a resposta do órgão quando houver.
- `RegistrarRespostaModal` só é alcançável quando o servidor devolve
  `pode_registrar_resposta`.
- "Alterar status" abre `AlterarStatusModal` com as opções de
  `transicoes_permitidas` e explica o efeito antes de confirmar.

Todos os blocos tratam loading, vazio, erro, sucesso e ação em andamento. Nenhum
deles usa `0` como fallback de dado ainda não carregado.

## Testes e qualidade

- `npm run typecheck` (tsc --noEmit)
- `npm run lint` (eslint)
- `npm run test` (vitest)
- `npx expo-doctor` (20/21 no SDK 57 — mismatch de patch dos pacotes Expo, conhecido
  e aceito desde o master)

Stack de teste: **vitest em ambiente jsdom**, cobrindo funções puras
(`apresentarEvento`, `opcoesDeStatus`, `clusterUtils`, `dataRelativa`), a camada
`api/` com o axios mockado e os hooks com `renderHook` do
`@testing-library/react` sobre um `QueryClientProvider`.

**Não há render de árvore React Native nos testes**: o `react-native` do SDK 57 é
distribuído com sintaxe Flow que o esbuild do vitest não transforma, e
`@testing-library/react-native` exigiria o preset de Jest. Jest não é usado neste
projeto — a cobertura fica em hooks e funções puras.
