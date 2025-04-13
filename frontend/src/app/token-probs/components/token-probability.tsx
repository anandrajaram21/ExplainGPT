import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TokenProbability } from "@/lib/api/tokenProbs";

interface TokenProbabilityProps {
  token: string;
  probability: number;
  alternatives?: TokenProbability[];
}

export function TokenProbabilityDisplay({
  token,
  probability,
  alternatives,
}: TokenProbabilityProps) {
  // Function to get a displayable version of tokens that might be whitespace or special chars
  const getDisplayToken = (text: string) => {
    if (text === " " || text === "\u00A0" || text === "\t") return "[SPACE]";
    if (text === "\n") return "[NEWLINE]";
    if (text === "\r") return "[RETURN]";
    if (text === "") return "[EMPTY]";
    if (/^\s+$/.test(text)) return "[WHITESPACE]";
    if (text.length === 0) return "[EMPTY]";
    return text;
  };

  // Calculate color based on probability (green for 100%, red for 0%)
  const getColorStyle = (prob: number) => {
    // Convert probability to a 0-255 scale for RGB
    const red = Math.round(255 * (1 - prob));
    const green = Math.round(255 * prob);

    // Create a gradient background that's more visually appealing
    return {
      background: `linear-gradient(135deg, rgba(${red}, ${green}, 0, 0.2), rgba(${red}, ${green}, 0, 0.4))`,
      color: `rgb(${Math.min(red + 40, 255)}, ${Math.min(
        green + 40,
        255
      )}, 40)`,
      boxShadow: `0 2px 4px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(${red}, ${green}, 0, 0.2)`,
      borderColor: `rgba(${red}, ${green}, 0, 0.3)`,
    };
  };

  // Get the displayable version of the token
  const displayToken = getDisplayToken(token);
  const isSpecialToken = displayToken !== token;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block px-3 py-2 rounded-md font-mono text-base md:text-lg",
              "border transition-all duration-150 ease-in-out",
              "hover:shadow-md cursor-help",
              "transform hover:-translate-y-0.5",
              isSpecialToken && "italic opacity-80"
            )}
            style={getColorStyle(probability)}
          >
            {displayToken}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="z-50 max-w-md bg-popover text-popover-foreground shadow-lg rounded-lg border overflow-hidden"
          align="start"
          sideOffset={5}
        >
          <div className="p-3">
            <div className="font-semibold border-b pb-2 flex justify-between items-center">
              <div className="font-mono">
                {isSpecialToken ? (
                  <div className="flex flex-col">
                    <span>{displayToken}</span>
                    <span className="text-xs text-muted-foreground font-normal mt-1">
                      Original: {token === " " ? "Space" : `'${token}'`}
                    </span>
                  </div>
                ) : (
                  <span>{token}</span>
                )}
              </div>
              <span className="ml-4 text-sm px-2 py-0.5 rounded-full bg-muted">
                {(probability * 100).toFixed(2)}%
              </span>
            </div>
            {alternatives && alternatives.length > 0 && (
              <div className="space-y-2 text-sm pt-2">
                <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  ALTERNATIVE TOKENS:
                </p>
                <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                  {alternatives.map((alt, i) => {
                    const altDisplayToken = getDisplayToken(alt.text);
                    const isAltSpecial = altDisplayToken !== alt.text;

                    return (
                      <li
                        key={i}
                        className={cn(
                          "flex justify-between items-center px-2 py-1 rounded",
                          alt.selected &&
                            "bg-green-500/10 dark:bg-green-500/20 border-l-2 border-green-500"
                        )}
                      >
                        <span
                          className={cn("font-mono", isAltSpecial && "italic")}
                        >
                          {altDisplayToken}
                          {isAltSpecial && (
                            <span className="text-xs ml-1 text-muted-foreground">
                              {alt.text === " " ? "(space)" : ""}
                            </span>
                          )}
                        </span>
                        <span className="ml-4 text-xs px-2 py-0.5 rounded-full bg-muted">
                          {(alt.probability * 100).toFixed(2)}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
