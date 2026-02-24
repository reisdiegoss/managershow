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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body class={`${inter.className} bg-slate-50 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
