import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import CursorProvider from "@/components/cursor-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExplainGPT",
  description:
    "ExplainGPT is a tool that helps you understand and explain GPT models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CursorProvider>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <div className="w-full flex flex-col">
                <header className="p-4 flex items-center sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
                  <SidebarTrigger className="mr-4" />
                </header>
                <main>{children}</main>
              </div>
            </SidebarProvider>
          </CursorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
