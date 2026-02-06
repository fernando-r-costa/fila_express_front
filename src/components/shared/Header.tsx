import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm">
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
