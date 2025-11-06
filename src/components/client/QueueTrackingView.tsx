'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TimeConfirmationView } from './TimeConfirmationView';
import { Clock, Bell } from 'lucide-react';

type ServiceData = {
  manicure: boolean;
  pedicure: boolean;
  escova: boolean;
};

interface QueueTrackingViewProps {
  initialPosition?: number;
  initialTime?: number;
  serviceData?: ServiceData;
  onCancel: () => void;
  onFinalConfirmation: (currentTime: number) => void;
}

export function QueueTrackingView({
  initialPosition = 5,
  initialTime = 45,
  serviceData = { manicure: true, pedicure: true, escova: false },
  onCancel,
  onFinalConfirmation,
}: QueueTrackingViewProps) {
  const [eta, setEta] = useState<string | null>(null);

  // Calcular horário previsto baseado no tempo de entrada
  useEffect(() => {
    const now = new Date();
    const etaDate = new Date(now.getTime() + initialTime * 60000);
    const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setEta(formattedEta);
  }, [initialTime]);

  const selectedServices = Object.entries(serviceData)
    .filter(([, isSelected]) => isSelected)
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  return (
    <form>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Você está na Fila!</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <p className="text-sm font-medium">
                Horário Previsto de Atendimento:
              </p>
            </div>
            <p className="text-6xl font-bold text-primary">{eta || '--:--'}</p>
            <div className="mt-2 flex items-start gap-2 text-left">
              <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                O horário pode alterar conforme evolução da fila. Você receberá
                uma notificação quando faltar 30 minutos para o atendimento.
              </p>
            </div>
          </div>
          {selectedServices.length > 0 && (
            <div>
              <h3 className="font-semibold">Serviços Selecionados:</h3>
              <ul className="mt-2 list-inside list-disc text-primary">
                {selectedServices.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
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
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    onCancel();
                  }}
                  className="bg-destructive"
                >
                  Sim, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </form>
  );
}
