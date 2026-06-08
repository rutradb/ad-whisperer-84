# Google Ads Manager Hub — Manual Completo de Instalacao

**Versao**: 1.0
**Ultima atualizacao**: Abril 2026

Este manual ensina como colocar o Google Ads Manager Hub no ar, do zero ate funcionando com dados reais. Siga cada passo na ordem. Nao pule nenhum.

**Tempo total estimado**: 20-30 minutos

---

## ANTES DE COMECAR

Voce vai precisar de:

1. **Uma conta Google pessoal** (Gmail). NAO use conta corporativa (@suaempresa.com) — contas corporativas podem ter restricoes que impedem o funcionamento.
2. **Um cartao de credito** — para ativar o Google Cloud. NAO cobra nada (free tier). O cartao e necessario apenas para verificacao.
3. **Acesso ao Google Ads** — a conta de anuncios que voce quer gerenciar. Se voce usa uma conta MCC (gerenciador), tenha em maos o ID dela.
4. **O projeto Remix no Lovable** — voce ja deve ter feito o Remix do projeto no Lovable.

---

## PARTE 1 — GOOGLE CLOUD CONSOLE

A Google Cloud Console e onde voce cria as credenciais de acesso. Voce vai criar um "projeto" que permite sua plataforma se comunicar com o Google Ads.

### Passo 1.1 — Acessar o Google Cloud Console

1. Abra o navegador Google Chrome (recomendado)
2. Acesse: **console.cloud.google.com**
3. Se voce nao esta logado, clique em **"Fazer login"**
4. Faca login com sua **conta Gmail pessoal** (ex: seunome@gmail.com)
5. Se aparecer uma tela de **"Termos de Servico"**, marque a caixa de aceite e clique em **"Concordar e continuar"**
6. Voce vai cair na pagina inicial do Google Cloud Console

**O que voce deve ver**: Uma tela com o logo do Google Cloud, um menu lateral, e possivelmente uma mensagem de boas-vindas.

### Passo 1.2 — Criar um projeto novo

Um "projeto" no Google Cloud e como uma pasta que organiza suas credenciais e APIs.

1. No **topo da pagina**, voce vera um texto que diz o nome de um projeto (pode ser "My First Project" ou "Selecionar projeto"). **Clique nele.**
2. Uma janela/modal vai abrir mostrando seus projetos
3. No canto superior direito dessa janela, clique em **"NOVO PROJETO"** (ou "NEW PROJECT")
4. Na tela que abrir:
   - **Nome do projeto**: Digite `Google Ads Proxy` (ou qualquer nome que quiser)
   - **Organizacao**: Deve aparecer **"Sem organizacao"** ou **"No organization"**. Se aparecer o nome de uma empresa, PARE e use outra conta Google (pessoal)
   - **Local**: Deixe como esta
5. Clique no botao **"CRIAR"** (ou "CREATE")
6. Aguarde 5-10 segundos. Uma notificacao vai aparecer dizendo que o projeto foi criado
7. **IMPORTANTE**: Clique na notificacao ou volte ao seletor de projetos no topo e **selecione o projeto que acabou de criar**. O nome dele deve aparecer no topo da pagina

**Como confirmar**: No topo da pagina, ao lado do logo do Google Cloud, deve aparecer o nome "Google Ads Proxy" (ou o nome que voce escolheu).

### Passo 1.3 — Ativar o faturamento (billing)

O Google Cloud precisa de um cartao de credito cadastrado para ativar APIs. Nao vai cobrar nada — o Cloud Run tem um free tier de 2 milhoes de requisicoes por mes.

1. No menu lateral esquerdo, clique em **"Faturamento"** (ou "Billing")
   - Se nao encontrar, clique no icone de menu (tres linhas horizontais) no canto superior esquerdo para expandir o menu
2. Se ja tiver uma conta de faturamento vinculada, pule para o Passo 1.4
3. Se nao tiver, clique em **"VINCULAR CONTA DE FATURAMENTO"** (ou "LINK BILLING ACCOUNT")
4. Se nao tiver nenhuma conta de faturamento:
   a. Clique em **"CRIAR CONTA DE FATURAMENTO"** (ou "CREATE BILLING ACCOUNT")
   b. Selecione seu pais: **Brasil**
   c. Aceite os termos
   d. Clique em **"Continuar"**
   e. Preencha o formulario:
      - Tipo de conta: **Individual** (ou Empresa, tanto faz)
      - Nome: Seu nome
      - Endereco: Seu endereco
   f. Na secao de pagamento, insira os dados do seu **cartao de credito**
   g. Clique em **"Iniciar avaliacao gratuita"** ou **"Enviar e ativar faturamento"**
5. Apos criar, vincule a conta de faturamento ao projeto "Google Ads Proxy"

**Como confirmar**: Na pagina de Faturamento, o projeto "Google Ads Proxy" deve aparecer como vinculado.

### Passo 1.4 — Ativar a Google Ads API

Agora voce vai ativar a API que permite sua plataforma se comunicar com o Google Ads.

1. No menu lateral esquerdo, clique em **"APIs e Servicos"** (ou "APIs & Services")
2. Clique em **"Biblioteca"** (ou "Library")
3. Na barra de busca que aparece no topo, digite: **Google Ads API**
4. Nos resultados, clique no card **"Google Ads API"** (tem o icone azul do Google Ads)
5. Na pagina da API, clique no botao azul grande **"ATIVAR"** (ou "ENABLE")
6. Aguarde alguns segundos ate a pagina mudar, mostrando que a API foi ativada

**Como confirmar**: A pagina vai mudar para um painel com graficos (vazios) e o texto "API ativada" ou "API enabled".

---

## PARTE 2 — CONFIGURAR O OAUTH (AUTORIZACAO)

O OAuth e o sistema que permite que os usuarios da sua plataforma autorizem o acesso a conta Google Ads deles. Voce vai configurar isso agora.

### Passo 2.1 — Acessar a Google Auth Platform

1. No menu lateral esquerdo, clique em **"APIs e Servicos"** (ou "APIs & Services")
2. Clique em **"Tela de consentimento OAuth"** (ou "OAuth consent screen")
3. Duas coisas podem acontecer:
   - **Opcao A**: Aparece uma tela perguntando o tipo de usuario. Selecione **"Externo"** e clique **"CRIAR"**
   - **Opcao B**: Voce e redirecionado direto para a **"Google Auth Platform"** com um menu lateral mostrando: Visao geral, Branding, Publico-alvo, Clientes, etc.
4. Se caiu na Opcao A, apos clicar "CRIAR", voce vai para a pagina da Google Auth Platform
5. Se apareceu uma mensagem **"Configuracao do OAuth criada"**, esta tudo certo — siga para o proximo passo

### Passo 2.2 — Configurar Branding

1. No menu lateral da Google Auth Platform, clique em **"Branding"**
2. Se os campos estiverem vazios, preencha:
   - **Nome do app**: `Google Ads Manager` (ou o nome que quiser mostrar aos usuarios)
   - **E-mail de suporte do usuario**: Selecione ou digite seu email
3. Role a pagina ate o final
4. Preencha **"E-mails do desenvolvedor"**: Digite seu email
5. Clique em **"SALVAR"**

**Se os campos ja estiverem preenchidos**, nao precisa alterar nada.

### Passo 2.3 — Adicionar Publico-alvo (usuarios de teste)

Enquanto o app nao for verificado pelo Google (que nao e necessario), apenas emails cadastrados como "testadores" podem usar o login. Voce pode adicionar quantos quiser.

1. No menu lateral, clique em **"Publico-alvo"** (ou "Audience")
2. Clique em **"ADD USERS"** ou **"Adicionar usuarios"**
3. Digite o email da pessoa que vai usar a plataforma
   - Se voce mesmo vai usar: seu email pessoal
   - Se e um cliente: o email do cliente
   - Voce pode adicionar multiplos emails (um por vez)
4. Clique em **"ADICIONAR"** ou **"ADD"**
5. Clique em **"SALVAR"**

**IMPORTANTE**: Qualquer pessoa que for usar a plataforma precisa ter o email cadastrado aqui. Se alguem tentar conectar e nao estiver na lista, vai receber um erro "Acesso bloqueado".

### Passo 2.4 — Configurar Acesso a dados (escopos)

1. No menu lateral, clique em **"Acesso a dados"** (ou "Data access")
2. Clique em **"ADICIONAR OU REMOVER ESCOPOS"** (ou "ADD OR REMOVE SCOPES")
3. Um painel lateral vai abrir
4. Na barra de busca do painel, digite: **adwords**
5. Nos resultados, marque o checkbox ao lado de: `https://www.googleapis.com/auth/adwords`
6. Clique em **"ATUALIZAR"** (ou "UPDATE") no final do painel
7. Clique em **"SALVAR"** na pagina principal

### Passo 2.5 — Criar o Cliente OAuth (SUAS CREDENCIAIS)

Este e o passo mais importante. Voce vai criar o Client ID e Client Secret que sua plataforma usa para se comunicar com o Google.

1. No menu lateral, clique em **"Clientes"** (ou "Clients")
2. Clique em **"CREATE CLIENT"** ou **"Criar um cliente OAuth"**
3. Preencha:
   - **Tipo de aplicativo**: Selecione **"Aplicativo da Web"** (ou "Web application")
   - **Nome**: Digite `Google Ads Proxy`
4. Em **"Origens JavaScript autorizadas"**: DEIXE VAZIO (nao precisa preencher)
5. Em **"URIs de redirecionamento autorizados"**:
   a. Clique em **"+ ADICIONAR URI"** (ou "+ ADD URI")
   b. Digite: `http://localhost:8080/auth/callback`
   c. (Este e temporario — voce vai trocar depois. E necessario para criar o cliente.)
6. Clique em **"CRIAR"** (ou "CREATE")

### Passo 2.6 — COPIAR O CLIENT SECRET (ATENCAO!)

Apos clicar "Criar", uma janela/modal vai aparecer mostrando:

- **ID do cliente** (Client ID): algo como `1012557761729-xxxx.apps.googleusercontent.com`
- **Chave secreta do cliente** (Client Secret): algo como `GOCSPX-xxxxxxx`

**ATENCAO MAXIMA**: A chave secreta (Client Secret) SO APARECE NESTA TELA, UMA UNICA VEZ. Se voce fechar essa janela sem copiar, NUNCA MAIS vai conseguir ver a chave. Voce teria que gerar uma nova.

**O que fazer AGORA**:

1. **Opcao A (recomendada)**: Clique no botao **"Baixar o JSON"** (ou "Download JSON"). Isso salva um arquivo com todas as informacoes. Guarde esse arquivo em local seguro.

2. **Opcao B**: Copie manualmente os dois valores e cole em um bloco de notas:
   ```
   Client ID: ___________________________________________
   Client Secret: ________________________________________
   ```

3. **So depois de copiar/baixar**, clique em **"OK"** para fechar a janela

**Se voce ja fechou a janela sem copiar o secret**:
1. Volte para **"Clientes"** no menu lateral
2. Clique no nome do seu cliente ("Google Ads Proxy")
3. Procure o botao **"Adicionar chave secreta"** ou **"Add Secret"**
4. Clique nele para gerar uma NOVA chave secreta
5. Copie a nova chave IMEDIATAMENTE

---

## PARTE 3 — OBTER O DEVELOPER TOKEN DO GOOGLE ADS

O Developer Token e uma chave que autoriza sua plataforma a usar a Google Ads API. Ele e obtido dentro do proprio Google Ads.

### Passo 3.1 — Acessar o Google Ads

1. Abra uma nova aba no navegador
2. Acesse: **ads.google.com**
3. Faca login com a conta que tem acesso as campanhas de anuncios
   - Esta conta pode ser diferente da conta pessoal que voce usou no Google Cloud Console — tudo bem

### Passo 3.2 — Encontrar o Developer Token

1. No menu superior do Google Ads, clique no icone de **chave inglesa** (Ferramentas e Configuracoes)
   - Em algumas versoes, pode ser um icone de engrenagem
2. No menu que abrir, procure a secao **"Configuracao"** ou **"Setup"**
3. Clique em **"Central de API"** (ou "API Center")
4. Na pagina que abrir, voce vera:
   - **Token de desenvolvedor**: Uma string como `zusqUh_bo8Rhi6R8DtpzFg`
   - **Nivel de acesso**: Pode ser "Conta de teste", "Acesso basico" ou "Acesso padrao"
5. **Copie o Token de desenvolvedor** e cole no mesmo bloco de notas

**SOBRE O NIVEL DE ACESSO**:
- **"Conta de teste"**: Funciona, mas so permite gerenciar contas de teste. Para contas reais, voce precisa solicitar upgrade clicando em "Solicitar acesso basico". O processo pode levar alguns dias.
- **"Acesso basico"**: Perfeito. Funciona com contas reais.
- **"Acesso padrao"**: Perfeito. Sem restricoes.

### Passo 3.3 — Anotar o Login Customer ID (MCC)

1. Ainda no Google Ads, olhe no **canto superior** da pagina
2. Voce vera um numero no formato **XXX-XXX-XXXX** — este e o Customer ID
3. Se voce usa uma conta **MCC** (gerenciador que gerencia multiplas contas):
   - O ID que aparece no topo e o **ID do MCC**
   - Anote este numero **sem os hifens** (ex: `1173712344`)
4. Se voce usa uma **conta simples** (sem MCC):
   - O ID que aparece e o da conta de anuncios
   - Voce pode deixar o Login Customer ID vazio no proximo passo

**Anote**:
```
Developer Token: ______________________________________
Login Customer ID (MCC, sem hifens): ___________________
```

---

## PARTE 4 — INSTALAR O GCLOUD CLI

O gcloud CLI e a ferramenta de linha de comando do Google Cloud. Voce usa ela para fazer o deploy (publicar) do servidor proxy.

### Passo 4.1 — Instalar no Mac

1. Abra o **Terminal** (busque "Terminal" no Spotlight — Cmd+Espaco)
2. Cole e execute este comando:
   ```bash
   brew install google-cloud-sdk
   ```
3. Se aparecer um erro dizendo que o Homebrew nao esta instalado:
   a. Primeiro instale o Homebrew colando este comando:
      ```bash
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      ```
   b. Siga as instrucoes na tela (pode pedir a senha do seu Mac)
   c. Depois tente novamente: `brew install google-cloud-sdk`
4. Aguarde a instalacao terminar (pode levar 2-3 minutos)

### Passo 4.2 — Instalar no Windows

1. Acesse: **cloud.google.com/sdk/docs/install**
2. Clique no botao de download para Windows
3. Execute o instalador que foi baixado
4. Siga os passos do instalador (Next, Next, Install)
5. No final, marque a opcao "Run gcloud init" e clique "Finish"

### Passo 4.3 — Login no gcloud

1. No Terminal (Mac) ou CMD/PowerShell (Windows), execute:
   ```bash
   gcloud auth login
   ```
2. Uma janela do navegador vai abrir automaticamente
3. Faca login com a **mesma conta Gmail pessoal** que voce usou para criar o projeto no Google Cloud Console
4. Clique em **"Permitir"** (ou "Allow")
5. Voce pode fechar a janela do navegador e voltar para o Terminal
6. O Terminal deve mostrar uma mensagem: "You are now logged in as seuemail@gmail.com"

### Passo 4.4 — Selecionar o projeto

1. Primeiro, descubra o ID do seu projeto. Execute:
   ```bash
   gcloud projects list
   ```
2. Vai aparecer uma lista como:
   ```
   PROJECT_ID                    NAME               PROJECT_NUMBER
   celtic-fact-493611-k1         Google Ads Proxy    1012557761729
   ```
3. Copie o **PROJECT_ID** (a primeira coluna, ex: `celtic-fact-493611-k1`)
4. Execute (substituindo pelo seu PROJECT_ID real):
   ```bash
   gcloud config set project SEU_PROJECT_ID_AQUI
   ```
5. Exemplo real:
   ```bash
   gcloud config set project celtic-fact-493611-k1
   ```

---

## PARTE 5 — DEPLOY DO CLOUD RUN

Agora voce vai publicar o servidor proxy que faz a ponte entre sua plataforma e o Google Ads.

### Passo 5.1 — Baixar o codigo

Se voce fez Remix no Lovable, o codigo ja esta no seu repositorio GitHub. Clone-o:

1. No Terminal, navegue para uma pasta onde quiser salvar o codigo:
   ```bash
   cd ~/Documents
   ```
2. Clone o repositorio (substitua pela URL do SEU repositorio):
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   ```
3. Entre na pasta do servidor proxy:
   ```bash
   cd SEU-REPOSITORIO/cloud-run-oauth
   ```

**Se voce ja tem o codigo baixado**, apenas navegue ate a pasta:
```bash
cd /caminho/para/seu/projeto/cloud-run-oauth
```

### Passo 5.2 — Montar o comando de deploy

Voce vai precisar dos 5 valores que coletou nos passos anteriores. Monte o comando substituindo cada valor:

```bash
gcloud run deploy google-ads-proxy \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_ADS_CLIENT_ID=COLE_SEU_CLIENT_ID,GOOGLE_ADS_CLIENT_SECRET=COLE_SEU_CLIENT_SECRET,GOOGLE_ADS_DEVELOPER_TOKEN=COLE_SEU_DEV_TOKEN,ALLOWED_ORIGIN=https://SEU-APP.lovable.app,LOGIN_CUSTOMER_ID=SEU_MCC_SEM_HIFEN"
```

**Exemplo com valores reais** (NAO use estes valores — use os SEUS):
```bash
gcloud run deploy google-ads-proxy \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_ADS_CLIENT_ID=1012557761729-btth4fu2q0a39hmcbdncv84aookjp5if.apps.googleusercontent.com,GOOGLE_ADS_CLIENT_SECRET=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,GOOGLE_ADS_DEVELOPER_TOKEN=zusqUh_bo8Rhi6R8DtpzFg,ALLOWED_ORIGIN=https://ad-whisperer-69.lovable.app,LOGIN_CUSTOMER_ID=1173712344"
```

**Onde encontrar cada valor**:

| Valor | Onde encontrar | Exemplo |
|-------|---------------|---------|
| GOOGLE_ADS_CLIENT_ID | Passo 2.6 — Client ID | `1012557761729-xxx.apps.googleusercontent.com` |
| GOOGLE_ADS_CLIENT_SECRET | Passo 2.6 — Client Secret | `GOCSPX-xxxxxxx` |
| GOOGLE_ADS_DEVELOPER_TOKEN | Passo 3.2 — Developer Token | `zusqUh_bo8Rhi6R8DtpzFg` |
| ALLOWED_ORIGIN | URL do seu app no Lovable | `https://meu-app.lovable.app` |
| LOGIN_CUSTOMER_ID | Passo 3.3 — MCC sem hifens | `1173712344` (ou vazio se nao usa MCC) |

**COMO ENCONTRAR A URL DO LOVABLE**: No Lovable, abra seu projeto e clique em "Share" ou "Publish". A URL publicada aparece la (ex: `https://meu-app-123.lovable.app`).

### Passo 5.3 — Executar o deploy

1. Cole o comando montado no Terminal e pressione **Enter**
2. O Google Cloud vai fazer perguntas. Responda **Y** (sim) para todas:
   - "Do you want to enable these APIs?" → **Y** + Enter
   - "Do you want to continue?" → **Y** + Enter
3. **Aguarde 2-3 minutos**. O processo vai:
   - Enviar o codigo para o Google Cloud
   - Construir o servidor
   - Publicar o servidor
4. No final, voce vera uma mensagem assim:
   ```
   Service URL: https://google-ads-proxy-1012557761729.southamerica-east1.run.app
   ```
5. **COPIE ESSA URL** — voce vai precisar dela nos proximos passos

**Se aparecer um erro de permissao (PERMISSION_DENIED)**:
Execute estes dois comandos (substituindo o PROJECT_NUMBER pelo numero que aparece na URL do erro):
```bash
gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
  --member="serviceAccount:NUMERO-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
  --member="serviceAccount:NUMERO-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```
Depois execute o deploy novamente (Passo 5.3).

### Passo 5.4 — Verificar se o servidor esta rodando

1. Abra o navegador
2. Acesse: **SUA_URL_DO_CLOUD_RUN/health**
   - Exemplo: `https://google-ads-proxy-1012557761729.southamerica-east1.run.app/health`
3. Deve aparecer na tela:
   ```json
   {"status":"ok","version":"1.0.0"}
   ```
4. Se aparecer isso, o servidor esta rodando. Siga para o proximo passo.

**Se aparecer "Forbidden" ou "Error: Forbidden"**:
O acesso publico nao foi liberado. Tente executar:
```bash
gcloud run services add-iam-policy-binding google-ads-proxy \
  --region=southamerica-east1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
Se der erro de organizacao, use a flag `--invoker-iam-check` no deploy:
```bash
gcloud run deploy google-ads-proxy \
  --region=southamerica-east1 \
  --image=$(gcloud run services describe google-ads-proxy --region=southamerica-east1 --format='value(image)') \
  --allow-unauthenticated \
  --invoker-iam-check
```

---

## PARTE 6 — ATUALIZAR O REDIRECT URI

Agora que voce tem a URL do Cloud Run, precisa voltar ao Google Cloud Console e atualizar o redirect URI para que o login funcione.

### Passo 6.1 — Adicionar o URI correto

1. Volte ao Google Cloud Console: **console.cloud.google.com**
2. Verifique que o projeto "Google Ads Proxy" esta selecionado no topo
3. No menu lateral, va em **"APIs e Servicos"** > **"Credenciais"**
   - OU va direto para a Google Auth Platform > **"Clientes"**
4. Clique no nome do seu cliente OAuth ("Google Ads Proxy")
5. Na secao **"URIs de redirecionamento autorizados"**:
   a. Clique em **"+ ADICIONAR URI"**
   b. Cole: `https://SUA-URL-DO-CLOUD-RUN/auth/callback`
      - Exemplo: `https://google-ads-proxy-1012557761729.southamerica-east1.run.app/auth/callback`
   c. **ATENCAO**: Use **https** (com S), nao http
   d. **ATENCAO**: Nao coloque barra (/) no final
6. Voce pode **remover** o `http://localhost:8080/auth/callback` que adicionou antes (ou deixar, nao atrapalha)
7. Clique em **"SALVAR"**

**IMPORTANTE**: Pode levar de 5 minutos a 1 hora para o Google processar a mudanca. Se o login nao funcionar imediatamente, espere um pouco e tente novamente.

---

## PARTE 7 — CONECTAR NA PLATAFORMA

Agora e a parte mais facil. Voce vai abrir sua plataforma e conectar ao Google Ads.

### Passo 7.1 — Acessar a plataforma

1. Abra o navegador
2. Acesse a URL do seu app Lovable (ex: `https://meu-app-123.lovable.app`)
3. Voce vera a tela de login

### Passo 7.2 — Criar uma conta

1. Clique na aba **"Criar conta"**
2. Preencha:
   - **E-mail**: Seu email
   - **Senha**: Minimo 6 caracteres
   - **Confirmar senha**: Repita a senha
3. Clique em **"Criar conta"**
4. Voce sera redirecionado para o **Onboarding** (configuracao inicial)

### Passo 7.3 — Conectar o Google Ads

1. Na primeira tela do onboarding, voce vera um campo **"URL do servidor (Cloud Run)"**
2. Cole a **URL do Cloud Run** que voce copiou no Passo 5.3
   - Exemplo: `https://google-ads-proxy-1012557761729.southamerica-east1.run.app`
   - **SEM barra no final**
3. Clique no botao **"Conectar com Google Ads"**
4. Uma tela do Google vai abrir perguntando qual conta usar
5. Selecione a **conta que tem acesso ao Google Ads** (pode ser diferente da conta pessoal que voce usou no Google Cloud)
6. Pode aparecer um aviso **"O Google nao verificou este app"** — clique em **"Continuar"** (e seguro, e o seu proprio app)
7. Clique em **"Permitir"** na tela de permissoes
8. Voce sera redirecionado de volta para a plataforma

### Passo 7.4 — Selecionar a conta de anuncios

1. Apos o redirecionamento, a plataforma vai buscar suas contas de anuncios
2. Se voce usa MCC, vao aparecer as contas filhas (contas de anuncios)
3. Selecione a conta que deseja gerenciar no dropdown
4. Clique em **"Usar esta conta"**
5. Continue com os proximos passos do onboarding (Claude AI, Pipedrive, etc. — todos opcionais)
6. No final, clique em **"Ir para o Dashboard"**

### Passo 7.5 — Verificar que esta funcionando

1. O Dashboard deve carregar com os KPIs da sua conta:
   - Custo, Impressoes, Cliques, CTR, CPC Medio, Conversoes
2. Clique em **"Campanhas"** no menu lateral
3. Suas campanhas devem aparecer na lista
4. Clique em uma campanha para ver os detalhes e metricas

**PRONTO!** Sua plataforma esta funcionando com dados reais do Google Ads.

---

## PROBLEMAS COMUNS E SOLUCOES

### "Error: Forbidden" ao acessar /health

**Causa**: O Cloud Run esta bloqueando acesso publico.

**Solucao**:
```bash
gcloud run services add-iam-policy-binding google-ads-proxy \
  --region=southamerica-east1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### "redirect_uri_mismatch" ao autorizar

**Causa**: O redirect URI no Google Cloud Console nao bate com o que o Cloud Run envia.

**Solucao**: Verifique no Google Cloud Console > Clientes > seu cliente:
- O URI deve ser EXATAMENTE: `https://SUA-URL-DO-CLOUD-RUN/auth/callback`
- Com **https** (nao http)
- **Sem** barra no final
- Pode levar ate 1 hora para propagar

### "Acesso bloqueado: a solicitacao desse app e invalida"

**Causa**: O email que voce esta usando para autorizar nao esta na lista de usuarios de teste.

**Solucao**: Volte ao Google Cloud Console > Google Auth Platform > Publico-alvo > Adicione o email.

### "invalid_grant" ou "unauthorized_client"

**Causa**: O token expirou ou foi gerado com credenciais diferentes.

**Solucao**: Na plataforma, va em Configuracoes > Desconectar > Reconectar.

### "DEVELOPER_TOKEN_PROHIBITED"

**Causa**: O Developer Token nao e compativel com o projeto OAuth.

**Solucao**: Verifique se o Developer Token e da conta Google Ads correta. O Developer Token nao precisa ser do mesmo projeto Google Cloud — mas a conta que autoriza precisa ter acesso ao Google Ads.

### Dados zerados no Dashboard

**Causa**: A conta selecionada pode nao ter campanhas ativas ou gastos no periodo selecionado.

**Solucao**: Troque o periodo para "30 dias" ou "Este mes". Verifique se voce selecionou a conta de anuncios correta (nao o MCC).

### Preciso mudar as credenciais depois do deploy

**Solucao**: Rode o deploy novamente com os novos valores:
```bash
cd seu-repositorio/cloud-run-oauth
gcloud run deploy google-ads-proxy \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_ADS_CLIENT_ID=NOVO_ID,GOOGLE_ADS_CLIENT_SECRET=NOVO_SECRET,GOOGLE_ADS_DEVELOPER_TOKEN=NOVO_TOKEN,ALLOWED_ORIGIN=https://SEU-APP.lovable.app,LOGIN_CUSTOMER_ID=SEU_MCC"
```

### Preciso adicionar mais usuarios

**Solucao**: Va ao Google Cloud Console > Google Auth Platform > Publico-alvo > Adicione o email do novo usuario.

---

## CUSTOS

### Google Cloud Run (servidor proxy)
- **2 milhoes** de requisicoes por mes: **GRATIS**
- **360.000** segundos de CPU por mes: **GRATIS**
- **1 GB** de memoria por mes: **GRATIS**
- Para uso normal de uma agencia: **R$ 0,00/mes**

### Google Ads API
- **Sem custo adicional** — o acesso a API e gratuito
- Voce so paga pelos anuncios em si (o gasto normal das campanhas)

### Lovable
- Depende do plano contratado (onde a plataforma fica hospedada)

---

## CHECKLIST FINAL

Antes de considerar a instalacao completa, confirme cada item:

- [ ] Projeto criado no Google Cloud Console
- [ ] Faturamento ativado (cartao cadastrado)
- [ ] Google Ads API ativada
- [ ] Tela de consentimento OAuth configurada
- [ ] Escopos adwords adicionados
- [ ] Usuarios de teste adicionados
- [ ] Cliente OAuth criado (Client ID + Secret salvos)
- [ ] Developer Token copiado do Google Ads
- [ ] Login Customer ID (MCC) anotado
- [ ] gcloud CLI instalado e logado
- [ ] Deploy do Cloud Run executado com sucesso
- [ ] URL do Cloud Run copiada
- [ ] Redirect URI atualizado no Google Cloud Console
- [ ] /health respondendo {"status":"ok"}
- [ ] Plataforma acessada e conta criada
- [ ] Google Ads conectado via onboarding
- [ ] Dashboard mostrando dados reais
- [ ] Campanhas listadas corretamente

Se todos os itens estiverem marcados, a instalacao esta completa.

---

## SUPORTE

Se tiver problemas que nao estao listados aqui:

1. **Verifique os logs do Cloud Run**: Google Cloud Console > Cloud Run > google-ads-proxy > Logs
2. **Verifique o console do navegador**: F12 > Console — erros em vermelho indicam o problema
3. **Teste o health check**: `https://SUA-URL/health` — se nao responder, o servidor esta fora do ar

---

*Este documento foi gerado automaticamente e deve ser revisado antes da distribuicao final.*
