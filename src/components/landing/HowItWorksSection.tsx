import { PenTool, Play, Gamepad2, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: PenTool,
    title: "Create",
    description:
      "Build your quiz with questions, images, hints, and customize the theme to match your style.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Play,
    title: "Host",
    description:
      "Start a game session and share the code. Control the pace and monitor player progress in real-time.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Gamepad2,
    title: "Play",
    description:
      "Players join with the game code, answer questions, use power-ups, and compete for the top spot.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center text-center max-w-xs">
                <div
                  className={`w-20 h-20 rounded-2xl ${step.bgColor} flex items-center justify-center mb-4`}
                >
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="hidden lg:block w-8 h-8 text-muted-foreground/30 mx-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
