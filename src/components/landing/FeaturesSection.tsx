import {
  Users,
  Zap,
  Languages,
  Palette,
  QrCode,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Real-time Multiplayer",
    description:
      "Compete with players instantly. See live scores, answers, and leaderboards as the game progresses.",
  },
  {
    icon: Zap,
    title: "Power-ups",
    description:
      "Use Hints, Copy Answers from top players, or Double your Points to gain strategic advantages.",
  },
  {
    icon: Languages,
    title: "Multi-language Support",
    description:
      "Create quizzes in any language. AI-powered translations help reach global audiences.",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description:
      "Personalize your quiz with custom colors, backgrounds, and visual effects to match your brand.",
  },
  {
    icon: QrCode,
    title: "Easy Joining",
    description:
      "Players join instantly with a simple game code or QR scan. No accounts required.",
  },
  {
    icon: Trophy,
    title: "Certificates",
    description:
      "Generate personalized certificates for winners with AI-crafted congratulatory messages.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features to create engaging quiz experiences for education,
            training, events, and entertainment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
