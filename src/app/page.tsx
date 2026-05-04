import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-texture bg-cover bg-center bg-no-repeat px-6">
      <div className="flex flex-col items-center justify-center rounded-2xl bg-black/70 px-8 py-10 text-center">
        <Image
          src="/wallpapers/logo_fundo_preto.png"
          alt="Logo do Salão"
          width={600}
          height={150}
          className="mb-8 h-auto max-w-[90%]"
          priority
        />
        <h1 className="text-xl font-semibold uppercase tracking-[0.2em] text-white md:text-3xl">
          NOVIDADES EM BREVE, AGUARDEM
        </h1>
      </div>
    </main>
  );
}
