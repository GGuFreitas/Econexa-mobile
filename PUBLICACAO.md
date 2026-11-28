# Publicação do app na Play Store

Checklist do que **não é código** para colocar o app em produção. O código já está
pronto nas branches `fix/mobile-dependencia-secure-store` (#58),
`feat/mobile-redesign-impeccable`, `chore/mobile-config-producao` e
`feat/pagina-privacidade`.

Siga na ordem: cada etapa usa algo produzido pela anterior.

## Etapa 0 — Decisões que travam o resto

- [ ] **Nome do app.** Fica em `IDENTIDADE.nome` no `mobile/app.config.ts` (hoje `Mutira`).
      Pode mudar depois do lançamento.
- [ ] **ID do app** (`IDENTIDADE.id`, hoje `br.com.mutira`). **Não muda depois do primeiro
      envio à Play.** A convenção é o domínio ao contrário (`mutira.app.br` → `br.app.mutira`).
      Os clients OAuth e a chave do Maps são cadastrados com esse ID.
- [ ] **Domínio.** São necessários dois nomes: um para a API (`DOMINIO_API`) e outro para
      os arquivos (`DOMINIO_ARQUIVOS`). Opções: um domínio próprio (ex.: `.app.br` no
      registro.br) ou subdomínios gratuitos (DuckDNS), que servem bem para testes.
- [ ] **E-mail de privacidade** (`CONTATO_PRIVACIDADE`): aparece na política e na página de
      exclusão de conta.

## Etapa 1 — Mergear o código

1. #58: repõe dependências que faltam no master.
2. Redesign (`feat/mobile-redesign-impeccable`).
3. `chore/mobile-config-producao` (este arquivo vem junto).
4. `feat/pagina-privacidade`.

## Etapa 2 — Backend no ar

1. Servidor com Docker; registros DNS A/AAAA de `DOMINIO_API` e `DOMINIO_ARQUIVOS`
   apontando para ele.
2. `.env.prod` a partir de `.env.prod.example`: segredos gerados, SMTP real,
   `CONTATO_PRIVACIDADE`. `GOOGLE_CLIENT_IDS` fica para a Etapa 3.
3. `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build`.
4. Conferir no navegador:
   - `https://<DOMINIO_API>/api/conta/privacidade` → URL da política para a Play.
   - `https://<DOMINIO_API>/api/conta/exclusao` → URL de exclusão de conta para a Play.

## Etapa 3 — Google Cloud (OAuth e Maps)

Tudo no **mesmo projeto** do Google Cloud.

1. **Client OAuth "Aplicativo da Web".** O ID dele vai em **dois** lugares:
   `GOOGLE_CLIENT_IDS` no `.env.prod` do backend e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no EAS.
   O backend valida o token contra esse ID, porque o app pede o token em nome do client Web.
2. **Clients OAuth "Android"**, um por SHA-1, todos com o ID do app. Os IDs deles **não vão
   para nenhuma variável**: basta existirem no projeto.
   - SHA-1 do EAS (Etapa 4, passo 2).
   - SHA-1 da Play (Etapa 5, passo 2).
3. **Chave do Maps:** ative a *Maps SDK for Android* (o projeto precisa de faturamento
   ativado; o mapa nativo não é cobrado) → Credenciais → Criar chave de API.
   - Restrição de aplicativo: Android, com o ID do app + os dois SHA-1.
   - Restrição de API: só *Maps SDK for Android*.

## Etapa 4 — EAS (build)

Dentro de `mobile/`:

1. `npm i -g eas-cli`, `eas login` e `eas init`. Como a config é dinâmica, o `init` pode
   pedir para gravar o `projectId` à mão: coloque `"extra": { "eas": { "projectId": "<id>" } }`
   e `"owner": "<sua conta>"` dentro de `expo` no `app.json` e commite.
2. `eas credentials` → Android → production → gerar keystore. Anote o **SHA-1 do EAS**.
3. Variáveis do ambiente de produção:
   ```sh
   eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://<DOMINIO_API>/api --visibility plaintext
   eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <client Web> --visibility plaintext
   eas env:create --environment production --name GOOGLE_MAPS_ANDROID_API_KEY --value <chave> --visibility sensitive
   ```
   O build de produção **falha de propósito** se faltar a URL da API, se ela não for HTTPS
   ou se faltar a chave do Maps.
4. `eas build -p android --profile production` gera um `.aab`.

## Etapa 5 — Play Console

1. Criar o app e subir o `.aab` na trilha de **teste interno**.
2. Testar e lançar → Configuração → Integridade do app → Assinatura de apps: copiar o
   **SHA-1 da chave de assinatura do app** e cadastrar na Etapa 3 (client Android + chave
   do Maps). O "certificado da chave de upload" deve bater com o SHA-1 do EAS.
3. Ficha da loja:
   - Ícone 512×512 em `mobile/assets/loja-icone-512.png`.
   - Imagem de destaque 1024×500.
   - Pelo menos 2 capturas de tela.
   - Descrições curta e completa.
4. Conteúdo do app:
   - Política de privacidade e exclusão de conta: as URLs da Etapa 2.
   - Segurança dos dados: declarar nome, e-mail, ID de usuário, localização aproximada
     e precisa, fotos e conteúdo gerado pelo usuário. Nada é usado para publicidade nem
     vendido; os dados trafegam criptografados; o usuário pode pedir a exclusão.
   - Classificação de conteúdo: o app tem conteúdo gerado por usuários, com moderação e
     denúncia.
   - Público-alvo: 13+.
5. **Conta pessoal nova:** a Google exige um teste fechado com 12 testadores por 14 dias
   antes de liberar a produção. Contas de organização (CNPJ) não têm essa exigência.
6. Depois disso, `eas submit -p android --profile production` envia os próximos builds.

## Teste antes da loja

`eas build -p android --profile preview` gera um APK para instalar direto no celular.
Configure as mesmas variáveis com `--environment preview`. O build `preview` não tem as
travas de produção.
