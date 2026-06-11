import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/integrations/supabase/client";
import { EXPANDED_TOOLS } from "@/lib/agent/expanded-tools";
import { executeToolViaGateway } from "@/lib/agent/mcp/gateway";
import { buildSpecializedPrompt } from "@/lib/agent/agentProfiles";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";

const MODEL = "claude-sonnet-4-6";

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
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState("analyst");
  const apiHistoryRef = useRef<any[]>([]);

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
    [anthropicApiKey, selectedAccount, activeProfile]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    apiHistoryRef.current = [];
  }, []);

  const switchProfile = useCallback((profileId: string) => {
    setActiveProfile(profileId);
    setMessages([]);
    apiHistoryRef.current = [];
  }, []);

  const hasApiKey = true;
  const isConnected = !!selectedAccount;

  return {
    messages,
    isLoading,
    hasApiKey,
    isConnected,
    activeProfile,
    sendMessage,
    switchProfile,
    clearHistory,
  };
}
