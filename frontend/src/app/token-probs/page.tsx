"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TokenSequence } from "./components/token-sequence";
import {
  sendPrompt,
  type TokenProbsResponse,
  type ApiResponse,
  type PromptRequest,
} from "@/lib/api";

export default function TokenProbsPage() {
  const [tokenData, setTokenData] = useState<TokenProbsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(5);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promptData: PromptRequest = {
        text: prompt,
        max_length: maxTokens,
      };

      const response = await sendPrompt(promptData);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setTokenData(response.data);
      }
    } catch (err) {
      setError(
        `Error sending prompt: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Token Probabilities Visualizer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter a prompt below to see how the AI model predicts each token
            with confidence scores
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-md overflow-hidden border">
          <div className="p-6 bg-muted bg-opacity-50">
            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="prompt"
                  className="text-sm font-medium flex items-center justify-between"
                >
                  <span>Enter Prompt</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Max Tokens:
                    </span>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="w-20 h-8"
                      disabled={loading}
                    />
                  </div>
                </label>
                <div className="relative">
                  <Input
                    id="prompt"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your prompt here..."
                    className="pr-32 py-6 text-lg"
                    disabled={loading}
                  />
                  <div className="absolute right-1 top-1">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="sm"
                      className="h-10"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing
                        </span>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The model will generate token probabilities based on this
                  input text
                </p>
              </div>
            </form>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-y border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="p-0 md:p-2">
            <div className={`rounded-lg ${tokenData ? "bg-muted/30" : ""}`}>
              {tokenData ? (
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-xl font-semibold">Token Predictions</h2>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        High Probability
                      </span>
                      <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                        Low Probability
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    Hover over each token to see alternative predictions
                  </div>

                  <div className="min-h-[300px]">
                    <TokenSequence
                      tokenSteps={tokenData.token_probs || []}
                      isLoading={loading}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-4xl opacity-20">💬</div>
                    <p className="text-muted-foreground text-lg">
                      Enter a prompt above and click "Generate" to visualize
                      token probabilities
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
