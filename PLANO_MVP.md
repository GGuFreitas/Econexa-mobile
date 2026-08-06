# Plano de MVP do Mutira

Este documento organiza um caminho realista para construir o MVP sem criar excesso de arquivos ou complexidade prematura.

## 1. Objetivo do MVP

O MVP precisa permitir que a comunidade:
- faça login e tenha um perfil básico;
- reporte problemas locais;
- receba apoio de outros usuários;
- organize mutirões e eventos simples;
- veja sua ação refletida no sistema.

## 2. Fases recomendadas

### Fase 1 — Fundação
Objetivo: colocar a base do sistema.

Itens:
- autenticação simples
- cadastro de usuário e perfil
- papel básico: cidadão, organizador, moderador
- endpoints básicos de login e consulta de perfil

### Fase 2 — Problemas e apoio
Objetivo: fazer o coração do projeto funcionar.

Itens:
- criar problema com localização
- listar problemas próximos
- apoiar problema
- evitar duplicidade simples de apoio
- status básico: aberto, em andamento, resolvido

### Fase 3 — Mutirões e eventos
Objetivo: transformar apoio em ação coletiva.

Itens:
- criar mutirão simples
- confirmar presença
- criar evento simples
- listar mutirões e eventos próximos

### Fase 4 — Notificações e automação leve
Objetivo: dar retorno ao usuário sem exagerar.

Itens:
- notificação de apoio ou atualização de problema
- lembrete de mutirão/evento
- fila simples para processamento assíncrono
- cron simples para lembretes recorrentes

## 3. Estrutura inicial recomendada

### Backend
```text
src/modules/
├── auth/
├── problems/
├── supports/
├── mutiroes/
├── events/
└── notifications/
```

### Mobile
```text
src/modules/
├── auth/
├── problems/
├── supports/
├── mutiroes/
└── events/
```

## 4. Regras para não fazer overengineering

1. Não crie um novo módulo para cada ação pequena.
2. Não adicione fila para tudo no início.
3. Não use cron para tarefas que precisam responder na hora.
4. Comece com um perfil simples e uma regra de permissões clara.
5. Mantenha os serviços enxutos.
6. Se algo for usado por um único fluxo, não precisa virar abstração complexa.

## 5. Regras de login e perfil

O MVP precisa de um modelo simples:
- users
- profiles
- roles
- user_roles

Exemplo de regras:
- cidadão pode reportar e apoiar;
- organizador pode criar mutirões e eventos;
- moderador pode revisar conteúdo;
- admin administra o sistema.

### O que entra no MVP
- cadastro e login simples
- recuperação de senha básica via email
- perfil com foto opcional
- nome público ou apelido simples

### O que fica para depois
- sistema de petição para enviar email automático ao órgão público
- criação de emails anônimos com identidade totalmente oculta
- rede social completa com seguidores, posts e feed avançado
- funcionalidades muito sofisticadas de relacionamento entre usuários

## 6. Regras de fila e cron

### Fila
Use fila apenas para:
- processamento de imagem
- envio de notificações demoradas
- ações que não precisam bloquear a resposta

### Cron
Use cron apenas para:
- lembretes periódicos
- resumos diários
- limpeza simples

## 7. Caminho prático para execução

1. Implementar auth e perfil.
2. Implementar cadastro e listagem de problemas.
3. Implementar apoio a problemas.
4. Implementar mutirões básicos.
5. Implementar eventos básicos.
6. Adicionar notificações simples.

Esse caminho entrega valor real sem virar um sistema excessivamente complexo.