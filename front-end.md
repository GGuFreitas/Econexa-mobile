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
    auth/              # api/ login, register
                       # components/ LoginForm, RegisterForm
                       # hooks/ useLogin, useRegister
                       # screens/ LoginScreen, RegisterScreen
    home/              # HomeScreen = Mapa Vivo
    problemas/
      types.ts         # Problema, ProblemaDetalhe, ImagemProblema,
                       # ProblemaEvento, EventoApresentado
      api/             # params (montarFiltro/montarListagem, um só serializador),
                       # listar, buscar, estatisticas, criar, apoios, denuncias,
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
      types.ts         # Orgao, Encaminhamento (+ pode_registrar_resposta,
                       # pode_reenviar, falha_motivo e resposta_verificada do servidor)
      api/             # listarOrgaos, listar, criar, registrarResposta, reenviar
      hooks/           # useOrgaos, useEncaminhamentos, useCriarEncaminhamento,
                       # useRegistrarResposta, useReenviarEncaminhamento
      components/      # EncaminhamentosList, EncaminhamentoCard,
                       # EncaminharProblemaModal, RegistrarRespostaModal
      utils/           # status (rótulos, cores, opcoesDeOrgao, rotuloDoRelato)
    mobilizations/     # types, api, hooks, components, screens, utils
  shared/
    theme/             # cores, espaçamento, tipografia, theme (light/dark)
    ui/                # Button, TextInput (+ helperText), Chip, Card, BottomSheet,
                       # FAB, Tabs...
    hooks/             # useAppTheme, useLocalizacao, useAppQueryClient
    utils/             # dataRelativa (formatarDataRelativa),
                       # mensagemDeErro (status HTTP -> texto para o usuário)
  store/               # authSlice, themeSlice (Redux)
  navigation/          # AppNavigator, AuthGuard
  services/            # api.ts (axios), ApiError.ts
```

Importações usam aliases (`@features`, `@shared`, `@store`, `@navigation`,
`@services`) resolvidos em `metro.config.js` (extraNodeModules) e `tsconfig.json`
(paths).

## Contrato com backend

`Problema` (em `features/problemas/types.ts`) segue o backend:
`causa_id` (1-8), `tipo` (problema|ponto_positivo|cultural), `status`
(ativo|em_analise|encaminhado|resolvido|removido), `cont_apoios`,
`distancia_m?` (**metros de verdade** desde o M9.5; antes o backend devolvia graus com
nome de metro). `role` do usuário = `citizen|specialist|admin`.

`POST /auth/register` **não aceita mais `role`**: `RegisterInput` tem só `nome`, `email`
e `password`, e todo cadastro nasce `citizen`. O campo era escalada de privilégio —
quem se registrasse como `specialist` ganhava moderação no servidor. `organization` saiu
do modelo por ser decorativo, então o `ROLE_LABEL` do `PerfilScreen` passou a rotular
`citizen`, `specialist` e `admin`.

`POST /problemas` **não devolve mais o problema direto**: devolve
`{ criado: boolean, problema: Problema }`, com **201** quando criou e **200** quando o
servidor encontrou um registro parecido no mesmo ponto. `CriarProblemaScreen` olha
`criado` — se vier `false`, avisa que já existe um registro ali e abre o detalhe dele em
vez de fingir publicação. O status HTTP sozinho nunca vira "publicado com sucesso".

Endpoints consumidos:

| Endpoint | Onde |
|---|---|
| `GET/POST /problemas` | mapa, feed, criar problema (`POST` devolve `{ criado, problema }`) |
| `GET /problemas/:id` | `useProblema` (traz `pode_encaminhar`, `pode_adicionar_evidencia` e `transicoes_permitidas`) |
| `GET /problemas/estatisticas`, `GET /problemas/tendencias` | filtros do mapa, perfil |
| `POST/DELETE /problemas/:id/apoios` | `useApoio` |
| `POST /problemas/:id/denuncias` | `useDenuncia` (o `GET` da lista virou exclusivo de `admin` e não tem consumidor no app) |
| `GET/POST /problemas/:id/comentarios`, `DELETE .../:comentarioId` | feature comentários |
| `GET /problemas/:id/eventos` | `useTimeline` |
| `PATCH /problemas/:id/status` | `useAlterarStatus` |
| `POST /imagens/upload/problema/:problemaId` | `enviarEvidenciaProblema` (multipart) |
| `GET /imagens/:tipo_entidade/:entidade_id` | `useImagensProblema` |
| `GET /orgaos` | `useOrgaos` |
| `GET/POST /problemas/:id/encaminhamentos` | feature encaminhamentos |
| `POST /problemas/:id/encaminhamentos/:id/resposta` | `useRegistrarResposta` |
| `POST /problemas/:id/encaminhamentos/:id/reenviar` | `useReenviarEncaminhamento` |
| `GET/POST /mobilizacoes`, `GET /mobilizacoes/:id`, `PATCH /mobilizacoes/:id`, `PATCH /mobilizacoes/:id/status`, `POST /mobilizacoes/:id/resultado`, `POST/DELETE /mobilizacoes/:id/participar` | feature mobilizations |

`Comentario` (em `features/comentarios/types.ts`) traz `autor: { id, nome }` e
`pode_excluir` calculado **no servidor** a partir do token. O app só reflete o que a
API permite — esconder o botão de excluir não é mecanismo de segurança; o
`DELETE` responde `403` para comentário de outro usuário.

O mesmo vale para as permissões do M9/M9.5: `pode_encaminhar`,
`pode_adicionar_evidencia`, `transicoes_permitidas` (no detalhe do problema),
`pode_registrar_resposta` e `pode_reenviar` (em cada encaminhamento) vêm calculados do
servidor. `opcoesDeStatus` só monta as opções que a API listou; se a lista vier
vazia, o botão nem aparece — e a API responde `403` de qualquer forma.

### Sessão e erro da API

`services/api.ts` **preservava só a mensagem**: o interceptor transformava tudo em
`new Error(msg)` e o status HTTP era destruído. Nenhum consumidor conseguia distinguir
401 de 403, 404, 429 ou falha de rede — e, por consequência, **o 401 não fazia nada**: a
action `logout` do `authSlice` existia e não era despachada por sessão expirada em lugar
nenhum.

- O interceptor agora rejeita com `ApiError` (`services/ApiError.ts`), que carrega
  `status`. Continua sendo um `Error`, então quem só lê `message` não muda.
- Um `401` fora de `/auth/login` e `/auth/register` **derruba a sessão**
  (`store.dispatch(logout())`), e o `AuthGuard` devolve a tela de login sozinho. As duas
  rotas de autenticação são exceção porque ali o 401 significa "senha errada", não
  "sessão expirou".
- `shared/utils/mensagemDeErro.ts` traduz o status em texto para o usuário (401 =
  credencial, 429 = excesso de tentativas, sem status = rede) e é função pura, testada.

**A tela de cadastro passou a existir.** `useRegister` e `api/register.ts` existiam desde
o M1 e **não eram importados por componente nenhum**: o `LoginScreen` só renderizava o
`LoginForm`, e não havia como criar conta pelo app — o `ETAPAS.md` afirmava o contrário.
Agora há `RegisterForm` + `RegisterScreen`, a rota `Cadastro` no stack e o link
"Criar conta" no login. Sem campo `role`, que o PR-A removeu do contrato. Depois do
cadastro o app já faz o login com as mesmas credenciais; se esse login falhar, avisa e
volta para a tela de login em vez de deixar a pessoa presa.

**`CriarMobilizacao` era inalcançável.** A tela estava registrada no navigator e nenhum
`navigate('CriarMobilizacao')` existia, o que tornava mortos `CriarMobilizacaoScreen`,
`CriarMobilizacaoForm` e `useCriarMobilizacao` — enquanto o empty state convidava a "ser
o primeiro a organizar uma ação" sem botão nenhum. O `MobilizacoesListScreen` recebeu
`onCriar` e o oferece nos dois lugares: no cabeçalho da lista e dentro do estado vazio.

**O botão de sair saiu do `Header` e foi para o `PerfilScreen`.** O `Header` genérico
despachava `logout()` num botão fixo, o que o colocava em toda tela que usa cabeçalho —
inclusive na de cadastro, onde ninguém está logado. Agora o `Header` só tem título e
voltar, e "Sair da conta" é um botão explícito no perfil.

A mobilização entrou na mesma regra: `GET /mobilizacoes/:id` devolve `pode_gerenciar`, e
o `MobilizacaoDetailScreen` usa esse campo para decidir se mostra Iniciar, Cancelar,
Marcar como realizada e Adicionar resultado. Antes a tela tinha
`const isCriador = true; // TODO`, ou seja, oferecia as quatro ações a todo mundo — e o
servidor aceitava, porque também não checava dono. Agora o servidor responde 403 e o app
só oferece o que ele autoriza.

Cada booleano serve a **um** conceito. Até o M9 o `EvidenciasProblema` recebia
`podeAdicionar={problema.pode_encaminhar}`, ou seja, um campo de encaminhamento
decidindo evidência; agora usa `pode_adicionar_evidencia`, que o servidor calcula como
"autor, quem apoiou ou moderação". E `pode_encaminhar` deixou de mentir: só é `true` se
o problema não estiver `removido` **e** existir órgão ativo sem encaminhamento aberto —
as duas travas que o `POST` de encaminhamento sempre aplicou.

### Resposta do órgão é relato, não confirmação

O órgão não tem conta nem canal de retorno: quem digita a resposta é o próprio autor do
encaminhamento. O app não pode apresentar isso como confirmação institucional.
`Encaminhamento.resposta_verificada` vem `false` do servidor, o `EncaminhamentoCard`
rotula a resposta com o nome de quem a relatou (`rotuloDoRelato`) e mostra o aviso de
`AVISO_RESPOSTA_NAO_VERIFICADA`, e o `RegistrarRespostaModal` traz o mesmo aviso antes do
formulário. Na timeline, `RESPOSTA_RECEBIDA` aparece como "Resposta relatada pelo
cidadão".

### Encaminhamento que falhou tem saída

`falha_motivo` traz do servidor por que o e-mail não saiu, e `pode_reenviar` habilita o
botão "Reenviar ao órgão" (`useReenviarEncaminhamento`) para os estados `pendente` e
`falhou`. É ação manual: não há retry automático em lugar nenhum.

## Upload de evidência

O app envia a foto por `multipart/form-data` para
`POST /imagens/upload/problema/:problemaId` usando `uploadFile<T>` de
`services/api.ts` (com `onUploadProgress`). O servidor valida MIME, tamanho e
assinatura do arquivo, guarda no MinIO e devolve o registro da imagem.

- `ProblemForm` só **escolhe** a foto (picker + manipulator) e entrega o arquivo para
  a tela; ele não faz mais upload por conta própria.
- `CriarProblemaScreen` cria o problema, sobe a evidência para o id retornado e avisa
  se a foto falhar — o problema publicado não é perdido. Quando o servidor devolve
  `criado: false` (registro parecido no mesmo ponto), a tela não sobe a foto: abre o
  detalhe do registro existente e explica que apoiar é o que libera anexar evidência.
- `EvidenciasProblema` mostra a galeria e permite adicionar novas fotos a quem o
  servidor autoriza via `pode_adicionar_evidencia` (autor, quem apoiou ou moderação).

## Atividade do problema (timeline)

`DetalheProblemaScreen` tem três abas: `Detalhe`, `Mobilizações` e `Atividade`.

A timeline vem do backend: `useTimeline` faz uma única query
(`['eventos', problemaId]` → `GET /problemas/:id/eventos`) e passa cada linha pela
função pura `apresentarEvento`, que decide título e descrição por tipo. O `EventoItem`
só escolhe o ícone e desenha. Não há composição client-side nem ordenação no app: o
backend já devolve do mais recente para o mais antigo.

Tipos renderizados: `PROBLEMA_CRIADO`, `EVIDENCIA_ADICIONADA`, `COMENTARIO_CRIADO`,
`APOIO_CRIADO`, `APOIO_REMOVIDO`, `MOBILIZACAO_CRIADA`, `MOBILIZACAO_REALIZADA`,
`ENCAMINHADO`, `RESPOSTA_RECEBIDA`, `STATUS_ALTERADO` e `RESOLVIDO`.

A query é invalidada quando uma ação do app cria evento (comentar, criar/concluir
mobilização, subir evidência, encaminhar, registrar resposta, alterar status, apoiar e
desapoiar). **Sem polling, sem websocket, sem tempo real.** Evento que o backend não
emite não aparece: o app continua sem deduzir apoio por variação de contador — o apoio
entrou na timeline porque o backend passou a emitir `APOIO_CRIADO`/`APOIO_REMOVIDO`, não
porque o app inferiu algo.

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
  referência, o `falha_motivo` quando o envio não saiu e o relato de resposta quando
  houver.
- `RegistrarRespostaModal` só é alcançável quando o servidor devolve
  `pode_registrar_resposta` — que agora exige `enviado_em`, ou seja, não dá para relatar
  a resposta de um e-mail que nunca saiu.
- "Reenviar ao órgão" aparece quando o servidor devolve `pode_reenviar`
  (`pendente` ou `falhou`) e chama `useReenviarEncaminhamento`. É a saída manual para o
  envio que falhou; não existe retry automático no app nem no backend.
- "Alterar status" abre `AlterarStatusModal` com as opções de
  `transicoes_permitidas` e explica o efeito antes de confirmar.

Todos os blocos tratam loading, vazio, erro, sucesso e ação em andamento. Nenhum
deles usa `0` como fallback de dado ainda não carregado.

### Números que o app mostra

- **`PerfilScreen` dizia "Seu impacto"** e exibia `estatisticas?.total ?? 0`, que é a
  contagem de problemas ativos **da região**, não do usuário — nada ali media a
  participação de quem estava olhando. O card virou "Na sua região", diz o raio em km e
  **perdeu o `?? 0`**: enquanto a estatística não chega, mostra que está carregando.
  Impacto do usuário só existe a partir do M10.
- **`ProblemMap` mostrava "N mobilizando"** a partir de
  `estatisticas?.porCausa?.reduce((acc, c) => acc + c.total, 0)`. A soma de `porCausa`
  é, por definição, o próprio `total`: a métrica repetia a contagem de problemas com
  outro rótulo. **Foi removida** — não existe fonte de dado para "quantas pessoas estão
  mobilizando perto de você", e inventar uma seria mentir. `PertoDeVoce` ficou com o
  total e passou a receber o raio por prop em vez de repetir `8` no corpo.
- Com as agregações honrando `raio` (PR-B2 no backend), o "N em 8km" do `PertoDeVoce`
  finalmente diz o que promete: antes era a contagem nacional com rótulo regional.

## `shared/ui/TextInput`

`TextInput` aceita `helperText` e **renderiza** a mensagem no `HelperText` do Paper, com
`type="error"` quando o campo está em erro. Até o M9.5 a prop existia na assinatura mas
era repassada por `{...props}` ao `PaperInput`, que não a conhece: toda mensagem de
validação era engolida em silêncio, nos 10 usos de `ProblemForm`,
`RegistrarRespostaModal`, `CriarMobilizacaoForm` e `ResultadoForm`.

A decisão de mostrar (e com que `type`) fica em `shared/ui/helperText.ts`, função pura —
é o que dá para testar sem renderizar árvore React Native.

O `LoginForm` tinha ficado de fora dessa correção: renderizava o erro num `<Text>`
manual com `#b91c1c` no meio do JSX. Passou a usar `helperText` como os outros quatro
formulários, e o `LoginScreen` deixou de ter cor fixa no código.

**Tipagem dos formulários.** `LoginForm` era a única função de componente sem tipo
(`export function LoginForm({ onSubmit })`), o que passava porque `mobile/tsconfig.json`
tem `strict: false`. Agora tem `LoginFormProps`, e o `RegisterForm` nasceu tipado. Um
detalhe do mesmo `strict: false`: `z.infer` devolve **todos** os campos opcionais quando
`strictNullChecks` está desligado, então `LoginFormValues` e `RegisterFormValues` são
declarados à mão em vez de inferidos do schema.

## Testes e qualidade

- `npm run typecheck` (tsc --noEmit)
- `npm run lint` (eslint)
- `npm run test` (vitest)
- `npx expo-doctor` (20/21 no SDK 57 — mismatch de patch dos pacotes Expo, conhecido
  e aceito desde o master)

Stack de teste: **vitest em ambiente jsdom**, cobrindo funções puras
(`apresentarEvento`, `opcoesDeStatus`, `clusterUtils`, `dataRelativa`,
`estadoDoHelperText`, `rotuloDoRelato`, `mensagemDeErro`), a camada `api/` com o axios
mockado e os hooks com `renderHook` do `@testing-library/react` sobre um
`QueryClientProvider`.

`participacao.hooks.spec.tsx` cobre o update otimista de participar/sair e, sobretudo, o
**rollback**: `useParticipar` e `useSair` faziam
`qc.setQueryData(['mobilizacao', ctx.prev], ctx.prev)` — usavam o **objeto de dados**
como parte da chave, então o rollback escrevia numa chave-lixo e o estado otimista
errado ficava na tela. O teste confere que o cache volta ao valor anterior e que nenhuma
chave nova aparece.

**Não há render de árvore React Native nos testes**: o `react-native` do SDK 57 é
distribuído com sintaxe Flow que o esbuild do vitest não transforma, e
`@testing-library/react-native` exigiria o preset de Jest. Jest não é usado neste
projeto — a cobertura fica em hooks e funções puras.

No CI (`.github/workflows/ci.yml`) o mobile aparece em `typecheck`, `lint` e `test`. O
quarto job, `integration`, é só do backend (Postgres com PostGIS via Testcontainers) e
não roda nada do app.
