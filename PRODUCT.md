# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

Android primeiro, com uma identidade de marca única. O mesmo código Expo (React Native) também gera iOS e web; a versão web serve para testes e para checagens que precisam da tela renderizada, não é um produto à parte. Em iOS, respeitar área segura e gestos do sistema sem criar uma segunda linguagem visual.

## Users

- **Cidadãos** da Grande São Paulo que querem agir no próprio bairro. Usam o app no celular, muitas vezes na rua, com sol na tela e às vezes só uma mão livre. Público amplo: idades, escolaridades e familiaridade com tecnologia variadas. O trabalho deles é relatar um problema onde está, ver o que já existe perto, apoiar o dos outros, mandar evidências, organizar ou entrar num mutirão e acompanhar o que aconteceu depois.
- **Admins (moderadores)** que revisam denúncias de conteúdo e decidem o que fica no ar.

Público futuro, fora do piloto: especialistas que validam problemas e organizações ou coletivos que se mobilizam por uma causa. Não desenhar para eles agora.

## Product Purpose

Mutira transforma um problema urbano ou ambiental (buraco, praça sem luz, lixo, risco de deslizamento) num ponto no mapa que outras pessoas podem ver, apoiar e empurrar até a resolução: `ativo` → `em_analise` → `encaminhado` → `resolvido`. Existe porque as pessoas sentem o problema, mas não sabem onde denunciar, não veem o tamanho coletivo dele e raramente veem resultado; o engajamento morre na indignação solitária.

Sucesso é a pessoa relatar em poucos toques, ver que não está sozinha (apoios, mobilizações) e acompanhar o encaminhamento até o órgão responsável.

## Positioning

O mapa é a leitura viva do território, não um mapa com pins. Ele tem uma gramática própria: tipo = ícone + cor, estado = anel/borda, prioridade = tamanho do marcador, status = sobreposição (resolvido, em análise). Pontos próximos viram agrupamentos que mostram a distribuição por categoria, não só um contador. Tocar num ponto abre uma prévia em folha inferior com a barra de mobilização, não uma navegação imediata. Além de relatar, o Mutira organiza mobilizações (mutirões) e acompanha encaminhamentos a órgãos públicos.

## Operating Context

- Piloto em São Paulo capital, Guarulhos, Suzano e Mogi das Cruzes.
- Uso na rua: luz forte, deslocamento, uma mão só, conexão instável, GPS que pode faltar.
- Telas: Login, Criar conta, Esqueci/Redefinir senha, Mapa (aba), Feed (aba), Perfil (aba), Relatar problema, Detalhe do problema, Nova mobilização, Detalhe da mobilização, Moderação, Item da moderação, Excluir conta. Navegação em `mobile/src/navigation/AppNavigator.tsx`.
- Login por e-mail/senha e Google.

## Capabilities and Constraints

- Relatar problema com foto e localização; apoiar em um toque; comentar; enviar evidências; criar e acompanhar mobilizações; acompanhar encaminhamentos; moderação de denúncias por admins; exclusão de conta.
- Stack: Expo (SDK 57), React Native, TypeScript, React Navigation (pilha nativa + abas), Redux Toolkit para estado global, React Query para dados remotos. Convenções em `mobile/CONVENTIONS.md`.
- Todo componente usa o tema via `useAppTheme`; nenhuma cor fixa no código. Tokens em `mobile/src/shared/theme/`, componentes base em `mobile/src/shared/ui/`.
- Textos da interface em português do Brasil, curtos e diretos.
- O backend é dono do domínio (auth, problemas, apoios, denúncias); o app não duplica regra de negócio.

## Brand Commitments

- Nome: **Mutira** (de mutirão). O `app.json` ainda diz "Econexa Mobile"; o nome do produto é Mutira.
- Slogan fixo, pode aparecer no app: **"Transforma ações individuais em ações coletivas."**
- Paleta fixa, definida em `mobile/src/shared/theme/colors.ts` (temas claro e escuro). Não trocar os valores. Tons derivados (opacidades, estados de toque) só a partir deles e só quando fizer falta, com justificativa.
- Logo em `mobile/src/shared/ui/LogoMutira.tsx`.

## Evidence on Hand

- Só dados de teste. Não há fotos reais de denúncias, casos resolvidos, números de impacto nem depoimentos. Nenhum trabalho de design pode inventar depoimentos, contagens, órgãos parceiros ou casos de sucesso.

## Product Principles

1. O mapa é a home. Sempre.
2. Engajamento em um toque (apoiar); profundidade sob demanda.
3. "Perto de você" antes de "em alta no geral".
4. Funciona na rua: legível no sol, alcançável com uma mão, tolerante a falta de GPS e de rede.
5. Mostrar o caminho até o resultado: o status e o encaminhamento de cada problema sempre visíveis.

## Accessibility & Inclusion

WCAG 2.2 AA obrigatório:

- Contraste ≥ 4.5:1 para texto e ≥ 3:1 para ícones e texto grande, inclusive sobre fotos e painéis translúcidos.
- Alvos de toque de no mínimo 44×44 (usar `hitSlop` quando o visual for menor).
- Todo botão, ícone e imagem com nome para leitor de tela; abas com estado de selecionada.
- Nada comunicado só por cor (status no mapa, legenda): sempre ícone ou texto junto.
- O layout aguenta fonte grande do sistema sem cortar texto.
- Animações respeitam "reduzir movimento".
- Temas claro e escuro conferidos em toda tela alterada.
