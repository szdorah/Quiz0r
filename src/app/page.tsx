"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { Sparkles, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Dark mode toggle in top-right */}
      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle showLabel={false} />
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-purple-500/10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content - centered */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Real-time multiplayer quizzes
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Quiz0r
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto mb-12">
            Create, host, and play interactive quizzes in real-time
          </p>

          <Button asChild size="lg" className="text-lg px-10 py-7 min-w-[200px]">
            <Link href="/menu" className="flex items-center gap-2">
              Continue
              <ChevronRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <a
              href="https://err0r.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Err0r.dev
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
