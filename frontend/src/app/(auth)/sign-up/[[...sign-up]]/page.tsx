import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-[#020617] relative overflow-hidden selection:bg-indigo-500/30">
            <div className="relative flex flex-col items-center">
                {/* Logo superior para reforçar a marca no Sign-Up */}
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
                        <span className="text-2xl font-bold text-white italic">M</span>
                    </div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-50">
                        Manager <span className="text-indigo-500">Show</span>
                    </h1>
                </div>

                <SignUp />
            </div>
        </main>
    );
}
