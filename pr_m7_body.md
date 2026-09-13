## M7 - Mobilizações/Mutirões

### Visão
Dual-track do problema: **Ação institucional** (apoios → encaminhamento → órgão) + **Ação comunitária** (mobilização → mutirão → resultado).

### Mobile - features/mobilizations/
- **types.ts**: Mobilizacao, CriarMobilizacaoInput, ResultadoMobilizacaoInput, status (agendada→em_andamento→realizada/cancelada)
- **api/listar.ts**: CRUD + participar/sair + status + resultado
- **hooks/**: useMobilizacoes (infinite), useMobilizacao, useCriarMobilizacao, useParticipar/useSair (otimista), useAtualizarStatus, useAdicionarResultado
- **components/**: MobilizacaoCard, CriarMobilizacaoForm, ResultadoForm
- **screens/**: MobilizacoesListScreen, CriarMobilizacaoScreen, MobilizacaoDetailScreen
- **utils/statusTransitions.ts**: validação client-side (backend é autoridade)

### Integração
- **DetalheProblemaScreen**: Abas "Detalhe" / "Mobilizações" (Tabs custom)
- **MobilizacoesListScreen** na aba + navegação para MobilizacaoDetailScreen
- **CriarMobilizacaoScreen** (prefill coordenada do problema)
- **MobilizacaoDetailScreen**: participar/sair, status transitions, resultado (fotos + métricas)

### Navegação
- RootStackParamList: CriarMobilizacao { problemaId }, MobilizacaoDetail { id }
- Guards de auth mantidos

### Commits
1. feat(mobilizations): feature completa M7
2. feat(mobile): integração M7 no DetalheProblema + navegação + Tabs

### Checklist
- [x] TypeScript strict pass
- [x] ESLint pass
- [x] Testes 14/14 pass
- [x] expo-doctor 21/21 pass