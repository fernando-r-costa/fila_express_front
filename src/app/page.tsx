'use client';

import { useState } from 'react';
import { JoinQueueForm } from '@/components/client/JoinQueueForm';
import { ServiceSelectionForm } from '@/components/client/ServiceSelectionForm';
import { TimeConfirmationView } from '@/components/client/TimeConfirmationView';
import { QueueStatusView } from '@/components/client/QueueStatusView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };

export default function HomePage() {
  const [formStep, setFormStep] = useState('identification');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [isCalculatingTime, setIsCalculatingTime] = useState(false);

  const handleIdentificationSuccess = (data: ClientData) => {
    setClientData(data);
    setFormStep('serviceSelection');
  };

  const handleServiceSelectionSuccess = (services: ServiceData) => {
    setIsCalculatingTime(true);
    setServiceData(services);
    console.log({ client: clientData, services });

    setTimeout(() => {
      setIsCalculatingTime(false);
      setFormStep('confirmation');
    }, 2000); // Simula 2 segundos de cálculo de tempo
  };

  const handleConfirmation = () => {
    console.log('CLIENTE CONFIRMOU! ENTRANDO NA FILA...');
    setFormStep('inQueue');
  };

  const handleGoBack = () => {
    setFormStep('serviceSelection');
  };

  const handleCancel = () => {
    console.log('PROCESSO CANCELADO');
    setFormStep('identification');
    setClientData(null);
    setServiceData(null);
  };

  const renderCurrentStep = () => {
    if (isCalculatingTime) {
      return <TimeConfirmationSkeleton />;
    }

    switch (formStep) {
      case 'identification':
        return <JoinQueueForm onSuccess={handleIdentificationSuccess} />;
      case 'serviceSelection':
        if (clientData) {
          return (
            <ServiceSelectionForm
              clientData={clientData}
              onSuccess={handleServiceSelectionSuccess}
            />
          );
        }
        return null;
      case 'confirmation':
        return (
          <TimeConfirmationView
            onConfirm={handleConfirmation}
            onGoBack={handleGoBack}
            onCancel={handleCancel}
          />
        );
      case 'inQueue':
        if (serviceData) {
          return (
            <QueueStatusView
              serviceData={serviceData}
              onCancel={handleCancel}
            />
          );
        }
        return null;
      default:
        return <JoinQueueForm onSuccess={handleIdentificationSuccess} />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {renderCurrentStep()}
    </main>
  );
}
