import { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useAgent, type AgentMessage } from "@/hooks/useAgent";
import { useAgentHistory } from "@/hooks/useAgentHistory";
import { EXPANDED_TOOL_LABELS } from "@/lib/agent/expanded-tools";
import { AGENT_PROFILES } from "@/lib/agent/agentProfiles";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Trash2,
  Loader2,
  Zap,
  Settings,
  BarChart3,
  TrendingDown,
  TrendingUp,
  ListFilter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Plus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Quick actions are now dynamic per agent profile

function ToolActionBadge({ toolName, status }: { toolName: string; status: "success" | "error" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "success"
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
      )}
    >
      {status === "success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {EXPANDED_TOOL_LABELS[toolName] || toolName}
    </span>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";
  const [showTools, setShowTools] = useState(false);
  const hasTools = message.toolActions && message.toolActions.length > 0;

  // Simple markdown-like formatting: **bold**, newlines
  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
          isUser ? "bg-primary" : "bg-gradient-to-br from-violet-600 to-indigo-600"
        )}
      >
        {isUser ? "G" : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("max-w-[80%] space-y-1.5", isUser ? "items-end" : "items-start")}>
        {/* Tool actions (collapsible) */}
        {hasTools && (
          <div className="flex flex-col gap-1">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowTools((v) => !v)}
            >
              {showTools ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {message.toolActions!.length} ação(ões) executada(s)
            </button>
            {showTools && (
              <div className="flex flex-wrap gap-1">
                {message.toolActions!.map((action, i) => (
                  <ToolActionBadge key={i} toolName={action.toolName} status={action.status} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {formatContent(message.content)}
        </div>

        {/* Timestamp */}
        <p className={cn("text-[10px] text-muted-foreground px-1", isUser ? "text-right" : "text-left")}>
          {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function AgentPage() {
  const { selectedCustomer: selectedCustomer } = useAuthStore();
  const {
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
  } = useAgent();
  const { conversations, deleteConversation } = useAgentHistory();
  const currentProfile = AGENT_PROFILES.find((p) => p.id === activeProfile) || AGENT_PROFILES[0];

  const handleDeleteConversation = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (id === conversationId) newConversation();
  };
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = hasApiKey && isConnected && !isLoading;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-6">
      {/* Sidebar: histórico de conversas */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background">
        <div className="flex items-center justify-between border-b px-3 py-3 shrink-0">
          <span className="text-sm font-semibold">Conversas</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={newConversation}>
            <Plus className="h-3.5 w-3.5" /> Nova
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {conversations.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Nenhuma conversa ainda
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => loadConversation(c.id, c.profile)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                  conversationId === c.id ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("pt-BR", { 
                      day: "2-digit", 
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, c.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Excluir conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Coluna do chat */}
      <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm text-lg">
            {currentProfile.emoji}
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">{currentProfile.name}</h1>
            <p className="text-xs text-muted-foreground">
              {isConnected ? (
                <>Conectado a <span className="font-medium">{selectedCustomer?.descriptiveName || selectedCustomer?.id}</span></>
              ) : (
                "Sem conta conectada"
              )}
            </p>
          </div>
          {/* Agent Switcher */}
          <div className="flex gap-1 ml-4">
            {AGENT_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => switchProfile(profile.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeProfile === profile.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span>{profile.emoji}</span>
                <span className="hidden sm:inline">{profile.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearHistory}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(!hasApiKey || !isConnected) && (
        <div className="px-6 pt-4 space-y-2 shrink-0">
          {!hasApiKey && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Configure sua chave da API Anthropic em{" "}
                <Link to="/settings" className="font-medium underline">
                  Configurações
                </Link>{" "}
                para usar o assistente.
              </AlertDescription>
            </Alert>
          )}
          {!isConnected && (
            <Alert>
              <AlertDescription>
                Conecte uma conta de anúncios em{" "}
                <Link to="/settings" className="font-medium underline">
                  Configurações
                </Link>{" "}
                para continuar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-6 max-w-3xl mx-auto">
          {/* Empty state */}
          {isEmpty && hasApiKey && isConnected && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg text-3xl">
                {currentProfile.emoji}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{currentProfile.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {currentProfile.description}
                </p>
              </div>

              {/* Quick actions from profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-4">
                {currentProfile.quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Quick actions (condensed, when chat has messages) */}
          {!isEmpty && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                disabled={!canSend}
                onClick={() => sendMessage(currentProfile.quickActions[0]?.prompt || "Briefing completo")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Briefing
              </Button>
              {currentProfile.quickActions.slice(0, 3).map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-7"
                  disabled={!canSend}
                  onClick={() => sendMessage(action.prompt)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Textarea + send */}
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder={
                !hasApiKey
                  ? "Configure a API key Anthropic para usar o assistente..."
                  : !isConnected
                  ? "Conecte uma conta de anúncios para continuar..."
                  : "Pergunte algo ou peça uma ação... (Enter para enviar, Shift+Enter para nova linha)"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!canSend}
              rows={2}
              className="resize-none flex-1 text-sm"
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSend}
              disabled={!canSend || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Briefing button (empty state) */}
          {isEmpty && hasApiKey && isConnected && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => sendMessage(currentProfile.quickActions[0]?.prompt || "Briefing completo")}
              disabled={isLoading}
            >
              <Zap className="mr-2 h-4 w-4" />
              Gerar Briefing Matinal
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
