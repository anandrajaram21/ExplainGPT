"use client";

import { PageContainer } from "@/components/page-container";
import { AttentionVisualizer } from "@/components/attention-visualizer";

export default function AttentionPage() {
  return (
    <PageContainer>
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Attention Visualization
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See exactly how models attend to different parts of text
        </p>
      </div>

      <div className="w-full my-6">
        <AttentionVisualizer />
      </div>
    </PageContainer>
  );
}
