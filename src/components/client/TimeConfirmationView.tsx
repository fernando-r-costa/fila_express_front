'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';

interface TimeConfirmationViewProps {
  remainingTime: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TimeConfirmationView({
  remainingTime,
  onConfirm,
  onCancel,
}: TimeConfirmationViewProps) {
  useEffect(() => {
    if (remainingTime <= 20) {
      console.log('Tempo esgotado, confirmando automaticamente...');
      onConfirm();
    }
  }, [remainingTime, onConfirm]);

  const timeInWindow = remainingTime - 20;
  const windowDuration = 10;
  const progressPercentage =
    ((windowDuration - timeInWindow) / windowDuration) * 100;

  return (
    <form>
      <Card className="w-full max-w-sm border-4 border-yellow-500 text-center">
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">
            Sua Vez está
            <br /> Chegando!
          </CardTitle>
          <CardDescription>
            Falta pouco para o seu atendimento.
            <br />
            Por favor, confirme sua presença
            <br />
            para garantir seu horário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium">Tempo Estimado Restante</p>
            <p className="text-5xl font-bold text-primary">
              {remainingTime} min
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={onConfirm}>
            Confirmar Presença
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar Atendimento
          </Button>
        </CardFooter>
        <div className="px-6 pb-4">
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground">
            Confirmando automaticamente em
            <br />
            {timeInWindow > 0 ? timeInWindow : 0} minutos...
          </p>
          <Progress value={progressPercentage} className="mt-2 h-2" />
        </div>
      </Card>
    </form>
  );
}
