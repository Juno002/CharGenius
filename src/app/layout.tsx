
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CharacterProvider } from "@/context/CharacterContext";
import { AppLayout } from "@/components/AppLayout";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { LanguageProvider } from "@/context/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomBackground } from "@/components/CustomBackground";

export const metadata: Metadata = {
  title: "CharGenius",
  description: "Create and manage your characters with AI assistance.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0a081a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter antialiased quantum-bg">
        <ThemeInitializer />
        <LanguageProvider>
          <CharacterProvider>
            <CustomBackground />
            <TooltipProvider delayDuration={200}>
              <AppLayout>{children}</AppLayout>
              <MobileBottomNav />
            </TooltipProvider>
          </CharacterProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
