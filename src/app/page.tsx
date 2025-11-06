'use client';

import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = {
  estimatedTime: number;
  position: number;
  appointmentId?: number;
};

export default function HomePage() {
  const [formStep, setFormStep] = useState('signup');
  const [waitData, setWaitData] = useState<WaitData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const { toast } = useToast();

  const salonId = useMemo(() => {
    const envVar = process.env.NEXT_PUBLIC_SALON_ID;
    return envVar ? Number(envVar) : undefined;
  }, []);

  const handleFlowComplete = (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    setClientData(client);
    setWaitData(wait);
    setServiceData(services);

    if (wait.estimatedTime <= 20) {
      // Chama confirmação imediatamente usando os dados recebidos (evita race com setState)
      handleFinalConfirmation(wait.estimatedTime, {
        appointmentId: wait.appointmentId,
        clientPhone: client.phone,
      });
    } else {
      setFormStep('inQueue');
    }
  };

  const handleCancel = () => {
    setFormStep('signup');
  };

  const handleFinalConfirmation = async (
    currentTime: number,
    override?: { appointmentId?: number; clientPhone?: string }
  ) => {
    setFinalTime(currentTime);
    try {
      const effectiveAppointmentId =
        override?.appointmentId ?? waitData?.appointmentId;
      const effectiveClientPhone = override?.clientPhone ?? clientData?.phone;

      if (!effectiveAppointmentId || !effectiveClientPhone) {
        throw new Error('Dados insuficientes para confirmar.');
      }
      await api.patch(`/appointments/${effectiveAppointmentId}/confirm`, {
        clientPhone: effectiveClientPhone,
      });
      toast({
        title: 'Presença confirmada!',
        description: 'Obrigado! Pode se dirigir ao salão.',
      });
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.message ||
        'Não foi possível confirmar sua presença agora. Tente novamente no salão.';
      toast({
        title: 'Confirmação não concluída',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setFormStep('confirmed');
    }
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
            salonId={salonId}
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
