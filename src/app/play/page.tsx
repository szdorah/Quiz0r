"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const code = gameCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter a game code");
      return;
    }

    if (code.length !== 6) {
      setError("Game code must be 6 characters");
      return;
    }

    router.push(`/play/${code}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Quiz Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Code</label>
                <Input
                  type="text"
                  placeholder="Enter code..."
                  value={gameCode}
                  onChange={(e) =>
                    setGameCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  maxLength={6}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full">
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
