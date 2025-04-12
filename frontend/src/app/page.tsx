import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/hero-image";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 flex flex-col md:flex-row items-center justify-between gap-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Explain<span className="text-primary">GPT</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            Understand and visualize how AI language models process and generate
            text. A powerful tool for researchers, developers, and AI
            enthusiasts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/playground">Try It Now</Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 relative h-[300px] sm:h-[400px] w-full rounded-xl overflow-hidden border shadow-md">
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
            <HeroImage />
          </div>
        </div>
      </section>

      {/* Explainer Section */}
      <section className="py-16 bg-secondary/10 w-full">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Peek Inside the Black Box</h2>
          <p className="text-lg text-muted-foreground mb-8">
            ExplainGPT provides unprecedented visibility into how large language
            models process and generate text. By visualizing attention patterns,
            token probabilities, and internal model states, ExplainGPT
            transforms opaque AI systems into transparent, interpretable tools.
          </p>
          <p className="text-lg text-muted-foreground">
            Whether you're debugging AI behavior, researching model
            capabilities, or simply curious about how these systems work,
            ExplainGPT gives you the insights you need with a familiar,
            intuitive interface.
          </p>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 w-full">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Attention Visualization",
                description:
                  "See exactly how models attend to different parts of text, revealing the connections they form between words and concepts.",
              },
              {
                title: "Token Probability Exploration",
                description:
                  "Examine alternative tokens the model considered and their probabilities, understanding why certain words were chosen.",
              },
              {
                title: "Model Playground",
                description:
                  "Experiment with different prompts and parameters in real-time, instantly observing how they affect model behavior.",
              },
              {
                title: "Familiar Chat Interface",
                description:
                  "Interact with AI models through an intuitive chat interface you're already comfortable using.",
              },
              {
                title: "Extensibility",
                description:
                  "Connect to any text generation model available on the Hugging Face Hub, extending beyond default options.",
              },
              {
                title: "Advanced Analysis Tools",
                description:
                  "Dive deeper with specialized analysis tools designed for researchers and AI developers.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5 w-full">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start experimenting with ExplainGPT now and gain a deeper
            understanding of AI language models.
          </p>
          <Button size="lg" asChild>
            <Link href="/app">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t w-full">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} ExplainGPT. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link
              href="https://github.com/anandrajaram21/ExplainGPT"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
