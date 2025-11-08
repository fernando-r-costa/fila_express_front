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
  onConfirm: () => void;
  onCancel: () => void;
}

export function TimeConfirmationView({
  remainingTime,
  onConfirm,
  onCancel,
}: TimeConfirmationViewProps) {
  const hasAutoConfirmed = useRef(false);

  useEffect(() => {
    if (remainingTime <= 20 && !hasAutoConfirmed.current) {
      hasAutoConfirmed.current = true;
      onConfirm();
    }
  }, [remainingTime, onConfirm]);

  const timeInWindow = remainingTime - 20;

  return (
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
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Tempo Estimado Restante:</p>
          <p className="text-5xl font-bold text-primary">{remainingTime} min</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ℹ️ A confirmação acontecerá automaticamente quando faltar 20 minutos
            ou menos
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onConfirm}>
          Confirmar Presença{' '}
          <span className="fonte-bold">
            ({timeInWindow > 0 ? timeInWindow : 0} min)
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
