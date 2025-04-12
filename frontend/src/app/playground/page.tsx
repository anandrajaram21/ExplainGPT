"use client";

import { PageContainer } from "@/components/page-container";

export default function PlaygroundPage() {
  return (
    <PageContainer>
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Model Playground</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experiment with different prompts and parameters in real-time
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-md overflow-hidden border w-full p-6">
        <div className="text-center text-muted-foreground p-12">
          <p>Playground features coming soon</p>
        </div>
      </div>
    </PageContainer>
  );
}
