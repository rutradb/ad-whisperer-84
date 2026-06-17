import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AgentConversationRow,
  AgentMessageRow,
  AgentToolAction,
} from "@/types/database";

// As tabelas agent_conversations / agent_messages estão fora dos types gerados,
// então usamos o cast `(supabase as any)` (padrão do projeto).
const db = supabase as any;

async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// --- Helpers usados pelo loop do agente (useAgent) -------------------------

export async function createConversation(input: {
  userId: string;
  customerId: string | null;
  profile: string;
  title: string;
}): Promise<string> {
  const { data, error } = await db
    .from("agent_conversations")
    .insert({
      user_id: input.userId,
      customer_id: input.customerId,
      profile: input.profile,
      title: input.title.slice(0, 120) || "Nova conversa",
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

export async function insertAgentMessage(input: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  toolActions: AgentToolAction[];
}): Promise<void> {
  const { error } = await db.from("agent_messages").insert({
    conversation_id: input.conversationId,
    user_id: input.userId,
    role: input.role,
    content: input.content,
    tool_actions: input.toolActions ?? [],
  });
  if (error) throw error;
}

/** Bump em updated_at para a conversa subir no topo da lista. */
export async function touchConversation(conversationId: string): Promise<void> {
  const { error } = await db
    .from("agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function fetchConversationMessages(
  conversationId: string
): Promise<AgentMessageRow[]> {
  const { data, error } = await db
    .from("agent_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as AgentMessageRow[];
}

async function fetchConversations(): Promise<AgentConversationRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await db
    .from("agent_conversations")
    .select("*")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as AgentConversationRow[];
}

async function deleteConversationRow(id: string): Promise<void> {
  const { error } = await db.from("agent_conversations").delete().eq("id", id);
  if (error) throw error;
}

async function renameConversationRow(input: {
  id: string;
  title: string;
}): Promise<void> {
  const title = input.title.trim().slice(0, 120) || "Nova conversa";
  const { error } = await db
    .from("agent_conversations")
    .update({ title })
    .eq("id", input.id);
  if (error) throw error;
}

// --- Hook para a lista de conversas (sidebar da AgentPage) -----------------

export function useAgentHistory() {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["agent-conversations"],
    queryFn: fetchConversations,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversationRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: renameConversationRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
    },
  });

  return {
    conversations: conversationsQuery.data || [],
    isLoadingConversations: conversationsQuery.isLoading,
    deleteConversation: deleteMutation.mutateAsync,
    renameConversation: renameMutation.mutateAsync,
  };
}
