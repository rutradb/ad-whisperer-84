import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { EXPANDED_TOOLS } from "@/lib/agent/expanded-tools";
import { executeExpandedToolCall } from "@/lib/agent/expanded-executor";
import { buildSpecializedPrompt } from "@/lib/agent/agentProfiles";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

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
      if (!anthropicApiKey || !selectedAccount) return;

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
          const response = await fetch(ANTHROPIC_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 4096,
              system: buildSpecializedPrompt(
                activeProfile,
                selectedAccount?.descriptiveName || selectedAccount?.id || "Unknown",
                useBusinessContextStore.getState(),
              ),
              tools: EXPANDED_TOOLS,
              messages: loopMessages,
            }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Erro na API Anthropic (${response.status})`);
          }

          const data = await response.json();

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
              const result = await executeExpandedToolCall(
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

  const hasApiKey = !!anthropicApiKey;
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
