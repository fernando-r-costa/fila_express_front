'use client';

import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

export default function HomePage() {
  const [formStep, setFormStep] = useState('signup');
  const [waitData, setWaitData] = useState<WaitData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [finalTime, setFinalTime] = useState<number | null>(null);

  const handleFlowComplete = (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    console.log('CLIENTE ENTROU NA FILA PELA HOME:', {
      client,
      services,
      wait,
    });
    setWaitData(wait);
    setServiceData(services);
    setFormStep('inQueue');
  };

  const handleCancel = () => {
    console.log('O cliente saiu da fila.');
    setFormStep('signup');
  };

  const handleFinalConfirmation = (currentTime: number) => {
    console.log('O cliente confirmou sua presença.');
    setFinalTime(currentTime);
    setFormStep('confirmed');
  };

  const renderContent = () => {
    switch (formStep) {
      case 'inQueue':
        if (waitData && serviceData) {
          return (
            <QueueTrackingView
              initialTime={waitData.estimatedTime}
              initialPosition={waitData.position}
              serviceData={serviceData}
              onCancel={handleCancel}
              onFinalConfirmation={handleFinalConfirmation}
            />
          );
        }
        return null;

      case 'confirmed': {
        let formattedEta: string | null = null;
        if (finalTime !== null) {
          const now = new Date();
          const etaDate = new Date(now.getTime() + finalTime * 60000);
          formattedEta = etaDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        return (
          <form>
            <Card className="w-full max-w-sm text-center">
              <CardHeader>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <CardTitle>Presença Confirmada!</CardTitle>
                <CardDescription>
                  Obrigado!
                  <br /> Pode se dirigir ao salão.
                  <br />
                  Estamos aguardando você.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-lg">
                  Seu atendimento está
                  <br />
                  confirmado para
                  <br />
                  aproximadamente:
                </p>
                <p className="text-5xl font-bold text-primary">
                  {formattedEta}
                </p>
              </CardContent>
            </Card>
          </form>
        );
      }

      case 'signup':
      default:
        return (
          <ClientSignUpFlow
            onFlowComplete={handleFlowComplete}
            onCancel={handleCancel}
          />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {renderContent()}
    </div>
  );
}
