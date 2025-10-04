'use client';

import { useState } from 'react';
import { JoinQueueForm } from '@/components/client/JoinQueueForm';
import { ServiceSelectionForm } from '@/components/client/ServiceSelectionForm';
import { TimeEstimateView } from '@/components/client/TimeEstimateView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';
import { calculateMockWaitTime } from '@/lib/utils';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

interface ClientSignUpFlowProps {
  onFlowComplete: (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => void;
  onCancel: () => void;
}

export function ClientSignUpFlow({
  onFlowComplete,
  onCancel,
}: ClientSignUpFlowProps) {
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
    const calculatedData = calculateMockWaitTime(services);
    setWaitData(calculatedData);

    setTimeout(() => {
      setIsCalculatingTime(false);
      setFormStep('confirmation');
    }, 2000);
  };

  const handleConfirmation = () => {
    if (clientData && serviceData && waitData) {
      onFlowComplete(clientData, serviceData, waitData);
    }
  };

  const handleGoBack = () => {
    setFormStep('serviceSelection');
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
              onCancel={onCancel}
            />
          );
        }
        return null;
      default:
        return <JoinQueueForm onSuccess={handleIdentificationSuccess} />;
    }
  };

  return <div className="p-4">{renderCurrentStep()}</div>;
}
