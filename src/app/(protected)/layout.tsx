"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const linkClasses = (active: boolean) =>
    `group rounded px-3 py-2 flex items-center gap-3 transition-colors ${
      active ? "bg-white/10 border border-white/10 text-white" : "hover:bg-gray-700/70 text-gray-300"
    }`;
  const iconClasses = (active: boolean) =>
    `${active ? "w-5 h-5 text-white" : "w-5 h-5 text-gray-300 group-hover:text-white transition-colors"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white grid grid-cols-[240px_1fr]">
      <aside className="bg-gray-800/80 backdrop-blur p-4 space-y-4 border-r border-gray-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transkripta</h2>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/nova-transcricao" aria-current={pathname?.startsWith("/nova-transcricao") ? "page" : undefined} className={linkClasses(pathname?.startsWith("/nova-transcricao") ?? false)}>
            <svg className={iconClasses(pathname?.startsWith("/nova-transcricao") ?? false)} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="2" />
              <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Nova Transcrição</span>
          </Link>
          <Link href="/historico" aria-current={pathname?.startsWith("/historico") ? "page" : undefined} className={linkClasses(pathname?.startsWith("/historico") ?? false)}>
            <svg className={iconClasses(pathname?.startsWith("/historico") ?? false)} viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Histórico</span>
          </Link>
          <Link href="/social-downloader" aria-current={pathname?.startsWith("/social-downloader") ? "page" : undefined} className={linkClasses(pathname?.startsWith("/social-downloader") ?? false)}>
            <svg className={iconClasses(pathname?.startsWith("/social-downloader") ?? false)} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 4v8" stroke="currentColor" strokeWidth="2" />
              <path d="M8 8l4 4 4-4" stroke="currentColor" strokeWidth="2" />
              <path d="M4 20h16" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Social Downloader</span>
          </Link>
          <Link href="/configuracoes" aria-current={pathname?.startsWith("/configuracoes") ? "page" : undefined} className={linkClasses(pathname?.startsWith("/configuracoes") ?? false)}>
            <svg className={iconClasses(pathname?.startsWith("/configuracoes") ?? false)} viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M4.9 19.1l2.1-2.1M16.9 7.1l2.1-2.1" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Configurações</span>
          </Link>
        </nav>
        <form action="/api/logout" method="post" className="mt-4">
          <button className="btn btn-secondary w-full">Sair</button>
        </form>
      </aside>
      <main className="px-8 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}