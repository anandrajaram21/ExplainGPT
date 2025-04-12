"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * API function to change the model
 */
async function changeModel(
  modelName: string
): Promise<{ status: number; message: string }> {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${API_BASE_URL}/model/change_model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model_name: modelName }),
    });

    if (!response.ok) {
      return {
        status: response.status,
        message: `Failed to change model: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 500,
      message: `Error changing model: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

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
      setMessage(response.message);
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
