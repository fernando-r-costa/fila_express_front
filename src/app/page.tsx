'use client';

import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

export default function HomePage() {
  const [formStep, setFormStep] = useState('signup');
  const [waitData, setWaitData] = useState<WaitData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);

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

  const handleFinalConfirmation = () => {
    console.log('O cliente confirmou sua presença.');
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

      case 'confirmed':
        return (
          <Card className="w-full max-w-sm text-center">
            <CardHeader>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle>Presença Confirmada!</CardTitle>
              <CardDescription>
                Obrigado! Estamos aguardando você.
              </CardDescription>
            </CardHeader>
          </Card>
        );

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
