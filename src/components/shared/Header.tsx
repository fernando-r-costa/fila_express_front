import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="my-6 w-full bg-foreground/50">
      <div className="container mx-auto flex justify-center">
        <Link href="/">
          <Image
            src="/wallpapers/logo_fundo_preto.png"
            alt="Logo do Salão Express"
            width={350}
            height={50}
            className="h-auto w-auto max-w-[350px]"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
