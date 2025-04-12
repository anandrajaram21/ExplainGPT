"use client";

import { PageContainer } from "@/components/page-container";

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

      <div className="bg-card rounded-xl shadow-md overflow-hidden border w-full p-6">
        <div className="text-center text-muted-foreground p-12">
          <p>Attention visualization features coming soon</p>
        </div>
      </div>
    </PageContainer>
  );
}
