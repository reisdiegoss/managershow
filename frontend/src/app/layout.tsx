import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manager Show - Sistema de Gestão Artística",
  description: "O sistema operacional definitivo para a carreira artística.",
};

import { Toaster } from "@/components/ui/toaster";
import { DatabaseProvider } from "@/components/providers/DatabaseProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" className="dark">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#020617" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body className={`${inter.className} antialiased selection:bg-indigo-500/30`}>
          <DatabaseProvider>
            {children}
          </DatabaseProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
