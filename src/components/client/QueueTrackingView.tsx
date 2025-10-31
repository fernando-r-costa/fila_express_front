'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [time, setTime] = useState(initialTime);
  const [position, setPosition] = useState(initialPosition);
  const [eta, setEta] = useState<string | null>(null);

  const timePerPosition = useMemo(() => {
    if (initialPosition <= 1 || initialTime <= 30) {
      return Infinity;
    }
    return (initialTime - 30) / (initialPosition - 1);
  }, [initialTime, initialPosition]);

  useEffect(() => {
    const now = new Date();
    const etaDate = new Date(now.getTime() + initialTime * 60000);
    const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setEta(formattedEta);
  }, [initialTime]);

  useEffect(() => {
    const ONE_MINUTE = 1000;

    if (time > 0) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, ONE_MINUTE);
      return () => clearInterval(timer);
    }
  }, [time, position]);

  useEffect(() => {
    if (timePerPosition === Infinity) return;

    const elapsedTime = initialTime - time;
    const positionsAdvanced = Math.floor(elapsedTime / timePerPosition);
    const newPosition = initialPosition - positionsAdvanced;

    setPosition(Math.max(1, newPosition));
  }, [time, initialTime, initialPosition, timePerPosition]);

  const selectedServices = Object.entries(serviceData)
    .filter(([, isSelected]) => isSelected)
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  if (time <= 30) {
    return (
      <TimeConfirmationView
        remainingTime={time}
        onConfirm={() => onFinalConfirmation(time)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <form>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Você está na Fila!</CardTitle>
          <CardDescription>
            Acompanhe sua posição e<br /> o horário previsto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-center gap-4">
            <div>
              <p className="text-sm font-medium">Sua Posição:</p>
              <p className="text-4xl font-bold text-primary">{position}ª</p>
            </div>
            <div>
              <p className="text-sm font-medium">Horário Previsto:</p>
              <p className="text-4xl font-bold text-primary">{eta}</p>
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
                  onClick={onCancel}
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
