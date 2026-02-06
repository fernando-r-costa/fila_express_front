import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AILoadingStateProps {
  message?: string;
  description?: string;
  aiName?: string;
}

export function AILoadingState({
  message = 'Buscando o melhor encaixe',
  description,
  aiName = 'Inteligência Artificial',
}: AILoadingStateProps = {}) {
  const [showDelayMessage, setShowDelayMessage] = useState(false);

  useEffect(() => {
    // Após 30 segundos, mostra mensagem de que está demorando
    const timer = setTimeout(() => {
      setShowDelayMessage(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  // Se description não for fornecida, gera uma com o aiName
  const finalDescription =
    description ||
    `${aiName} está analisando a agenda para reduzir sua espera...`;

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-foreground">{message}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{finalDescription}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {/* Loader circular */}
        <div className="relative h-16 w-16">
          <svg
            className="h-full w-full animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Aguarde um momento...
        </p>
        {showDelayMessage && (
          <p className="mt-3 animate-pulse text-sm font-semibold text-amber-600 dark:text-amber-400">
            Está demorando um pouco mais, mas já vamos te informar!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
