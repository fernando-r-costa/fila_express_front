export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-texture bg-cover bg-center bg-no-repeat px-6">
      <div className="flex flex-col items-center justify-center rounded-2xl bg-black/70 px-8 py-10 text-center">
        <img
          src="/wallpapers/logo_fundo_preto.png"
          alt="Logo do Salão"
          className="mb-8 h-auto w-full max-w-[250px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]"
        />
        <h1 className="text-xl font-semibold uppercase tracking-[0.2em] text-white md:text-3xl">
          NOVIDADES EM BREVE, AGUARDEM
        </h1>
      </div>
    </main>
  );
}
