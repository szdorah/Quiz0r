"use client";

import { NavHeader } from "@/components/nav-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-4 py-4 sm:py-8">{children}</main>
    </div>
  );
}
