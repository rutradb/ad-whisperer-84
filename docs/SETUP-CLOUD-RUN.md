# Guia Completo: Configurar o Google Ads Manager Hub

Tempo estimado: 15-20 minutos.

---

## O que voce vai precisar

- Uma conta Google (Gmail pessoal recomendado)
- Um cartao de credito (para ativar o Google Cloud — nao cobra nada)
- Acesso ao Google Ads (a conta que voce quer gerenciar)

---

## PARTE 1 — Criar o projeto no Google Cloud

### Passo 1.1 — Acessar o Google Cloud Console

1. Abra o Chrome
2. Va em: https://console.cloud.google.com
3. Faca login com sua conta Google
4. Se aparecer "Termos de servico", aceite

### Passo 1.2 — Criar um projeto novo

1. No topo da pagina, clique no seletor de projetos
2. Clique **"NOVO PROJETO"**
3. Nome: `Google Ads Proxy`
4. Organizacao: deixe como "Sem organizacao"
   - Se voce usa conta corporativa (ex: @suaempresa.com), use uma conta Gmail pessoal para evitar restricoes de organizacao
5. Clique **"CRIAR"**
6. Aguarde e selecione o projeto no seletor do topo

### Passo 1.3 — Ativar o faturamento

1. Menu lateral > **Faturamento**
2. Vincule uma conta de faturamento (ou crie uma nova com cartao de credito)
3. O Google Cloud tem free tier — Cloud Run nao cobra para ate 2 milhoes de requisicoes/mes

---

## PARTE 2 — Ativar a Google Ads API

1. No menu lateral, va em **APIs e Servicos** > **Biblioteca**
2. Busque: `Google Ads API`
3. Clique no resultado e depois no botao **"ATIVAR"**

---

## PARTE 3 — Configurar o OAuth

### Passo 3.1 — Registrar o app (Tela de consentimento)

O Google agora usa a **Google Auth Platform**. O fluxo pode variar, mas siga:

1. No menu lateral, va em **APIs e Servicos** > **Tela de consentimento OAuth**
   - Ou acesse direto: https://console.cloud.google.com/auth/overview
2. Se pedir tipo de usuario, selecione **"Externo"** e clique **"CRIAR"**
3. Voce pode ser levado para a pagina **"Google Auth Platform"** com o menu:
   - Visao geral
   - Branding
   - Publico-alvo
   - Clientes
   - Acesso a dados
   - Central de verificacao
   - Configuracoes

Se isso acontecer, a configuracao base ja foi criada automaticamente. Siga para o proximo passo.

### Passo 3.2 — Configurar Branding (se necessario)

1. No menu lateral da Google Auth Platform, clique em **"Branding"**
2. Preencha se estiver vazio:
   - Nome do app: `Google Ads Manager`
   - E-mail de suporte: seu email
3. Role ate o final e preencha **E-mail do desenvolvedor**: seu email
4. Clique **"SALVAR"**

### Passo 3.3 — Adicionar Publico-alvo (usuarios de teste)

1. Clique em **"Publico-alvo"** no menu lateral
2. Clique **"ADD USERS"** ou **"Adicionar usuarios"**
3. Digite o email da conta que tem acesso ao Google Ads
   - Ex: `seuemail@gmail.com` ou `seuemail@suaempresa.com`
4. Clique **"SALVAR"**

### Passo 3.4 — Configurar Acesso a dados (escopos)

1. Clique em **"Acesso a dados"** no menu lateral
2. Clique **"ADICIONAR OU REMOVER ESCOPOS"**
3. Busque: `adwords`
4. Marque: `https://www.googleapis.com/auth/adwords`
5. Clique **"ATUALIZAR"** e depois **"SALVAR"**

### Passo 3.5 — Criar o Cliente OAuth (credenciais)

1. Clique em **"Clientes"** no menu lateral
2. Clique **"CREATE CLIENT"** ou **"Criar um cliente OAuth"**
3. Preencha:
   - Tipo: **Aplicativo da Web**
   - Nome: `Google Ads Proxy`
4. Em **URIs de redirecionamento autorizados**, clique **"+ Adicionar URI"**
5. Digite: `http://localhost:8080/auth/callback` (temporario — vamos trocar depois)
6. Clique **"CRIAR"**

### Passo 3.6 — COPIAR O CLIENT SECRET (CRITICO!)

Apos clicar "Criar", uma modal aparece com:
- **ID do cliente**: algo como `1012557761729-xxx.apps.googleusercontent.com`
- **Chave secreta do cliente**: algo como `GOCSPX-xxxxx`

**IMPORTANTE: A chave secreta (Client Secret) so aparece NESTA TELA, UMA UNICA VEZ.**
**Se voce fechar sem copiar, nunca mais vai ver ela.**

Opcoes para salvar:
- **Opcao A**: Clique **"Baixar o JSON"** — salva um arquivo com tudo dentro
- **Opcao B**: Copie manualmente o Client ID e o Client Secret para um bloco de notas

Se ja fechou a modal sem copiar o secret:
1. Va em **Clientes** > clique no nome do cliente
2. Na pagina de detalhes, procure **"Adicionar chave secreta"** ou **"Add Secret"**
3. Clique para gerar um novo secret
4. Copie o novo secret imediatamente

**Salve em um lugar seguro:**
- Client ID: `______________________________`
- Client Secret: `______________________________`

---

## PARTE 4 — Obter o Developer Token do Google Ads

1. Va em: https://ads.google.com
2. Faca login com a conta que gerencia os anuncios
3. Clique no icone de **chave inglesa** (Ferramentas) no menu superior
4. Va em **Configuracao** > **Central de API**
5. Copie o **Token de desenvolvedor**
6. Verifique o **Nivel de acesso**: deve ser "Acesso basico" ou superior

Se o nivel for "Conta de teste":
- Clique em **"Solicitar acesso basico"**
- Preencha o formulario (pode levar alguns dias para aprovar)

Anote tambem o **Login Customer ID** (MCC):
- Aparece no canto superior da tela do Google Ads no formato `XXX-XXX-XXXX`

**Salve:**
- Developer Token: `______________________________`
- Login Customer ID (MCC): `______________________________`

---

## PARTE 5 — Instalar o gcloud CLI

### Mac (Homebrew):
```bash
brew install google-cloud-sdk
```

### Mac (manual):
```bash
curl https://sdk.cloud.google.com | bash
```

### Windows:
Baixe em: https://cloud.google.com/sdk/docs/install

### Depois de instalar:

```bash
gcloud auth login
```

Uma janela do navegador abre — faca login com a **mesma conta** que criou o projeto.

Configure o projeto:
```bash
gcloud config set project SEU_PROJECT_ID
```

Para descobrir o Project ID:
- Google Cloud Console > pagina inicial
- O ID aparece abaixo do nome do projeto (ex: `celtic-fact-493611-k1`)

---

## PARTE 6 — Deploy do Cloud Run

### Passo 6.1 — Baixar o codigo

Se fez Remix no Lovable, clone o repositorio:
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO/cloud-run-oauth
```

### Passo 6.2 — Deploy

Rode o comando abaixo, **substituindo os 5 valores**:

```bash
gcloud run deploy google-ads-proxy \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_ADS_CLIENT_ID=SEU_CLIENT_ID,GOOGLE_ADS_CLIENT_SECRET=SEU_CLIENT_SECRET,GOOGLE_ADS_DEVELOPER_TOKEN=SEU_DEV_TOKEN,ALLOWED_ORIGIN=https://SEU-APP.lovable.app,LOGIN_CUSTOMER_ID=SEU_MCC_SEM_HIFEN"
```

**Substitua:**
| Placeholder | Valor | Exemplo |
|---|---|---|
| SEU_CLIENT_ID | Client ID do passo 3.6 | `1012557761729-xxx.apps.googleusercontent.com` |
| SEU_CLIENT_SECRET | Client Secret do passo 3.6 | `GOCSPX-xxxxx` |
| SEU_DEV_TOKEN | Developer Token do passo 4 | `zusqUh_bo8Rhi6R8DtpzFg` |
| https://SEU-APP.lovable.app | URL do seu app no Lovable | `https://ad-whisperer-69.lovable.app` |
| SEU_MCC_SEM_HIFEN | Login Customer ID sem hifens | `1173712344` |

**Quando perguntar:**
- "Do you want to enable these APIs?" → **Y**
- "Do you want to continue?" → **Y**

**Aguarde** 2-3 minutos. No final aparece:
```
Service URL: https://google-ads-proxy-XXXXX-rj.a.run.app
```

**COPIE ESSA URL.**

### Passo 6.3 — Liberar acesso publico

```bash
gcloud run services add-iam-policy-binding google-ads-proxy \
  --region=southamerica-east1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

Se der erro de organizacao, tente sem conta corporativa (Gmail pessoal).

---

## PARTE 7 — Atualizar o redirect URI

1. Volte no Google Cloud Console > **Clientes** (dentro da Google Auth Platform)
2. Clique no cliente **"Google Ads Proxy"**
3. Em **URIs de redirecionamento autorizados**:
   - Adicione: `https://SUA-URL-DO-CLOUD-RUN/auth/callback`
   - Exemplo: `https://google-ads-proxy-12345-rj.a.run.app/auth/callback`
4. Clique **"SALVAR"**

---

## PARTE 8 — Testar

### 8.1 — Verificar o servidor

Abra no navegador:
```
https://SUA-URL-DO-CLOUD-RUN/health
```

Deve aparecer:
```json
{"status":"ok","version":"1.0.0"}
```

### 8.2 — Conectar na plataforma

1. Abra seu app Lovable
2. Faca login
3. No onboarding, cole a **URL do Cloud Run** no campo
4. Clique **"Conectar com Google Ads"**
5. Autorize no Google
6. Selecione a conta de anuncios
7. Pronto!

---

## Problemas Comuns

### "Error: Forbidden" ao acessar /health
O acesso publico nao foi liberado. Rode o comando do passo 6.3.
Se a organizacao bloquear, crie o projeto com uma conta Gmail pessoal.

### "redirect_uri_mismatch"
O redirect URI nao confere. No Google Cloud Console > Clientes > seu cliente:
- O URI deve ser: `https://SUA-URL-DO-CLOUD-RUN/auth/callback`
- Sem barra no final, com https

### "invalid_grant"
O token expirou. Desconecte e reconecte o Google Ads na plataforma.

### "DEVELOPER_TOKEN_PROHIBITED"
O Developer Token pertence a outro projeto Google Cloud.
Use o Developer Token da mesma conta que criou o OAuth Client.

### Esqueci o Client Secret
1. Google Cloud Console > Clientes > seu cliente
2. Clique **"Adicionar chave secreta"** / **"Add Secret"**
3. Copie o novo secret
4. Atualize no Cloud Run:
```bash
gcloud run deploy google-ads-proxy \
  --region=southamerica-east1 \
  --image=$(gcloud run services describe google-ads-proxy --region=southamerica-east1 --format='value(image)') \
  --update-env-vars "GOOGLE_ADS_CLIENT_SECRET=NOVO_SECRET"
```

---

## Custos

Google Cloud Run free tier:
- 2 milhoes de requisicoes/mes: **gratis**
- 360.000 segundos de CPU/mes: **gratis**
- 1 GB de memoria/mes: **gratis**

Para uso normal: **R$ 0,00/mes**.
