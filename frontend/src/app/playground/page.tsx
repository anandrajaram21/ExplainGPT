"use client";

import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlaygroundParams, generatePlaygroundText } from "@/lib/api/model";

export default function PlaygroundPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [params, setParams] = useState<PlaygroundParams>({
    text: "",
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
    max_length: 100,
    num_return_sequences: 1,
  });

  const handleParamChange = (
    name: keyof PlaygroundParams,
    value: number | string
  ) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!params.text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveTab(0); // Reset to first tab when generating new output

    try {
      const response = await generatePlaygroundText(params);

      if (response.data && response.status === 200) {
        setOutput(response.data.outputs);
      } else {
        setError(
          response.error || response.data?.message || "An error occurred"
        );
      }
    } catch (err) {
      setError("Failed to connect to the server");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Model Playground</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experiment with different prompts and parameters in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 w-full mt-8">
        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-card rounded-xl shadow-md overflow-hidden border w-full p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Prompt
                </label>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  size="sm"
                  className="px-4"
                >
                  {isLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
              <textarea
                id="prompt"
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your prompt here..."
                value={params.text}
                onChange={(e) => handleParamChange("text", e.target.value)}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-card rounded-xl shadow-md overflow-hidden border w-full">
            <div className="border-b px-6 py-3 flex items-center justify-between bg-muted/50">
              <h3 className="text-lg font-medium">Output</h3>
              {output.length > 1 && (
                <div className="text-xs text-muted-foreground">
                  {params.num_return_sequences} sequences generated
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 mx-6 my-4 rounded-md bg-destructive/10 border border-destructive text-destructive">
                {error}
              </div>
            )}

            {output.length > 0 ? (
              <div>
                {/* Tab navigation for multiple sequences */}
                {output.length > 1 && (
                  <div className="flex overflow-x-auto border-b scrollbar-none">
                    {output.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={cn(
                          "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                          activeTab === i
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                      >
                        Sequence {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Output content */}
                <div className="p-6">
                  <div className="rounded-md bg-background border overflow-hidden">
                    <div className="px-4 py-2 bg-muted/30 border-b text-xs flex items-center justify-between">
                      <span className="font-medium">Generated Text</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {output[activeTab].length} characters
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(output[activeTab])
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="p-4 max-h-[500px] overflow-y-auto">
                      <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {output[activeTab]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                {isLoading ? (
                  <>
                    <div className="animate-pulse mb-4 h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <p>Generating output...</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">No output generated yet</p>
                    <p className="text-xs">
                      Use the Generate button to create text
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Parameters Section */}
        <div className="bg-card rounded-xl shadow-md overflow-hidden border h-fit sticky top-20 p-6 space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Parameters</h3>

          <div className="space-y-6">
            <SliderControl
              label="Temperature"
              value={params.temperature}
              onChange={(value) => handleParamChange("temperature", value)}
              min={0}
              max={2}
              step={0.1}
              description="Higher values produce more random outputs"
            />

            <SliderControl
              label="Top K"
              value={params.top_k}
              onChange={(value) => handleParamChange("top_k", value)}
              min={1}
              max={100}
              step={1}
              description="Limits token selection to top K options"
            />

            <SliderControl
              label="Top P"
              value={params.top_p}
              onChange={(value) => handleParamChange("top_p", value)}
              min={0}
              max={1}
              step={0.05}
              description="Nucleus sampling parameter"
            />

            <SliderControl
              label="Max Length"
              value={params.max_length}
              onChange={(value) => handleParamChange("max_length", value)}
              min={10}
              max={1000}
              step={10}
              description="Maximum number of tokens to generate"
            />

            <SliderControl
              label="Number of Sequences"
              value={params.num_return_sequences}
              onChange={(value) =>
                handleParamChange("num_return_sequences", value)
              }
              min={1}
              max={5}
              step={1}
              description="Number of different sequences to generate"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// Custom slider component
function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "w-full h-2 rounded-full appearance-none bg-accent",
            "range-slider"
          )}
        />
        <span className="text-xs text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}
