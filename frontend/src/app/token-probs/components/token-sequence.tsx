import React from "react";
import { TokenProbabilityDisplay } from "./token-probability";
import type { TokenStep } from "@/lib/api";

interface TokenSequenceProps {
  tokenSteps: TokenStep[];
  isLoading?: boolean;
}

export function TokenSequence({
  tokenSteps,
  isLoading = false,
}: TokenSequenceProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-8">
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-20"
            ></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-16"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!tokenSteps || tokenSteps.length === 0) {
    return (
      <div className="text-muted-foreground p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-lg">No token data available</p>
        <p className="text-sm mt-2 opacity-70">
          Enter a prompt to generate tokens
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-background shadow-sm min-h-[200px]">
      <div className="flex flex-wrap gap-3 items-start">
        {tokenSteps.map((step) => (
          <TokenProbabilityDisplay
            key={step.step}
            token={step.generated_token.text}
            probability={step.generated_token.probability}
            alternatives={step.top_alternatives}
          />
        ))}
      </div>
    </div>
  );
}
