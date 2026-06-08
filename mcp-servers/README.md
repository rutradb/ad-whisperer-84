# MCP Servers — Pipedrive & Shopify

Servidores MCP para correlacionar dados de CRM/e-commerce com Meta Ads.

## Servidores disponíveis

| Servidor | Fonte de dados | Casos de uso |
|----------|---------------|--------------|
| `pipedrive` | Pipedrive CRM | Deals por campanha, CPA real, jornada lead→deal |
| `shopify` | Shopify Orders | Receita real, ROAS real, pedidos por campanha UTM |

---

## Instalação rápida

```bash
# Pipedrive
cd mcp-servers/pipedrive
npm install
npm run build

# Shopify
cd mcp-servers/shopify
npm install
npm run build
```

---

## Configuração no Claude Code

Adicione ao seu `.claude/settings.json` (ou `~/.claude.json`):

```json
{
  "mcpServers": {
    "pipedrive": {
      "command": "node",
      "args": ["./mcp-servers/pipedrive/dist/index.js"],
      "env": {
        "PIPEDRIVE_API_TOKEN": "SEU_TOKEN_AQUI"
      }
    },
    "shopify": {
      "command": "node",
      "args": ["./mcp-servers/shopify/dist/index.js"],
      "env": {
        "SHOPIFY_STORE": "sualoja.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxxxxxxxxx"
      }
    }
  }
}
```

## Configuração no Claude Desktop

Adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pipedrive": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp-servers/pipedrive/dist/index.js"],
      "env": { "PIPEDRIVE_API_TOKEN": "SEU_TOKEN" }
    },
    "shopify": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp-servers/shopify/dist/index.js"],
      "env": {
        "SHOPIFY_STORE": "sualoja.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxxxxxxxxx"
      }
    }
  }
}
```

---

## Como obter as credenciais

### Pipedrive API Token
1. Acesse Pipedrive → Menu (canto superior direito) → Personal preferences
2. Vá em **API** → copie o token pessoal

### Shopify Access Token
1. Acesse Shopify Admin → Configurações → Apps e canais de vendas
2. Desenvolver apps → Criar um app
3. Configure escopos: `read_orders`, `read_customers`, `read_products`
4. Instale o app e copie o **Access Token** (começa com `shpat_`)

---

## Ferramentas disponíveis

### Pipedrive MCP
| Ferramenta | Descrição |
|-----------|-----------|
| `list_pipelines` | Lista todos os pipelines de vendas |
| `list_stages` | Lista etapas de um pipeline |
| `list_deals` | Lista deals com filtros (status, pipeline, data) |
| `get_deal` | Detalhes completos de um deal |
| `get_deal_fields` | Lista campos customizados (para mapear UTMs) |
| `search_deals` | Busca deals por termo |
| `list_leads` | Lista leads (pré-deals) |
| `get_deals_summary` | Resumo agregado por status/pipeline |
| `correlate_with_meta_campaigns` | **Correlação principal**: agrupa deals por campo UTM campanha |

### Shopify MCP
| Ferramenta | Descrição |
|-----------|-----------|
| `list_orders` | Lista pedidos com filtros |
| `get_order` | Detalhes de um pedido (UTMs nos note_attributes) |
| `get_orders_count` | Contagem de pedidos |
| `list_customers` | Lista clientes |
| `list_products` | Lista produtos |
| `get_revenue_summary` | **Receita total, AOV, top produtos** para um período |
| `get_orders_by_source` | Agrupa pedidos por source_name |
| `correlate_with_meta_campaigns` | **Correlação principal**: agrupa pedidos por UTM campanha |
| `get_real_roas` | **ROAS real**: receita Shopify ÷ gasto Meta informado |

---

## Exemplos de perguntas ao agente

Com os servidores ativos, você pode perguntar ao agente:

```
"Qual campanha do Meta gerou mais deals fechados no Pipedrive nos últimos 30 dias?"

"Compare o ROAS que o Meta reporta com a receita real do Shopify essa semana."

"Qual é meu CPA real baseado nos deals ganhos no Pipedrive, não nas conversões do pixel?"

"Mostra a jornada: quanto do gasto em cada campanha virou pedido no Shopify?"

"Quais campanhas geraram leads mas nenhum deal fechado no Pipedrive?"
```

---

## Campo UTM no Pipedrive

Para que a correlação funcione, os deals precisam ter um campo customizado com o UTM source/campaign.
Você pode popular esse campo via:
- **Webhook** do seu formulário de lead (ex: RDStation, HubSpot forms)
- **Zapier/Make**: ao criar o deal, mapear UTM params para campos customizados
- **API diretamente**: ao criar leads via API, incluir os campos UTM

Para descobrir os `field_key` dos seus campos customizados:
```
"Use get_deal_fields e me mostre todos os campos customizados do Pipedrive"
```

## Campo UTM no Shopify

O Shopify armazena UTMs nos `note_attributes` dos pedidos quando você usa scripts de rastreamento.
Configure o tema Shopify para capturar UTMs dos cookies e salvar nos note_attributes ao checkout.

Bibliotecas recomendadas:
- [Shopify UTM Tracker](https://github.com/shopify/utm-tracker)
- Google Tag Manager configurado para passar UTMs nos hidden fields do checkout
