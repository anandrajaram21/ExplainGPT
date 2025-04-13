"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, resetChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change or during streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <PageContainer>
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Chat Interface</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a conversation with the AI model with streaming responses
        </p>
      </div>

      <div className="flex flex-col h-[calc(100vh-16rem)] w-full mt-8 bg-card rounded-xl shadow-md overflow-hidden border">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <h3 className="text-lg font-medium">Conversation</h3>
          {messages.length > 0 && (
            <Button variant="ghost" onClick={resetChat} size="sm">
              Clear Chat
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
              <div className="text-4xl opacity-20 mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="mb-4 max-w-md">
                Ask questions, have a conversation, or get the model to explain
                concepts.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLoading={
                    isLoading &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </PageContainer>
  );
}
