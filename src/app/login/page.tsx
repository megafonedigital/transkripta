import { redirect } from "next/navigation";
import { checkEnvCredentials, createSession } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
  async function action(formData: FormData) {
    "use server";
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");
    const ok = checkEnvCredentials(username, password);
    if (!ok) {
      return;
    }
    await createSession(username);
    redirect("/nova-transcricao");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <div className="grid md:grid-cols-2 min-h-screen">
        {/* Painel visual / branding */}
        <section className="hidden md:flex relative overflow-hidden p-12 items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20" />
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="relative z-10 text-center space-y-4">
            <Image src="/globe.svg" alt="Marca Transkripta" className="mx-auto w-20 h-20 opacity-80" width={80} height={80} />
            <h1 className="text-4xl font-bold tracking-tight">Transkripta</h1>
            <p className="text-gray-300 max-w-sm mx-auto">Transcreva conteúdos e acompanhe seu histórico com uma experiência simples e elegante.</p>
          </div>
        </section>

        {/* Formulário */}
        <section className="flex items-center justify-center p-8">
          <form action={action} className="card w-full max-w-md space-y-6 backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-400">Faça login para continuar</p>
            </div>

            <div className="space-y-2">
              <label className="label">Usuário</label>
              <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-11">
                <span className="text-gray-400 group-focus-within:text-white transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
                <input name="username" className="w-full bg-transparent outline-none text-white placeholder:text-gray-400" placeholder="Digite seu usuário" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Senha</label>
              <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-11">
                <span className="text-gray-400 group-focus-within:text-white transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="6" y="10" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
                <input name="password" type="password" className="w-full bg-transparent outline-none text-white placeholder:text-gray-400" placeholder="Sua senha" />
              </div>
            </div>

            <button className="btn btn-primary w-full transition-transform hover:scale-[1.01]">Entrar</button>
            <p className="text-xs text-gray-500 text-center">Dica: usuário e senha são definidos nas variáveis de ambiente do servidor.</p>
          </form>
        </section>
      </div>
    </main>
  );
}