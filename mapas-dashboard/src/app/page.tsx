import { AuthForms } from "@/components/AuthForms"

export default function AuthPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute w-full h-full opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[1600px] animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-widest text-slate-200 uppercase">MAPAS <span className="text-sky-500">System</span></h1>
          <p className="text-xs font-mono text-slate-500">RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY</p>
        </div>

        <AuthForms />
      </div>
    </div>
  )
}
