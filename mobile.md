# Mobile do Econexa

Este documento descreve a arquitetura mobile e as convenções do app Expo.

## 1. Objetivo do app

O app deve ser uma experiência simples, escalável e fácil de manter. Ele deve suportar:
- login e sessão do usuário;
- perfil e preferências;
- cadastro de problemas;
- apoio a problemas;
- visualização e participação em mutirões;
- notificações e telas de status.

## 2. Estrutura recomendada

```text
src/
├── features/
│   ├── auth/
│   ├── problems/
│   ├── supports/
│   ├── mutiroes/
│   └── events/
├── shared/
│   ├── hooks/
│   ├── theme/
│   ├── ui/
│   ├── utils/
│   └── services/
├── store/
├── navigation/
└── app.tsx
```

Cada feature deve ser autossuficiente e conter seus próprios componentes, hooks, API e helpers.

## 3. Providers e arquitetura raiz

No `app.tsx` o app deve montar os providers principais:
- `ReduxProvider` para estado global de login e tema;
- `PaperProvider` para tema visual;
- `QueryClientProvider` para cache e dados remotos;
- `NavigationContainer` para rotas.

Esse padrão é o mesmo usado nos frontends existentes, adaptado para mobile.

## 4. Estado global

Use Redux Toolkit para o estado global que precisa estar disponível em todo o app:
- login do usuário (`auth`);
- tema claro/escuro (`theme`);
- preferências do app (`ui`);
- loading global e mensagens.

Para dados remotos, use `react-query` em vez de Redux.

## 5. Tema e design

Centralize as cores e tokens em `src/shared/theme/`.
Use o tema para:
- cores principais e secundárias;
- backgrounds e superfícies;
- espaçamentos;
- bordas e tipografia.

Isso permite trocar o design e ativar dark mode de forma simples.

## 6. Componentes comuns

Coloque em `src/shared/ui/` os componentes globais:
- `Button`
- `TextInput`
- `Select`
- `Header`
- `Footer`
- `ScreenWrapper`
- `PageTitle`

Esses componentes devem ser theme-aware e paramétricos, para garantir consistência.

## 7. Convenções de feature

Use a mesma estrutura de feature que você propôs:

```text
feature/
├── components/
├── api/
├── hooks/
├── utils/
└── helpers/
```

- `components/`: UI local da feature.
- `api/`: chamadas HTTP.
- `hooks/`: lógica de estado e comportamento.
- `utils/`: funções puras e constantes.
- `helpers/`: orquestração ou I/O.

## 8. Formulários

Use `react-hook-form` com `zod` para validação.
Para acelerar, crie componentes de formulário reutilizáveis e use `Controller` apenas onde necessário.

## 9. Header e Footer

Crie um `Header` e um `Footer` globais em `src/shared/ui/`.
Eles devem ser fáceis de personalizar e trocar em um só lugar.

## 10. Evitar acoplamento

- `api/` deve concentrar apenas requests;
- `hooks/` deve conter lógica de negócio e estado;
- `utils/` deve ser apenas funções puras;
- `helpers/` é onde a orquestração acontece.

## 11. Nomenclatura de props

Não use `Props` genérico para tipar componentes. Use tipos claros ou `type` e nome específico.
Por exemplo:

```ts
type LoginFormProps = {
  onSubmit: (data: LoginFormData) => void;
};
```

Isso deixa o código mais legível e fácil de manter.

## 12. Fluxo de autenticação

1. Tela de login chama `useLogin`.
2. `useLogin` executa a API e atualiza `authSlice`.
3. O token fica no Redux para acesso global.
4. `authSlice` expõe selectors para `user` e `token`.

## 13. Plano inicial

1. Criar a base de providers em `app.tsx`.
2. Criar `store/authSlice.ts` e `store/themeSlice.ts`.
3. Criar componentes globais em `shared/ui/`.
4. Criar `features/auth/` com `LoginForm`, `useLogin` e `login.ts`.
5. Criar o `Header`, `Footer` e um layout de tela comum.
6. Criar `CONVENTIONS.md` no root do mobile.

## 14. O que fazer depois

- Implementar telas de problemas e mutirões;
- Adicionar navegação com `react-navigation`;
- Criar `services/api.ts` com baseURL e interceptors;
- Criar `shared/theme` com light/dark;
- Adicionar testes básicos se desejar.
