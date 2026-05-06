'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TimeConfirmationViewProps {
  remainingTime: number;
  autoCancelThresholdMinutes?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TimeConfirmationView({
  remainingTime,
  autoCancelThresholdMinutes = 20,
  onConfirm,
  onCancel,
}: TimeConfirmationViewProps) {
  const hasAutoCancelled = useRef(false);

  useEffect(() => {
    if (
      remainingTime <= autoCancelThresholdMinutes &&
      !hasAutoCancelled.current
    ) {
      hasAutoCancelled.current = true;
      onCancel();
    }
  }, [remainingTime, autoCancelThresholdMinutes, onCancel]);

  const timeUntilAutoCancel = remainingTime - autoCancelThresholdMinutes;

  return (
    <Card className="w-full max-w-sm border-4 border-yellow-500 text-center">
      <CardHeader>
        <div className="mb-2 flex justify-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl">
          Sua Vez Está
          <br /> Chegando
        </CardTitle>
        <CardDescription>
          Falta pouco para o seu atendimento.
          <br />
          Confirme sua presença
          <br />
          para garantir seu horário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Tempo Estimado Restante:</p>
          <p className="text-5xl font-bold text-primary">{remainingTime} min</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Se não houver confirmação, o atendimento será cancelado
            automaticamente quando faltarem {autoCancelThresholdMinutes} minutos
            ou menos.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onConfirm}>
          Confirmar Presença
          <span className="ml-1 font-bold">
            ({timeUntilAutoCancel > 0 ? timeUntilAutoCancel : 0} min)
          </span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full">
              Cancelar Atendimento
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita.
                <br />
                Você perderá seu lugar na fila de atendimento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar na fila</AlertDialogCancel>
              <AlertDialogAction onClick={onCancel} className="bg-destructive">
                Sim, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
