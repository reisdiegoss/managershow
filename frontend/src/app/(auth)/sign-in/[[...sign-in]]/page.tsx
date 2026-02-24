import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <main class="flex min-h-screen w-full items-center justify-center bg-slate-50">
            <div class="relative flex flex-col items-center">
                {/* Logo superior para reforçar a marca no login */}
                <div class="mb-8 flex flex-col items-center gap-2">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
                        <span class="text-2xl font-bold text-white italic">M</span>
                    </div>
                    <h1 class="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                        Manager <span class="text-indigo-600">Show</span>
                    </h1>
                </div>

                <SignIn
                    appearance={{
                        elements: {
                            formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md',
                            card: 'shadow-2xl border-none p-8',
                            headerTitle: 'text-slate-900 font-bold',
                            headerSubtitle: 'text-slate-500',
                        }
                    }}
                />
            </div>
        </main>
    );
}
