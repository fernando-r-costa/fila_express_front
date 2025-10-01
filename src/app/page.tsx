'use client';

import { useState } from 'react';
import { JoinQueueForm } from '@/components/client/JoinQueueForm';
import { ServiceSelectionForm } from '@/components/client/ServiceSelectionForm';
import { TimeEstimateView } from '@/components/client/TimeEstimateView';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';
import { calculateMockWaitTime } from '@/lib/utils';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

export default function HomePage() {
  const [formStep, setFormStep] = useState('identification');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [isCalculatingTime, setIsCalculatingTime] = useState(false);
  const [waitData, setWaitData] = useState<WaitData | null>(null);

  const handleIdentificationSuccess = (data: ClientData) => {
    setClientData(data);
    setFormStep('serviceSelection');
  };

  const handleServiceSelectionSuccess = (services: ServiceData) => {
    setIsCalculatingTime(true);
    setServiceData(services);
    console.log({ client: clientData, services });

    // Simula o cálculo e armazena os dados
    const calculatedData = calculateMockWaitTime(services);
    setWaitData(calculatedData);

    setTimeout(() => {
      setIsCalculatingTime(false);
      setFormStep('confirmation');
    }, 2000); // Simula 2 segundos de cálculo de tempo
  };

  const handleConfirmation = () => {
    console.log('CLIENTE CONFIRMOU! ENTRANDO NA FILA...');
    setFormStep('inQueue');
  };

  const handleFinalConfirmation = () => {
    console.log('CLIENTE CONFIRMOU PRESENÇA!');
    // mudar para uma tela final de "Confirmado! Já estamos te esperando!"
    setFormStep('confirmed');
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
        if (waitData) {
          return (
            <TimeEstimateView
              estimatedTime={waitData.estimatedTime}
              onConfirm={handleConfirmation}
              onGoBack={handleGoBack}
              onCancel={handleCancel}
            />
          );
        }
        return null;
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
      default:
        return <JoinQueueForm onSuccess={handleIdentificationSuccess} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {renderCurrentStep()}
    </div>
  );
}
