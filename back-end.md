# Backend do Mutira

Este documento concentra as regras do backend e os padrões mais úteis para o MVP.

## 1. Objetivo do backend

O backend precisa ser simples, previsível e rápido para entregar:
- autenticação e perfis;
- cadastro de problemas;
- apoio da comunidade;
- organização de mutirões e eventos;
- notificações básicas;
- integração com IA via Google API quando necessário.

## 2. Variáveis de ambiente

O backend usa `dotenv` e valida com `zod`. As variáveis obrigatórias são:

- `NODE_ENV`: `development`, `test` ou `production`
- `PORT`: porta do servidor
- `DATABASE_URL`: conexão Postgres
- `CORS_ORIGINS`: origens permitidas separadas por vírgula
- `GOOGLE_API_KEY`: chave da API gratuita do Google para IA

O arquivo de exemplo está em `back-end/.env.example`.

## 3. Padrão de organização

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

## 4. Fluxo de integração com Google AI

1. O frontend envia uma solicitação ao backend.
2. O backend valida e autoriza a requisição.
3. O backend chama a API do Google usando `GOOGLE_API_KEY`.
4. O backend devolve o resultado ao cliente.

Use este padrão para:
- gerar textos e resumos;
- classificar problemas;
- sugerir categorias ou respostas automáticas;
- enriquecer notificações.

### Exemplo de chamada

```ts
const response = await fetch('https://googleapis.com/v1/your-endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.GOOGLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: '...' }),
});
```

## 5. Regras de autenticação e perfil

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

## 6. Fila para tarefas assíncronas

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

## 7. Cron para tarefas recorrentes

Use cron apenas para tarefas periódicas e previsíveis.

### Exemplos
- lembrar usuários de mutirões próximos
- enviar resumo diário de problemas ativos
- fechar ou revisar itens sem atividade há X dias

### Regra prática
- se a tarefa precisa ser executada no tempo certo, mas não precisa acontecer na hora da ação, use cron.

## 8. Bibliotecas recomendadas

- `zod` para validação de `env` e payloads;
- `fastify` para API leve;
- `fastify-autoload` para rotas modulares;
- `pg` para Postgres;
- `@fastify/cors` para controle de origens;
- `dotenv` para carregar variáveis de ambiente.

## 9. Boas práticas para não exagerar

- não crie fila para tudo;
- não use cron para tarefas de resposta imediata;
- mantenha um worker simples;
- agrupe tarefas por contexto, não por funcionalidade mínima.

## 10. Módulos iniciais sugeridos

- auth
- problems
- supports
- mutiroes
- events
- notifications

O MVP pode começar com auth, problems, supports e mutiroes. Os demais podem entrar depois, sem perder a coerência do sistema.
