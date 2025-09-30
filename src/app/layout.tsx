import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const sqindra = localFont({
  src: '../assets/fonts/sqindra.ttf',
  display: 'swap',
  variable: '--font-sqindra',
});

export const metadata: Metadata = {
  title: 'Salão Express',
  description: 'Sua fila de beleza virtual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={sqindra.variable}>
      <body className="bg-foreground bg-texture">{children}</body>
    </html>
  );
}
