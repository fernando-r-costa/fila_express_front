import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <a
        href="https://wa.me/553499633063"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed right-4 top-4 z-10 opacity-10 outline-none visited:opacity-10 hover:opacity-10 focus:opacity-10 focus:outline-none focus:ring-0 focus-visible:opacity-10 focus-visible:outline-none focus-visible:ring-0 active:opacity-10"
        style={{
          WebkitTapHighlightColor: 'transparent',
          textDecoration: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
      >
        <Image
          src="/wallpapers/frc_logo_removebg.png"
          alt="WhatsApp"
          width={40}
          height={40}
          className="h-7 w-auto sm:h-10"
          style={{ filter: 'brightness(0) invert(1) brightness(1.5)' }}
        />
      </a>
      <div className="container mx-auto flex items-center justify-center py-4">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80 active:scale-95"
        >
          <Image
            src="/wallpapers/logo_fundo_preto.png"
            alt="Logo do Salão Express"
            width={350}
            height={50}
            className="h-auto w-auto max-w-[350px]"
            priority
            quality={90}
          />
        </Link>
      </div>
    </header>
  );
}
