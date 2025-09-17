import './globals.css'; // A linha mais importante!

export const metadata = {
  title: 'Teste Tailwind',
  description: 'Testando a instalação do Tailwind CSS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
