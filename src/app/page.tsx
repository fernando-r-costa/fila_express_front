// 1. Primeiro, importe o componente Button que você adicionou
import { Button } from '@/components/ui/button';

// Opcional: Para adicionar ícones, importe-os de lucide-react (instalado com o shadcn)
import { Mail, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    // Adicionei 'flex-col' e 'gap-4' para organizar os elementos verticalmente
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-5xl font-bold text-blue-500">
        Tailwind CSS Funcionando!
      </h1>

      {/* 2. Agora vamos usar os botões com diferentes estilos (variants) */}

      <p className="text-muted-foreground">Exemplos de botões do Shadcn/UI:</p>

      {/* Botão Padrão (Primary) */}
      <Button>Botão Padrão</Button>

      {/* Variante "destructive" (para ações de perigo) */}
      <Button variant="destructive">Excluir Registro</Button>

      {/* Variante "outline" */}
      <Button variant="outline">Ver Detalhes</Button>

      {/* Variante "secondary" */}
      <Button variant="secondary">Editar</Button>

      {/* Variante "ghost" (quase invisível) */}
      <Button variant="ghost">
        <Mail className="mr-2 h-5 w-5" />
        Reenviar
      </Button>

      {/* Variante com Ícone */}
      <Button size="lg">
        <CheckCircle className="mr-2 h-5 w-5" /> Salvar Alterações
      </Button>
    </main>
  );
}
