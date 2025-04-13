import React, { useState, FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    onSendMessage(input);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 p-4 border-t bg-background sticky bottom-0"
    >
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !input.trim()}>
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
