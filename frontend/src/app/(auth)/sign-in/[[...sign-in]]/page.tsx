"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page() {
    const { theme } = useTheme();

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-background relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
                {/* Logo Premium */}
                <div className="mb-10 flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30 transform hover:scale-105 transition-transform duration-500">
                        <span className="text-3xl font-bold text-white">M</span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            Manager<span className="text-primary">Show</span>
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground mt-1 opacity-80">
                            A plataforma definitiva para sua gestão.
                        </p>
                    </div>
                </div>

                <div className="w-full shadow-2xl rounded-2xl overflow-hidden border border-border/50 bg-card">
                    <SignIn
                        appearance={{
                            baseTheme: theme === 'dark' ? dark : undefined,
                            elements: {
                                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm font-bold normal-case rounded-xl h-11',
                                card: 'bg-transparent shadow-none p-8',
                                headerTitle: 'text-xl font-bold text-foreground',
                                headerSubtitle: 'text-sm text-muted-foreground',
                                socialButtonsBlockButton: 'rounded-xl border-border bg-background hover:bg-muted text-foreground font-semibold h-11',
                                formFieldInput: 'rounded-xl border-border bg-background h-11 focus:ring-primary',
                                footerActionLink: 'text-primary hover:text-primary/90 font-bold',
                                identityPreviewText: 'text-foreground',
                                identityPreviewEditButtonIcon: 'text-primary'
                            }
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
