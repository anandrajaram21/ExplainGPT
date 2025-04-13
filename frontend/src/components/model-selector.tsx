"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeModel } from "@/lib/api/model";

export function ModelSelector() {
  const [modelName, setModelName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await changeModel(modelName);
      setMessage(
        response.data?.message || response.error || "Model changed successfully"
      );
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-2 py-2">
      <div className="text-xs text-muted-foreground">Change Model</div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Enter model name"
          className="h-7 text-xs"
          disabled={loading}
        />
        <Button
          type="submit"
          size="sm"
          className="h-7 px-2"
          disabled={loading || !modelName.trim()}
        >
          {loading ? "..." : "Set"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground italic">
        Default: anandrajaram21/tinystories-test
      </div>
      {message && (
        <div className="text-xs mt-1 text-muted-foreground overflow-hidden text-ellipsis">
          {message}
        </div>
      )}
    </form>
  );
}
