'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TimeEstimateViewProps {
  estimatedTime?: number;
  onConfirm: () => void;
  onGoBack: () => void;
  onCancel: () => void;
}

export function TimeEstimateView({
  estimatedTime = 45,
  onConfirm,
  onGoBack,
  onCancel,
}: TimeEstimateViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmClick = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onConfirm();
    }, 1500);
  };

  const now = new Date();
  const estimatedServiceTime = new Date(now.getTime() + estimatedTime * 60000);
  const formattedEta = estimatedServiceTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <form>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Tempo de Espera</CardTitle>
          <CardDescription>
            Este é o tempo estimado
            <br /> para o atendimento:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">{estimatedTime} min</p>
          <p className="mt-2 text-lg text-muted-foreground">
            Horário Previsto:{' '}
            <span className="font-semibold text-primary">{formattedEta}</span>
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleConfirmClick}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar na Fila
          </Button>
          <Button
            onClick={onGoBack}
            variant="secondary"
            className="w-full"
            disabled={isLoading}
          >
            Modificar Serviços
          </Button>
          <Button
            onClick={onCancel}
            variant="destructive"
            className="w-full"
            disabled={isLoading}
          >
            Cancelar Solicitação
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
