import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PenTool, Presentation, Users } from "lucide-react";

const roles = [
  {
    icon: PenTool,
    title: "Quiz Creator",
    description:
      "Design engaging quizzes with multiple question types, images, hints, and AI-powered translations.",
    cta: "Create a Quiz",
    href: "/admin",
    variant: "default" as const,
  },
  {
    icon: Presentation,
    title: "Game Host",
    description:
      "Run interactive sessions with full control. Manage players, pace questions, and view live analytics.",
    cta: "Host a Game",
    href: "/host",
    variant: "secondary" as const,
  },
  {
    icon: Users,
    title: "Player",
    description:
      "Join games instantly with a code. Answer questions, use power-ups, and climb the leaderboard.",
    cta: "Join a Game",
    href: "/play",
    variant: "outline" as const,
  },
];

export function RoleCardsSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role and jump right in
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => (
            <Card
              key={role.title}
              className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <role.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{role.title}</CardTitle>
                <CardDescription className="text-base">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Button
                  asChild
                  variant={role.variant}
                  className="w-full"
                  size="lg"
                >
                  <Link href={role.href}>{role.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
