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
    console.log('Confirmando entrada na fila...');

    setTimeout(() => {
      setIsLoading(false);
      onConfirm();
    }, 1500);
  };

  const now = new Date();
  const estimatedServiceTime = new Date(now.getTime() + estimatedTime * 60000); // 60000ms = 1 minuto
  const formattedEta = estimatedServiceTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  console.log(`Horário estimado de atendimento: ${formattedEta}`);

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Tempo de Espera</CardTitle>
        <CardDescription>
          Este é o tempo estimado para o atendimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-6xl font-bold text-primary">{estimatedTime} min</p>
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
          Concordar e Entrar na Fila
        </Button>
        <Button
          onClick={onGoBack}
          variant="secondary"
          className="w-full"
          disabled={isLoading}
        >
          Voltar e Modificar Serviços
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
  );
}
