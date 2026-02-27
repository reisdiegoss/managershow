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
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        layout: {
          socialButtonsVariant: "auto",
          logoPlacement: "inside",
        },
        variables: {
          colorPrimary: "#4f46e5", // indigo-600
          colorBackground: "#0f172a", // slate-900
          colorText: "#f8fafc", // slate-50
          colorTextOnPrimaryBackground: "#ffffff",
          colorInputBackground: "#1e293b", // slate-800
          colorInputText: "#f8fafc", // slate-50
          colorDanger: "#e11d48", // rose-600
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-2xl border border-slate-800",
          headerTitle: "font-black italic text-slate-50",
          headerSubtitle: "text-slate-400 font-medium",
          socialButtonsBlockButton: "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200",
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold uppercase tracking-wide",
          formFieldInput: "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500",
          formFieldLabel: "text-slate-300 font-bold",
          dividerLine: "bg-slate-800",
          dividerText: "text-slate-500",
          footerActionLink: "text-indigo-400 hover:text-indigo-300 font-bold",
          identityPreviewText: "text-slate-300",
          identityPreviewEditButtonIcon: "text-indigo-400"
        }
      }}
    >
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#020617" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body className={`${inter.className} antialiased selection:bg-indigo-500/30`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <DatabaseProvider>
              {children}
            </DatabaseProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
