import React from "react";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/lib/api/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <span>{isUser ? "👤" : "🤖"}</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-semibold">{isUser ? "You" : "AI Assistant"}</div>
        <div className={cn("prose break-words", isLoading && "animate-pulse")}>
          {message.content ||
            (isLoading && <span className="opacity-70">Thinking...</span>)}
        </div>
      </div>
    </div>
  );
}
