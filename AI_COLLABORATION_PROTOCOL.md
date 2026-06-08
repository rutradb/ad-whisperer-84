# Protocolo de Colaboração AI (Antigravity & Claude Code)

Este documento define as regras de engajamento para o trabalho em paralelo entre o Antigravity e o Claude Code neste projeto (Ad Manager Hub), sob a gestão do Usuário (Tech Lead / Product Manager).

## 1. Papéis e Especializações Sugeridas

**Usuário (Gestor do Projeto / Tech Lead)**
- Define prioridades, requisitos de negócio e tarefas no arquivo `ROADMAP.md`.
- Atribui tarefas claramente para cada IA usando as tags `[AG]`, `[CC]` ou `[UI]`.
- Testa as funcionalidades integradas e direciona as correções.
- Toma decisões arquiteturais de alto nível.

**Antigravity (Especialista em Sistema, Backend e Integrações) `[AG]`**
- Configurações de ambiente, infraestrutura de projeto.
- Integrações de Backend (Supabase, Migrations, Policies RLS).
- Scripts de manipulação de arquivos, navegação de diretórios e debug de build.
- Criação e gestão de arquivos de configuração em massa.
- Interações complexas de linha de comando.

**Claude Code (Especialista em Lógica de Negócio e Frontend Funcional) `[CC]`**
- Implementação da lógica de componentes React.
- Conexão e tratamento de estados (Zustand, React Query).
- Refatoração de funções e abstrações de código.
- Integração de bibliotecas que afetam o negócio.
- Testes unitários de regras de negócio.

**Agente UI/UX (Especialista em Visual e Experiência) `[UI]`**
- Implementação de layouts, CSS, Tailwind e base visual usando o `design.md`.
- Transformar componentes brutos em interfaces "Uau" com animações e micro-interações.
- Ajustes de responsividade e mobile-first.
- Integração de novos componentes Shadcn focados em estética.

## 2. Fluxo de Trabalho Compartilhado

Para evitar conflitos (ambos os agentes sobrescrevendo arquivos um do outro):

1. **Atribuição:** O Gestor do Projeto escreve a tarefa no `ROADMAP.md`, marcando quem será o responsável.
2. **Setup:** O agente escalado deve ler o `ROADMAP.md` no início da interação.
3. **Isolamento:**
   - Recomendação principal: **Não editem o mesmo arquivo `src/**` simultaneamente.**
   - Exemplo: O `[AG]` constrói a tabela no banco e gera os tipos TS, enquanto o `[CC]` usa tipos temporários até os reais estarem prontos.
4. **Entrega e Garantia de Qualidade:**
   - Antes de concluir uma tarefa, o agente responsável deve garantir que o build (`npm run build`) e o lint (`npm run lint`) não estão quebrados.
   - O agente move a tarefa para "Concluído" no `ROADMAP.md`.

## 3. Comunicação Baseada em Código

Visto que os agentes não "conversam" em tempo real entre si no Discord/Slack:
- **A base de código é a única fonte da verdade.**
- Se o Agente A precisar deixar um recado para o Agente B sobre que estrutura de dados ele deve esperar de uma função, use comentários explícitos no código: `// TODO (Claude): A rota da API X vai retornar Y, implemente isso no frontend.`
- Para discussões de design, utilize ou crie arquivos paralelos em `docs/` se necessário.
