# Backend do Mutira

Este documento concentra as regras do backend e os padrões mais úteis para o MVP.

## 1. Objetivo do backend

O backend precisa ser simples, previsível e rápido para entregar:
- autenticação e perfis;
- cadastro de problemas;
- apoio da comunidade;
- organização de mutirões e eventos;
- notificações básicas.

## 2. Padrão de organização

Use a estrutura abaixo para cada módulo principal:

```text
src/modules/problems/
├── problems.controller.ts
├── problems.repository.ts
└── services/
    ├── CreateProblem.service.ts
    ├── SupportProblem.service.ts
    └── UpdateProblemStatus.service.ts
```

### Regras
- Controller: não faz regra, só recebe e responde.
- Service: concentra a regra de negócio.
- Repository: concentra o acesso ao banco.
- Se uma ação ficar grande, divida em services menores, mas mantenha a ideia central do módulo.

## 3. Exemplo de fluxo de problema

### Requisição
POST /problems

### Fluxo
1. Controller recebe o corpo.
2. Service valida dados e regras de negócio.
3. Repository salva o problema.
4. O sistema publica uma tarefa assíncrona para processar mídia ou notificação, se necessário.

### Exemplo de service

```ts
export class CreateProblemService {
  constructor(private repository: IProblemRepository) {}

  async execute(input: { title: string; description?: string; lat: number; lng: number }) {
    if (!input.title || input.title.trim().length < 5) {
      throw new Error('Título muito curto');
    }

    return this.repository.create(input);
  }
}
```

## 4. Regras de autenticação e perfil

O sistema de login deve ser simples no MVP:
- email e senha
- perfil básico com papel
- dados mínimos de cadastro

Estrutura recomendada:
- users
- profiles
- roles
- user_roles

Não comece com um sistema de permissões muito complexo. Papel + regra simples resolve bem para a primeira versão.

## 5. Fila para tarefas assíncronas

A fila deve ser usada para tarefas que não precisam bloquear a resposta do usuário.

### Exemplos
- compressão de imagem
- upload para storage
- envio de notificação após criação de problema
- geração de resumo tardio

### Exemplo simples de fluxo

```text
Cliente -> API
  -> salva o problema
  -> enfileira tarefa de processamento
  -> responde imediatamente

Worker -> processa tarefa em segundo plano
```

## 6. Cron para tarefas recorrentes

Use cron apenas para tarefas periódicas e previsíveis.

### Exemplos
- lembrar usuários de mutirões próximos
- enviar resumo diário de problemas ativos
- fechar ou revisar itens sem atividade há X dias

### Regra prática
- se a tarefa precisa ser executada no tempo certo, mas não precisa acontecer na hora da ação, use cron.

## 7. Boas práticas para não exagerar

- não crie fila para tudo;
- não use cron para tarefas de resposta imediata;
- mantenha um worker simples;
- agrupe tarefas por contexto, não por funcionalidade mínima.

## 8. Módulos iniciais sugeridos

- auth
- problems
- supports
- mutiroes
- events
- notifications

O MVP pode começar com auth, problems, supports e mutiroes. Os demais podem entrar depois, sem perder a coerência do sistema.
