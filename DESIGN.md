---
name: Mutira
description: Transforma ações individuais em ações coletivas.
colors:
  mata-atlantica: "#134E4A"
  mata-atlantica-clara: "#2F6F6A"
  mata-atlantica-funda: "#0B3532"
  mata-atlantica-container: "#DCEBE8"
  barro: "#B8520A"
  barro-claro: "#D9762F"
  barro-fundo: "#8F3F06"
  barro-container: "#F8E4D3"
  papel-creme: "#FBF6EE"
  folha: "#FFFDF9"
  papel-pardo: "#F3EADC"
  tinta: "#1E1410"
  tinta-media: "#5E5348"
  tinta-clara: "#8E8273"
  linha: "#E8DCCB"
  divisor: "#F0E7DA"
  sucesso: "#2E7D32"
  aviso: "#F57F17"
  erro: "#C62828"
  info: "#0277BD"
  escuro-mata-atlantica: "#5FB3A8"
  escuro-mata-atlantica-container: "#12302D"
  escuro-on-mata-atlantica: "#04201D"
  escuro-barro: "#E0823A"
  escuro-barro-container: "#3A2210"
  escuro-fundo: "#12100D"
  escuro-folha: "#1C1915"
  escuro-papel-pardo: "#26221C"
  escuro-tinta: "#F5EEE3"
  escuro-tinta-media: "#BFB3A3"
  escuro-tinta-clara: "#8A7F70"
  escuro-linha: "#352F27"
  categoria-mobilidade: "#1D4ED8"
  categoria-infraestrutura: "#B45309"
  categoria-poluicao: "#047857"
  categoria-desmatamento: "#15803D"
  categoria-cultura: "#7E22CE"
  categoria-seguranca: "#B91C1C"
  categoria-saude: "#BE185D"
  categoria-educacao: "#4338CA"
  escuro-categoria-mobilidade: "#60A5FA"
  escuro-categoria-infraestrutura: "#FBBF24"
  escuro-categoria-poluicao: "#34D399"
  escuro-categoria-desmatamento: "#4ADE80"
  escuro-categoria-cultura: "#C084FC"
  escuro-categoria-seguranca: "#F87171"
  escuro-categoria-saude: "#F472B6"
  escuro-categoria-educacao: "#818CF8"
typography:
  marca:
    fontFamily: "Cardo, serif"
    fontSize: "32px"
    fontWeight: 700
  display:
    fontFamily: "System"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "System"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "System"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "System"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "System"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
rounded:
  sm: "4px"
  md: "12px"
  lg: "20px"
  full: "9999px"
spacing:
  half: "4px"
  one: "8px"
  two: "12px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "48px"
  seven: "64px"
components:
  button-primary:
    backgroundColor: "{colors.mata-atlantica}"
    textColor: "{colors.folha}"
    rounded: "{rounded.md}"
  button-outlined:
    textColor: "{colors.mata-atlantica}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.folha}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
  header:
    backgroundColor: "{colors.mata-atlantica}"
    textColor: "{colors.folha}"
    padding: "16px 24px"
  bottom-sheet:
    backgroundColor: "{colors.folha}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Mutira

<!-- Paleta fixa: os valores de cor vêm de mobile/src/shared/theme/colors.ts e não mudam. Este arquivo descreve como usá-los. -->

## Overview

**Creative North Star: "O Caderno do Mutirão"**

O Mutira é um caderno de campo coletivo: papel creme, tinta verde-petróleo, marcações em terracota. Cada problema relatado é uma anotação de alguém do bairro, não um chamado num painel de governo. A interface deve parecer feita por gente, com a calma de papel e a urgência de quem anotou algo na rua.

O sentimento dos componentes é macio e acolhedor: cantos generosos, superfícies em camadas de papel (creme, folha, papel pardo), toque confortável. O acolhimento nunca custa legibilidade: o uso é na rua, no sol, com uma mão, então a tinta é escura, os alvos são grandes e o estado de cada problema é sempre dito com ícone e palavra, não só com cor.

Este documento registra o sistema como está no código em novembro de 2026, antes do redesenho. A paleta é fixa por decisão do produto. Tipografia, espaçamento, forma e componentes podem evoluir; quando evoluírem, este arquivo é atualizado a partir do código entregue.

**Key Characteristics:**
- Paleta quente e terrosa, fixa, com temas claro e escuro de mesmo peso.
- Verde-petróleo como voz da ação; terracota como marca de atenção e de mobilização.
- Superfícies de papel em três tons em vez de sombras fortes.
- Fonte do sistema para tudo que é interface; Cardo só para a marca.
- Base em React Native Paper (Material 3), tematizada pela paleta.

## Colors

Uma paleta de papel e terra: fundos creme, tinta marrom quase preta, um verde de mata e um laranja de barro.

### Primary
- **Mata Atlântica** (#134E4A; escuro #5FB3A8): a voz da ação. Botão principal, aba selecionada, cabeçalho, links e foco de campo. Contraste 8.8:1 sobre o creme; texto branco sobre ela 9.5:1. No escuro, o texto sobre ela é o `escuro-on-mata-atlantica` (6.9:1).
- **Mata Atlântica Clara / Funda / Container** (#2F6F6A / #0B3532 / #DCEBE8): estados de toque, texto sobre container e fundo de destaques suaves.

### Secondary
- **Barro** (#B8520A; escuro #E0823A): atenção e mobilização. Contador de apoios, mutirões, avisos de meta. Sobre o creme dá 4.6:1, então serve para texto normal só em peso médio ou maior; texto branco sobre Barro dá 4.9:1.
- **Barro Claro / Fundo / Container** (#D9762F / #8F3F06 / #F8E4D3): realces, texto sobre container e faixas de aviso suave.

### Tertiary
- **Info** (#0277BD; escuro #4FC3F7): definida no tema como terciária e como "info"; usada no mapa para "encaminhado". Não faz parte da identidade e não deve ganhar papel de marca.

### Neutral
- **Papel Creme** (#FBF6EE; escuro #12100D): fundo de tela.
- **Folha** (#FFFDF9; escuro #1C1915): cartões, folhas inferiores, campos.
- **Papel Pardo** (#F3EADC; escuro #26221C): superfície variante, chips e áreas agrupadas.
- **Tinta** (#1E1410; escuro #F5EEE3): texto principal.
- **Tinta Média** (#5E5348; escuro #BFB3A3): texto secundário (6.9:1 / 9.2:1).
- **Tinta Clara** (#8E8273; escuro #8A7F70): só 3.5:1 sobre o creme no tema claro. Serve para ícone, texto grande ou placeholder, nunca para texto informativo em tamanho normal.
- **Linha / Divisor** (#E8DCCB, #F0E7DA; escuro #352F27, #2B261F): bordas e divisores decorativos. Não têm contraste para delimitar um controle sozinhos.

### Status
- **Sucesso** (#2E7D32), **Erro** (#C62828): passam 4.5:1 sobre o creme.
- **Aviso** (#F57F17): só 2.5:1 sobre o creme. Não usar como cor de texto nem de ícone sozinho no tema claro.

### Categorias (opção B, aprovada em 22/11/2026)
As 8 categorias mantêm suas famílias de cor, em versões com contraste garantido, definidas em `mobile/src/shared/theme/categorias.ts` e lidas por `corDaCausa(theme, id)`:
- **Claro:** tons escuros (700) com texto branco sobre eles (≥ 5:1) e legíveis como ícone sobre creme, folha e papel pardo (≥ 4.2:1).
- **Escuro:** tons claros (400) com texto `#12100D` sobre eles (≥ 6.3:1) e legíveis sobre o fundo escuro (≥ 5.3:1).
- São as únicas cores de fora da paleta, aceitas de propósito e só para categoria. A cor de `markerConfig.ts` espelha o backend e não vai para a interface.
- O teste `categorias.spec.ts` calcula esses contrastes; uma cor nova que não passe quebra o teste.

### Tons derivados (do tema, nunca fixos no componente)
- **Véu** (Tinta a 64%): fundo de reserva sob texto branco em cima de foto. Pior caso, foto branca: 5.4:1.
- **Sobre o véu** (branco e branco a 90%): texto e ícones do painel de vidro e dos selos sobre foto.
- **Contorno forte** (= Tinta Média): borda de controle que precisa de 3:1 (botão contornado, agrupamento no mapa). `Linha` continua decorativa.
- **Elevação tonal** (níveis 1–5 = Folha e Papel Pardo): substitui o lilás padrão do Material 3, que vazava em cartões e no tema escuro.

### Named Rules
**The Fixed Palette Rule.** Nenhum valor de `colors.ts` muda. Tons derivados (opacidade, estado de toque) só saem de um token existente, só quando fizerem falta, e cada um é registrado aqui com o motivo.

**The Theme-Only Rule.** Toda cor chega ao componente por `useAppTheme()`. Nenhum hexadecimal ou `rgba` fixo em tela ou componente.

**The Word-and-Icon Rule.** Status (ativo, em análise, encaminhado, resolvido) e categoria sempre aparecem com ícone ou texto além da cor.

## Typography

**Display Font:** Cardo Bold (marca apenas, carregada em `App.tsx`)
**Body Font:** fonte do sistema (Roboto no Android, San Francisco no iOS)

**Character:** uma serifa clássica para o nome Mutira, como o título escrito à mão na capa do caderno; todo o resto na fonte do sistema, que o público já lê sem esforço.

### Hierarchy
Papéis em `texto`, em `mobile/src/shared/theme/typography.ts`. Use o papel, não um tamanho solto:
- **display** (700, 30/36): telas de entrada.
- **titulo** (700, 22/28): título da tela ou do problema; 20 na barra de topo.
- **tituloSecao** (700, 17/24): seções ("Andamento", "Evidências", "Metas e avisos").
- **corpo / corpoForte** (400 ou 600, 15/22): texto corrido, itens de lista.
- **meta** (400, 13/18): local, datas, contagens.
- **rotulo** (600, 13/18): abas, selos, pílulas de status.
- **botao** (700, 15/20).
- **numero** (800, 20/24): contagens em destaque.

### Named Rules
**The Street-Legible Rule.** Nenhum texto que informe algo abaixo de 13. A escala antiga (`fontSize.xs` = 11) fica só para compatibilidade.

### Named Rules
**The Brand-Face Rule.** Cardo aparece só no nome Mutira. Interface, números e rótulos usam a fonte do sistema.

## Layout

Escala de espaçamento em `mobile/src/shared/theme/spacing.ts`: 4, 8, 12, 16, 24, 32, 48, 64. Margem lateral padrão de 16 (`spacing.three`), uma só: o `ScreenWrapper` recebe a barra de topo em `cabecalho` (de ponta a ponta, cuidando da área segura) e aplica o respiro só ao conteúdo; telas com conteúdo de ponta a ponta usam `respiro={false}`. Alvo mínimo de toque: 48 (`ALVO_MINIMO`). Navegação por três abas inferiores (Mapa, Feed, Perfil) e pilha nativa para o resto. A ação principal de uma tela de detalhe fica numa barra fixa no rodapé, na zona do polegar. Orientação retrato; tablets sem layout próprio ainda.

## Elevation & Depth

Profundidade vem principalmente das camadas de papel: creme no fundo, folha nos cartões, papel pardo nos agrupamentos. Sombras vêm do padrão do React Native Paper (cartões, FAB) e do mapa, com a cor de sombra ligada à Tinta. O feed usa um painel de vidro translúcido sobre a foto, com um fundo escuro de reserva para garantir contraste.

### Named Rules
**The Paper-Layers Rule.** Antes de uma sombra, use um tom de papel. Sombra só para o que flutua de verdade (FAB, folha inferior, marcador no mapa).

## Shapes

Cantos de 12 como padrão (`roundness` do tema), 20 no topo das folhas inferiores, círculos para avatar, distintivos e marcadores. A forma recorrente é o pino do logo: gota com o círculo tracejado do mutirão.

## Components

### Buttons
- **Shape:** cantos de 12, altura mínima de 48, rótulo 15/700.
- **Primary:** preenchido em Mata Atlântica, texto em `onPrimary`.
- **Apoiar:** preenchido em Barro; quando a pessoa já apoia vira "Apoiando" em container da primária, com estado de selecionado para o leitor de tela. Retirar o apoio no Feed mostra "Apoio retirado" com Desfazer.
- **Outlined / Text:** texto em Mata Atlântica; contorno em contorno forte (3:1).
- **States:** os do React Native Paper (ripple no Android).

### Status
- **PilulaStatus** (`shared/ui`): rótulo + ícone + papel semântico (atenção, andamento, sucesso, erro, neutro). A cor vem do papel no tema; status de encaminhamento e de mutirão usam ela.
- **TrilhaStatus** (`problemas/components`): Ativo → Em análise → Encaminhado → Resolvido, cada etapa com ícone e nome; a atual em Barro e negrito; resumo único para o leitor de tela.

### States
- **EmptyState:** ícone em círculo de container, título, explicação e, quando houver, a ação que resolve o vazio.
- **ErrorState:** o que deu errado, a dica só quando for verdadeira para aquele erro, e "Tentar de novo" quando faz sentido.
- **LoadingSpinner:** diz o que está carregando.

### Cards / Containers
- **Corner Style:** 12.
- **Background:** Folha.
- **Shadow Strategy:** padrão do Paper.

### Inputs / Fields
- **Style:** contorno em Linha, foco em Mata Atlântica, placeholder em Tinta Clara.
- **Error:** texto de ajuda do Paper em Erro.

### Navigation
- **Header:** barra de ponta a ponta em Mata Atlântica, 64 de altura mais a área segura, título 20/700, voltar com 48 e nome "Voltar", espaço para ações (menu ⋮).
- **Abas inferiores:** ícones MaterialCommunityIcons; ativa em Mata Atlântica, inativa em Tinta Média, rótulo 13/600.
- **Abas internas (`Tabs`):** 48 de altura, sublinhado de 3 na ativa, papel de aba e estado de selecionada, contagem opcional.
- **Chips de filtro:** 40 de altura com `hitSlop` até 48; papel pardo com nome em tinta e ícone na cor da categoria; selecionado em Mata Atlântica.

### Bottom Sheet
Folha com topo em 20, alça de 40×4 e 24 de respiro. É a prévia do problema no mapa.

### Glass Panel (Feed)
Painel translúcido sobre a foto de capa, com o véu de reserva (Tinta a 64%) sob texto branco, e o botão Apoiar num toque. Abrir o problema e Apoiar são alvos separados. Sem foto, o cartão fica em papel pardo com o ícone grande na cor da categoria. No Perfil, o cartão de identidade usa desfoque só no iOS; no Android e na web é a folha a 90% com borda clara.

### Map Marker
Gramática: ícone + cor = categoria · tamanho = prioridade · número = apoios · selo com ícone = status (quando sai de "ativo"). Cada marcador e agrupamento tem nome para leitor de tela. O desenho fica em `MarcadorVisual`/`ClusterVisual`, usado pelo mapa nativo (`MapaBase.tsx`) e pela versão web sobre grade (`MapaBase.web.tsx`), que existe para testar a tela no navegador.

## Do's and Don'ts

### Do:
- **Do** puxar toda cor de `useAppTheme()`; conferir claro e escuro em toda tela alterada.
- **Do** usar Tinta ou Tinta Média para qualquer texto que informe algo; Tinta Clara só para placeholder, ícone ou texto grande.
- **Do** escrever o status por extenso ou com ícone ao lado da cor.
- **Do** dar a todo alvo de toque pelo menos 44×44 (48×48 no padrão Android), com `hitSlop` quando o visual for menor.
- **Do** manter o fundo escuro de reserva (~58%) sob qualquer texto sobre foto.

### Don't:
- **Don't** alterar valores de `colors.ts` nem trazer cores de fora da paleta.
- **Don't** usar Aviso (#F57F17) ou o cinza "ativo" do mapa (#9AA5B1) como única marca de um estado no tema claro: ficam abaixo de 3:1 sobre o creme.
- **Don't** usar Linha ou Divisor como única borda de um controle interativo.
- **Don't** usar a fonte da marca fora do nome Mutira.
- **Don't** usar emoji como ícone de estado (os estados vazio e de erro fazem isso hoje).

### Estado do sistema (22/11/2026, depois do redesenho de Feed, Perfil, Mapa e Detalhe)
- Sem cores fixas em telas e componentes. As únicas cores literais fora de `colors.ts` são as de categoria (`categorias.ts`) e o espelho do backend em `markerConfig.ts`, que não vai para a interface.
- O app segue o tema claro/escuro do aparelho (`themeSlice` com preferência `system`).
- Pendente: telas de Login, Criar conta, Moderação, Nova mobilização e Detalhe da mobilização receberam só os componentes compartilhados; não passaram por crítica própria. Tablet sem layout próprio.
