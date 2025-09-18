'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ServiceData = {
  manicure: boolean;
  pedicure: boolean;
  escova: boolean;
};

interface QueueStatusViewProps {
  initialPosition?: number;
  initialTime?: number;
  serviceData?: ServiceData;
  onCancel: () => void;
}

export function QueueStatusView({
  initialPosition = 5,
  initialTime = 45,
  serviceData = { manicure: true, pedicure: true, escova: false },
  onCancel,
}: QueueStatusViewProps) {
  const [position, setPosition] = useState(initialPosition);
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (time > 0) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 60000); // Decrementa o tempo a cada 1 minuto (60000 ms)

      return () => clearInterval(timer);
    }
  }, [time]);

  const selectedServices = Object.entries(serviceData)
    .filter(([, isSelected]) => isSelected)
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Você está na Fila!</CardTitle>
        <CardDescription>
          Acompanhe sua posição e o tempo estimado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex justify-around">
          <div>
            <p className="text-sm font-medium text-secondary">Sua Posição</p>
            <p className="text-4xl font-bold text-primary">{position}ª</p>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Tempo Estimado</p>
            <p className="text-4xl font-bold text-primary">{time} min</p>
          </div>
        </div>
        {selectedServices.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground">
              Serviços Selecionados
            </h3>
            <ul className="mt-2 list-inside list-disc text-secondary">
              {selectedServices.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="w-full" onClick={onCancel}>
          Cancelar Atendimento
        </Button>
      </CardFooter>
    </Card>
  );
}
