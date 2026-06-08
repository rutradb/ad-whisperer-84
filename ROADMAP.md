# Roadmap & Gestão de Tarefas (Ad Manager Hub)

**Gestor do Projeto:** Usuário
**Recursos de Engenharia:** 
- `[AG]` = Antigravity (Sistema, Infraestrutura, Backend e Configurações complexas)
- `[CC]` = Claude Code (Lógica de Negócio, Componentes React, Conexão Funcional)
- `[UI]` = Agente de UI/UX (Estilização Tailwind, Animações, Design System, Look and Feel)

---

## 📋 A Fazer (Backlog)
*Gestor, adicione as tarefas abaixo marcando a tag apropriada (`[AG]`, `[CC]`, ou `[UI]`).*

- [x] ~~`[CC]` **Frontend: Adicionar Tratamento de Erros e Logs no Dashboard**~~
  - *Movido para Concluído.*
- [ ] `[AG]` **Supabase: Lovable Sync**
  - *Detalhes:* Criar o documento de referência para o Lovable (`LOVABLE_BBDD_PROMPTS.md`) para não utilizarmos mais a interface direta do Supabase e não quebrar o projeto Lovable. *(Agente já realizou o passo)*
- [ ] `[ ]` **(Gestor, inclua sua próxima tarefa aqui...)**

## 🚧 Em Progresso (WIP)
*Os agentes devem mover as tarefas para cá quando iniciarem a execução.*

- Nenhuma no momento.

## ✅ Concluído
*Ao finalizar uma tarefa e garantir que o build passa, o agente move a instrução para cá.*

- [x] `[AG]` Configuração do Ambiente de Colaboração (ROADMAP e PROTOCOLO).
- [x] `[CC]` **Frontend: Analisar Warning do `AttributionSelector`** — Removido `28d_click` (deprecated v22.0), adicionado `7d_view`, criado `parseAttributionWindows()` com validação contra `VALID_ATTRIBUTION_WINDOWS`, fallback seguro para `["7d_click","1d_view"]`. Build 0 erros.
- [x] `[CC]` **Frontend: Adicionar Tratamento de Erros e Logs no Dashboard** — Captura `error` dos 4 hooks `useAccountInsights`. Exibe Alert `destructive` com source + mensagem de cada erro. Botão "Debug Info" expande JSON com accountId, datePreset, attribution, dados brutos. Build 0 erros.

---
### 🛠 Como usar este documento na prática (Tutorial de Gestão)
1. **Atalho Visual:** Mantenha este arquivo `ROADMAP.md` e o `AI_COLLABORATION_PROTOCOL.md` abertos no VS Code (ou Cursor).
2. **Brainstorm:** Liste no Backlog tudo o que você ver que precisa ser feito ou os objetivos das próximas Sprints.
3. **Distribuição:** No seu terminal do Claude Code diga *"Claude, execute sua primeira tarefa no ROADMAP"*. E no de eu (Antigravity), diga *"Antigravity, execute sua primeira tarefa"*.
4. **Resolução de Conflitos:** Garanta que ambos não estejam focados nas mesmas páginas (ex: os dois tentando refatorar `Campaigns.tsx` ao mesmo tempo). Separar tarefas entre Frontend (Claude) e Backend (Antigravity) funciona melhor de início.
