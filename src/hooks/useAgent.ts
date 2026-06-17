import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/integrations/supabase/client";
import { EXPANDED_TOOLS } from "@/lib/agent/expanded-tools";
import { executeToolViaGateway } from "@/lib/agent/mcp/gateway";
import { buildSpecializedPrompt } from "@/lib/agent/agentProfiles";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";
import {
  createConversation,
  insertAgentMessage,
  touchConversation,
  fetchConversationMessages,
} from "@/hooks/useAgentHistory";
import { AI_MODELS } from "@/lib/ai/models";

const MODEL = AI_MODELS.sonnet;

export interface ToolAction {
  toolName: string;
  input: Record<string, any>;
  result: string;
  status: "success" | "error";
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolActions?: ToolAction[];
  timestamp: Date;
}

export function useAgent() {
  const { anthropicApiKey, selectedCustomer: selectedAccount } = useAuthStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState("analyst");
  const apiHistoryRef = useRef<any[]>([]);

  // Conversa persistida ativa. Ref para a lógica assíncrona, state para a UI.
  const conversationIdRef = useRef<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const setConversation = useCallback((id: string | null) => {
    conversationIdRef.current = id;
    setConversationId(id);
  }, []);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!selectedAccount) return;

      const userMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      apiHistoryRef.current = [
        ...apiHistoryRef.current,
        { role: "user", content: userText },
      ];

      setIsLoading(true);
      const toolActions: ToolAction[] = [];

      // Persistência: garante a conversa e grava a mensagem do usuário.
      // Falhas aqui não devem quebrar o chat — apenas logamos.
      let userId: string | null = null;
      try {
        userId = (await supabase.auth.getSession()).data.session?.user.id ?? null;
        if (userId) {
          if (!conversationIdRef.current) {
            const newId = await createConversation({
              userId,
              customerId: selectedAccount.id ?? null,
              profile: activeProfile,
              title: userText,
            });
            setConversation(newId);
            queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
          }
          await insertAgentMessage({
            conversationId: conversationIdRef.current!,
            userId,
            role: "user",
            content: userText,
            toolActions: [],
          });
        }
      } catch (err) {
        console.warn("[useAgent] Falha ao persistir mensagem do usuário:", err);
      }

      try {
        let loopMessages = [...apiHistoryRef.current];

        while (true) {
          // O loop continua sendo orquestrado no cliente, mas a chamada ao
          // modelo passa pela edge function `agent-run` — a chave Anthropic
          // nunca trafega direto do browser para a API.
          const { data, error } = await supabase.functions.invoke<any>("agent-run", {
            body: {
              apiKey: anthropicApiKey,
              model: MODEL,
              max_tokens: 4096,
              system: buildSpecializedPrompt(
                activeProfile,
                selectedAccount?.descriptiveName || selectedAccount?.id || "Unknown",
                useBusinessContextStore.getState(),
              ),
              tools: EXPANDED_TOOLS,
              messages: loopMessages,
            },
          });

          if (error) {
            let msg = error.message || "Erro ao chamar o agente.";
            try {
              const ctx = await (error as any).context?.json?.();
              if (ctx?.error) msg = ctx.error;
            } catch {
              // mantém a mensagem padrão
            }
            throw new Error(msg);
          }
          if (data?.error) {
            throw new Error(data.error);
          }

          if (data.stop_reason !== "tool_use") {
            const text = data.content?.find((c: any) => c.type === "text")?.text || "";

            apiHistoryRef.current = [
              ...loopMessages,
              { role: "assistant", content: data.content },
            ];

            const assistantMsg: AgentMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: text,
              toolActions: toolActions.length > 0 ? [...toolActions] : undefined,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            // Persiste a resposta da IA (com as ações de tools executadas).
            try {
              if (userId && conversationIdRef.current) {
                await insertAgentMessage({
                  conversationId: conversationIdRef.current,
                  userId,
                  role: "assistant",
                  content: text,
                  toolActions: [...toolActions],
                });
                await touchConversation(conversationIdRef.current);
                queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
              }
            } catch (err) {
              console.warn("[useAgent] Falha ao persistir resposta da IA:", err);
            }
            break;
          }

          const toolUseBlocks = data.content.filter((c: any) => c.type === "tool_use");

          loopMessages = [
            ...loopMessages,
            { role: "assistant", content: data.content },
          ];

          const toolResultBlocks: any[] = [];
          for (const block of toolUseBlocks) {
            try {
              const result = await executeToolViaGateway(
                block.name,
                block.input,
                { accountId: selectedAccount.id }
              );
              toolActions.push({ toolName: block.name, input: block.input, result, status: "success" });
              toolResultBlocks.push({ type: "tool_result", tool_use_id: block.id, content: result });
            } catch (err: any) {
              const errMsg = err.message || "Erro desconhecido";
              toolActions.push({ toolName: block.name, input: block.input, result: errMsg, status: "error" });
              toolResultBlocks.push({ type: "tool_result", tool_use_id: block.id, content: `Erro: ${errMsg}`, is_error: true });
            }
          }

          loopMessages = [
            ...loopMessages,
            { role: "user", content: toolResultBlocks },
          ];
        }
      } catch (err: any) {
        const errMsg: AgentMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Erro ao processar: ${err.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [anthropicApiKey, selectedAccount, activeProfile, queryClient, setConversation]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    apiHistoryRef.current = [];
    setConversation(null);
  }, [setConversation]);

  const switchProfile = useCallback(
    (profileId: string) => {
      setActiveProfile(profileId);
      setMessages([]);
      apiHistoryRef.current = [];
      setConversation(null);
    },
    [setConversation]
  );

  /** Inicia uma conversa nova (limpa a tela e desvincula a conversa atual). */
  const newConversation = useCallback(() => {
    setMessages([]);
    apiHistoryRef.current = [];
    setConversation(null);
  }, [setConversation]);

  /** Carrega uma conversa persistida e reconstrói o contexto para continuar. */
  const loadConversation = useCallback(
    async (id: string, profile?: string) => {
      setIsLoading(true);
      try {
        const rows = await fetchConversationMessages(id);
        setMessages(
          rows.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolActions: m.tool_actions?.length ? (m.tool_actions as ToolAction[]) : undefined,
            timestamp: new Date(m.created_at),
          }))
        );
        // Reconstrói o histórico da API como turnos de texto simples. As ações
        // de tools são exibidas (vindas do banco), mas não re-injetadas como
        // blocos tool_use/tool_result — suficiente para continuar a conversa.
        apiHistoryRef.current = rows.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        if (profile) setActiveProfile(profile);
        setConversation(id);
      } catch (err) {
        console.warn("[useAgent] Falha ao carregar conversa:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [setConversation]
  );

  const hasApiKey = true;
  const isConnected = !!selectedAccount;

  return {
    messages,
    isLoading,
    hasApiKey,
    isConnected,
    activeProfile,
    conversationId,
    sendMessage,
    switchProfile,
    clearHistory,
    newConversation,
    loadConversation,
  };
}
