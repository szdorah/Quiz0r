import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-primary">Quiz0r</h1>
        <p className="text-xl text-muted-foreground">
          Real-time multiplayer quiz game
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Quiz
          </Link>
          <Link
            href="/host"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-8 py-4 text-lg font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Host Game
          </Link>
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-4 text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Join Game
          </Link>
        </div>
      </div>
    </main>
  );
}
