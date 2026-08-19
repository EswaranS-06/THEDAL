import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../components/layout/AppShell";

export const metadata: Metadata = {
  title: "THEDAL — Cybersecurity Lab Control Plane",
  description: "Local Operations Console & Threat Hunting Learning Environment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased selection:bg-primary/30 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
