'use client';

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
  return (
    <Card className="w-full max-w-sm border-4 border-yellow-500 text-center">
      <CardHeader>
        <div className="mb-4 flex justify-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl">Sua Vez está Chegando!</CardTitle>
        <CardDescription>
          Falta pouco para o seu atendimento. Por favor, confirme sua presença
          para garantir seu horário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-sm font-medium">Tempo Estimado Restante</p>
          <p className="text-5xl font-bold text-primary">{remainingTime} min</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full" onClick={onConfirm}>
          Confirmar Presença
        </Button>
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Cancelar Atendimento
        </Button>
      </CardFooter>
    </Card>
  );
}
