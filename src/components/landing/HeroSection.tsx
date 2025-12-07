"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-purple-500/10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Real-time multiplayer quizzes
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          Quiz0r
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Create engaging quizzes, host interactive game sessions, and compete
          with players worldwide in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-lg px-8 py-6 min-w-[180px]">
            <Link href="/admin">Create Quiz</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6 min-w-[180px]"
          >
            <Link href="/host">Host Game</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 min-w-[180px]"
          >
            <Link href="/play">Join Game</Link>
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
