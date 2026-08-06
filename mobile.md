# Mobile do Mutira

Este documento organiza a parte mobile com foco em clareza e crescimento controlado.

## 1. Papel do app mobile

O app mobile precisa ser simples e direto. Ele deve permitir:
- login e visualização de perfil;
- registro de problemas;
- apoio a problemas;
- visualização de mutirões e eventos;
- envio de dados com boa experiência.

## 2. Estrutura recomendada

```text
src/
├── app/
├── common/
├── modules/
│   ├── auth/
│   ├── problems/
│   ├── supports/
│   ├── mutiroes/
│   └── events/
├── services/
└── store/
```

## 3. Regras de arquitetura mobile

### Telas devem ser simples
As telas em `pages/` devem receber dados e chamar ações. Elas não devem conter regra complexa.

### Lógica fica em hooks
A lógica de API, formulário e estado parcial deve ficar em hooks.

### API fica isolada por módulo
Cada módulo tem a sua camada de chamadas HTTP.

### Estado global mínimo
Use o estado global somente para:
- sessão de usuário;
- perfil;
- preferências de app.

Para dados de servidor, use consultas remotas com cache simples.

## 4. Exemplo de fluxo de problema

```text
Tela -> Hook -> API -> Backend
```

O fluxo ideal é:
1. a tela chama o hook;
2. o hook executa a ação;
3. a camada de API envia a requisição;
4. o backend responde.

## 5. Regras de UX para o MVP

- telas curtas e objetivas;
- fluxo de cadastro de problema em poucos passos;
- feedback claro para sucesso ou erro;
- evitar telas com excesso de opções no início.

## 6. O que evitar

- colocar fetch direto dentro de componentes;
- misturar lógica de mapa, formulário e navegação na mesma tela;
- criar componentes genéricos demais antes de provar o uso real.

## 7. Caminho de implementação

1. autenticação básica;
2. tela de mapa ou lista de problemas;
3. cadastro de problema;
4. apoio ao problema;
5. mutirão e eventos simples.

Essa sequência é suficiente para entregar valor sem aumentar demais a complexidade.
