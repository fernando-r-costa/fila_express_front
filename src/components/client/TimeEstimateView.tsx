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
  startTime?: string;
  position?: number;
  analysis?: string;
  aiName?: string;
  onConfirm: () => void;
  onGoBack: () => void;
  onCancel: () => void;
}

export function TimeEstimateView({
  estimatedTime = 45,
  startTime,
  position,
  analysis,
  aiName = 'Inteligência Artificial',
  onConfirm,
  onGoBack,
  onCancel,
}: TimeEstimateViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmClick = () => {
    setIsLoading(true);

    // Pequeno delay para feedback visual antes de chamar a prop
    setTimeout(() => {
      setIsLoading(false);
      onConfirm();
    }, 1500);
  };

  // Cálculo do ETA (Estimated Time of Arrival)
  // Se o backend mandou um horário fixo (startTime), usa ele.
  // Senão, calcula baseado no tempo em minutos a partir de agora.
  // Se o backend enviou startTime, calculamos os minutos restantes até lá.
  // Caso contrário, usamos o estimatedTime vindo da API.
  const nowMs = Date.now();
  const etaFromApi = startTime ? new Date(startTime) : null;

  const waitMinutes =
    etaFromApi && !Number.isNaN(etaFromApi.getTime())
      ? Math.max(0, Math.round((etaFromApi.getTime() - nowMs) / 60000))
      : Math.max(0, estimatedTime);

  const eta =
    etaFromApi && !Number.isNaN(etaFromApi.getTime())
      ? etaFromApi
      : new Date(nowMs + waitMinutes * 60000);

  const formattedEta = eta.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex w-full justify-center">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Tempo de Espera</CardTitle>
          <CardDescription>
            {aiName} calculou o tempo estimado
            <br /> para o seu atendimento:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">{waitMinutes} min</p>
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
    </div>
  );
}
