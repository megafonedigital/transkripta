export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <div className="container py-24">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Transkripta</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Uma experiência simples e elegante para transcrever áudios e baixar conteúdos de redes sociais. Entre para começar.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/login" className="btn btn-primary">Entrar</a>
            <a href="/social-downloader" className="btn btn-secondary">Downloader</a>
          </div>
        </div>
      </div>
    </main>
  );
}
