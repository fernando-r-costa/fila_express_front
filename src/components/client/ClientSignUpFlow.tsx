'use client';

import { useState } from 'react';
import { JoinQueueForm } from '@/components/client/JoinQueueForm';
import { ServiceSelectionForm } from '@/components/client/ServiceSelectionForm';
import { TimeEstimateView } from '@/components/client/TimeEstimateView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = {
  estimatedTime: number;
  position: number;
  appointmentId?: number;
};

interface ClientSignUpFlowProps {
  onFlowComplete: (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => void;
  onCancel: () => void;
  salonId?: number; // necessário para integração com a API pública
}

export function ClientSignUpFlow({
  onFlowComplete,
  onCancel,
  salonId,
}: ClientSignUpFlowProps) {
  const [formStep, setFormStep] = useState('identification');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [isCalculatingTime, setIsCalculatingTime] = useState(false);
  const [waitData, setWaitData] = useState<WaitData | null>(null);
  const { toast } = useToast();

  const mapServicesToBackend = (services: ServiceData): string[] => {
    const mapped: string[] = [];
    if (services.manicure) mapped.push('manicure');
    if (services.pedicure) mapped.push('pedicure');
    if (services.escova) mapped.push('brush');
    return mapped;
  };

  const handleIdentificationSuccess = (data: ClientData) => {
    setClientData(data);
    setFormStep('serviceSelection');
  };

  const handleServiceSelectionSuccess = async (services: ServiceData) => {
    setServiceData(services);
    if (!salonId) {
      toast({
        title: 'Configuração ausente',
        description:
          'Não foi possível identificar o salão. Informe o salonId na URL (?salonId=) ou configure NEXT_PUBLIC_SALON_ID.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCalculatingTime(true);
      const servicesRequested = mapServicesToBackend(services);
      const { data } = await api.post('/estimate-time', {
        salonId,
        servicesRequested,
      });
      setWaitData({
        estimatedTime: data.estimatedTime,
        position: data.position,
      });
      setFormStep('confirmation');
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível estimar o tempo agora. Tente novamente.';
      toast({
        title: 'Não foi possível prosseguir',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCalculatingTime(false);
    }
  };

  const handleConfirmation = async () => {
    if (clientData && serviceData && waitData) {
      if (!salonId) {
        toast({
          title: 'Configuração ausente',
          description:
            'Não foi possível identificar o salão. Informe o salonId na URL (?salonId=) ou configure NEXT_PUBLIC_SALON_ID.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const servicesRequested = mapServicesToBackend(serviceData);
        const payload = {
          salonId,
          clientName: clientData.name,
          clientPhone: clientData.phone,
          clientEmail: clientData.email,
          servicesRequested,
        };
        const { data: newAppointment } = await api.post('/join', payload);
        const nextWait: WaitData = {
          ...waitData,
          appointmentId: newAppointment.appointmentId,
        };
        onFlowComplete(clientData, serviceData, nextWait);
      } catch (error) {
        const errorMessage =
          (error as any).response?.data?.error ||
          (error as any).response?.data?.message ||
          'Não foi possível concluir sua entrada na fila. Tente novamente.';
        toast({
          title: 'Falha ao entrar na fila',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleGoBack = () => {
    setFormStep('serviceSelection');
  };

  const handleResetFlow = () => {
    setFormStep('identification');
    setClientData(null);
    setServiceData(null);
    setWaitData(null);
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
              onCancel={handleResetFlow}
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
