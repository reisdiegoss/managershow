import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });

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
          colorPrimary: "#534be7", // Manrope Lavender
          colorBackground: "#ffffff", // Light background
          colorText: "#0f172a", // Slate-900
          colorTextOnPrimaryBackground: "#ffffff",
          colorInputBackground: "#f8fafc", // Slate-50
          colorInputText: "#0f172a", // Slate-900
          colorDanger: "#ef4444", // Red-500
          borderRadius: "0.5rem", // 8px
        },
        elements: {
          card: "shadow-xl border border-slate-200 bg-white",
          headerTitle: "font-black text-slate-900 tracking-tight",
          headerSubtitle: "text-slate-500 font-medium",
          socialButtonsBlockButton: "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800",
          formButtonPrimary: "bg-[#534be7] hover:bg-[#4338ca] shadow-md font-bold uppercase tracking-wide",
          formFieldInput: "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
          formFieldLabel: "text-slate-700 font-bold",
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-400",
          footerActionLink: "text-[#534be7] hover:text-[#4338ca] font-bold",
          identityPreviewText: "text-slate-600",
          identityPreviewEditButtonIcon: "text-[#534be7]"
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
        <body className={`${manrope.className} antialiased selection:bg-[#534be7]/20`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
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
