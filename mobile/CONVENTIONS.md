# Convenções do Projeto Econexa Mobile

## 1. Estrutura de pastas

Cada feature deve ser autossuficiente. Não registre arquivos em um local central quando eles pertencem apenas a uma feature.

```
src/features/FeatureName/
├── components/     ← componentes de UI exclusivos desta feature
├── api/            ← hooks e chamadas de API (queries e mutations)
├── hooks/          ← lógica de negócio dos componentes
├── utils/          ← funções puras e constantes (sem I/O)
└── helpers/        ← orquestração e I/O: vários passos, integrações, cache
```

- `components/`: UI local da feature.
- `api/`: requisições e integração com backend.
- `hooks/`: regras e estados reutilizáveis.
- `utils/`: transformações puras.
- `helpers/`: código com I/O ou orquestração.

## 2. Padrões de código

### 2.1 Sem lógica no JSX
Toda lógica deve ser extraída antes do `return`.

```tsx
const botaoColor = isDisabled ? 'primary' : 'success';

return <Button color={botaoColor} />;
```

### 2.2 Responsabilidade única por componente
Se um componente renderiza dois estados diferentes, extraia um componente para cada caso.

### 2.3 Renderização dentro do componente
O componente decide se deve renderizar ou não.

### 2.4 Early return
Prefira `if` e `return` ao invés de ternários com efeitos.

```tsx
if (!isVisible) return null;
return <Component />;
```

### 2.5 Handlers nomeados
Extraia handlers antes do `return`.

```tsx
const handlePress = () => setOpen(true);
<Button onPress={handlePress} />
```

### 2.6 Estilos inline preferenciais
Use estilos inline diretamente no componente em vez de `StyleSheet.create`.

- Escolha inline para componentes simples e médios.
- Evite abstrair estilos antes de verificar o padrão real de uso.
- Use objetos de estilo reutilizáveis apenas quando houver duplicação clara.

### 2.7 Constantes estáticas fora do componente
Declare objetos estáticos fora do componente para evitar recriação em cada render.

## 3. Tipagem e passagem de props

Para componentes simples, basta usar tipos claros:

```ts
type SelectOption = { label: string; value: string | number };

export type SelectProps = {
  label: string;
  value: string | number;
  onValueChange: (value: string | number) => void;
  options: SelectOption[];
};
```

Não use `Props` antigos como nome de tipo genérico. Use `type` e tipagem direta.

## 4. Estado global

Use Redux Toolkit para:
- login/usuário
- tema (light/dark)
- preferências do app
- estado global compartilhado

Use `react-query` para dados remotos e cache.

## 5. Tema e estilo

Centralize cores e tokens em `src/shared/theme/`.
Use um único provider para tema e evite cores hard-coded no app.

## 6. Componentes comuns

Crie componentes globais em `src/shared/ui/`:
- `Button`
- `TextInput`
- `Select`
- `Header`
- `Footer`
- `ScreenWrapper`

Esses componentes devem ser theme-aware e fáceis de alterar.

## 7. Boas práticas

- `utils/`: funções puras sem efeitos.
- `helpers/`: funções com vários passos ou I/O.
- `api/`: requests e integração com backend.
- `hooks/`: lógica de estado e regras reutilizáveis.
