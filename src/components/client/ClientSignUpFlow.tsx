/*
 * =========================================================================
 * 📋 FLUXO DE CADASTRO (CLIENT SIDE) - COMPLETO
 * =========================================================================
 *
 * Fluxo completo de entrada na fila integrado com backend relacional.
 *
 * ETAPAS:
 * 1. Identificação do cliente (nome, telefone, email)
 * 2. Seleção de serviços (manicure, pedicure, escova)
 * 3. Estimativa de tempo via IA (POST /estimate-time)
 * 4. Confirmação e entrada na fila (POST /join)
 *
 * ENDPOINTS:
 * - GET /salon/:id → busca nome da IA
 * - POST /estimate-time → calcula tempo estimado sem salvar
 * - POST /join → cria agendamento e retorna appointmentId
 *
 * =========================================================================
 */

'use client';

import { useState } from 'react';
import { JoinQueueForm } from '@/components/client/JoinQueueForm';
import { ServiceSelectionForm } from '@/components/client/ServiceSelectionForm';
import { TimeEstimateView } from '@/components/client/TimeEstimateView';
import { AILoadingState } from '@/components/client/AILoadingState';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = {
  estimatedTime: number;
  position: number;
  startTime?: string;
  finishTime?: string;
  analysis?: string;
  appointmentId?: number;
  aiName?: string;
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
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [waitData, setWaitData] = useState<WaitData | null>(null);
  const [salonAiName, setSalonAiName] = useState<string>(
    'Inteligência Artificial'
  );
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
        duration: Infinity,
      });
      return;
    }

    try {
      // Buscar aiName do salão antes de calcular
      const salonResponse = await api.get(`/salon/${salonId}`);
      if (salonResponse.data.aiName) {
        setSalonAiName(salonResponse.data.aiName);
      }

      setIsCalculatingTime(true);
      const servicesRequested = mapServicesToBackend(services);

      // Estimar tempo de espera via IA (sem salvar no banco ainda)
      const { data } = await api.post('/estimate-time', {
        salonId,
        servicesRequested,
        clientName: clientData?.name,
        clientPhone: clientData?.phone,
      });

      if (
        data.estimatedTime === null ||
        data.analysis?.includes('Indisponível hoje')
      ) {
        const descriptionText =
          data.analysis ||
          'Não há mais horários disponíveis hoje. Tente novamente amanhã.';
        const sanitizedDescription = descriptionText.replace(
          /\+\s*10\s*min/gi,
          ''
        );
        toast({
          title: 'Horário indisponível hoje',
          description: sanitizedDescription,
          variant: 'destructive',
          duration: 10000,
        });
        return;
      }

      setWaitData({
        estimatedTime: data.estimatedTime,
        position: data.position,
        startTime: data.startTime,
        finishTime: data.finishTime,
        analysis: data.analysis,
        aiName: data.aiName,
      });
      setFormStep('confirmation');
    } catch (error) {
      console.error('[ESTIMATE ERROR]', error);

      let errorMessage =
        'Não foi possível estimar o tempo agora. Tente novamente.';

      // Verificar tipo de erro
      if (
        (error as any).code === 'ERR_NETWORK' ||
        (error as any).message?.includes('timeout')
      ) {
        errorMessage =
          'Servidor ocupado. A fila de atendimento está sendo processada. Aguarde alguns segundos e tente novamente.';
      } else if ((error as any).response?.status === 500) {
        errorMessage = 'Erro no servidor. Tente novamente em alguns segundos.';
      } else if ((error as any).response?.status === 400) {
        errorMessage =
          (error as any).response?.data?.error ||
          'Dados inválidos. Verifique as informações.';
      } else if ((error as any).response?.data?.error) {
        errorMessage = (error as any).response.data.error;
      } else if ((error as any).response?.data?.message) {
        errorMessage = (error as any).response.data.message;
      }

      console.error('[ESTIMATE ERROR MESSAGE]', errorMessage);

      toast({
        title: 'Não foi possível prosseguir',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000,
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
          description: 'Não foi possível identificar o salão.',
          variant: 'destructive',
          duration: Infinity,
        });
        return;
      }

      setIsJoiningQueue(true);
      try {
        const servicesRequested = mapServicesToBackend(serviceData);
        const payload = {
          salonId,
          clientName: clientData.name,
          clientPhone: clientData.phone,
          clientEmail: clientData.email,
          servicesRequested,
        };

        // Criar agendamento no backend relacional
        const { data: newAppointment } = await api.post('/join', payload);

        // Backend retorna appointmentId na resposta
        const createdId = newAppointment.appointmentId || newAppointment.id;

        if (!createdId) {
          throw new Error('ID do agendamento não retornado pelo servidor.');
        }

        const nextWait: WaitData = {
          ...waitData,
          appointmentId: createdId,
        };

        onFlowComplete(clientData, serviceData, nextWait);
      } catch (error) {
        console.error('Erro ao entrar na fila:', error);

        let errorMessage =
          (error as any).response?.data?.error ||
          (error as any).response?.data?.message ||
          'Não foi possível concluir sua entrada na fila. Tente novamente.';

        if (
          (error as any).code === 'ERR_NETWORK' ||
          (error as any).code === 'ECONNABORTED' ||
          (error as any).message?.includes('timeout')
        ) {
          errorMessage =
            'Estamos processando sua entrada na fila. Aguarde alguns segundos e tente confirmar novamente. Caso já tenha sido criado, o salão verá seu nome no painel.';
        }

        toast({
          title: 'Falha ao entrar na fila',
          description: errorMessage,
          variant: 'destructive',
          duration: 10000,
        });
      } finally {
        setIsJoiningQueue(false);
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
      return <AILoadingState aiName={salonAiName} />;
    }
    if (isJoiningQueue) {
      return (
        <AILoadingState
          message="Confirmando agendamento"
          description={`${salonAiName} está garantindo sua vaga na fila...`}
        />
      );
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
              startTime={waitData.startTime}
              position={waitData.position}
              analysis={waitData.analysis}
              aiName={waitData.aiName}
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
