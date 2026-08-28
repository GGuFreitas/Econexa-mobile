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

Monolito modular por feature. Estrutura real do projeto:

```text
src/
├── config/      # env, pool do banco, knexfile, migrations
├── shared/      # primitivos: errors, auth, http, validate, cache, queue
├── common/      # blocos reutilizáveis: auth/, imagens/, abilities.ts
├── features/    # domínio: problemas, peticoes, mutiroes, apoios, eventos, usuarios, regioes, niveis
├── routes/      # fios HTTP por feature (routes/<feature>/index.ts)
└── workers/     # reservado para BullMQ (fase futura)
```

### Regras
- `routes/<feature>/index.ts`: adaptador HTTP — valida com zod (`@shared/validate`), chama o handler, responde com `ok/created` (`@shared/http`). Nada de regra de negócio.
- `features/<feature>/`: regra de negócio em handlers funcionais (`handler.ts` + `.sql.ts`). Sem classes, sem DI, sem framework.
- `common/`: building blocks transversais (auth, imagens, permissões). Não são features de domínio.
- `shared/`: utilidades sem dependência de domínio.
- Seams para evoluir sem reescrita: `shared/cache.ts` (interface `Cache` → `MemoryCache` hoje, Redis depois) e `shared/queue.ts` (interface `Queue` → `SyncQueue` hoje, BullMQ depois).
- Cross-feature leve: chama o `.sql` de outra feature. Cross-feature pesada: `queue.enqueue(...)`. Nenhuma feature importa o `routes/` de outra.

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

- `zod` (v4) para validação de `env` e payloads;
- `fastify` (v5) para API leve;
- `@fastify/cors` para controle de origens;
- `@fastify/compress` para compressão;
- `pg` para Postgres (pool em `config/database.ts`);
- `knex` para migrations;
- `@node-rs/argon2` para hash de senha (substitui bcrypt);
- `jsonwebtoken` para tokens;
- `vitest` para testes;
- `tsx` para rodar TS em dev.

## 9. Boas práticas para não exagerar

- não crie fila para tudo;
- não use cron para tarefas de resposta imediata;
- mantenha um worker simples;
- agrupe tarefas por contexto, não por funcionalidade mínima.

## 10. Módulos iniciais sugeridos

- auth (em `common/auth`)
- problemas
- peticoes
- apoios (antes "supports")
- mutiroes
- eventos
- regioes
- niveis

O MVP pode começar com auth, problemas, apoios e mutiroes. Os demais podem entrar depois, sem perder a coerência do sistema.
