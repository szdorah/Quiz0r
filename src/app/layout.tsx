import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DarkModeProvider } from "@/contexts/DarkModeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz0r",
  description: "Real-time multiplayer quiz application",
  icons: {
    icon: "/quiz0r-logo.png",
    shortcut: "/quiz0r-logo.png",
    apple: "/quiz0r-logo.png",
  },
};

// Inline script to set dark mode before React hydrates (prevents FOUC)
const darkModeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('quiz0r-dark-mode');
      var isDark = stored !== null
        ? stored === 'true'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className={inter.className}>
        <DarkModeProvider>
          {children}
          <Toaster />
        </DarkModeProvider>
      </body>
    </html>
  );
}
