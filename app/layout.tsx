import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rixie · Prepare for what's next",
  description: "A mobile-first event-preparation app",
  icons: {
    icon: "/rixie-app-icon.png",
    apple: "/rixie-app-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
