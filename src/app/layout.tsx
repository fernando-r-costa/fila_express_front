import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';

const sqindra = localFont({
  src: '../assets/fonts/sqindra.ttf',
  display: 'swap',
  variable: '--font-sqindra',
});

export const metadata: Metadata = {
  title: 'Amauty Alves',
  description: 'Sua fila de beleza virtual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${sqindra.variable} scroll-smooth`}>
      <body className="flex min-h-0 flex-1 flex-col bg-foreground bg-texture bg-cover bg-center bg-no-repeat">
        <Suspense
          fallback={
            <div className="flex flex-grow animate-pulse items-center justify-center">
              <div className="text-xl font-bold">Carregando...</div>
            </div>
          }
        >
          <main className="flex-grow overflow-y-auto">{children}</main>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
