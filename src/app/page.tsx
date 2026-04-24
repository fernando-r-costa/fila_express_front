'use client';

import {
  ClientSignUpFlow,
  ClientData,
  ServiceData,
  WaitData,
} from '@/components/client/ClientSignUpFlow';
import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isCheckingQueue, setIsCheckingQueue] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueOpenTime, setQueueOpenTime] = useState('');
  const [queueOpenDate, setQueueOpenDate] = useState('');
  const [closedReason, setClosedReason] = useState<
    'before-open' | 'after-close'
  >('after-close');

  const salonId = useMemo(() => {
    const envVar = process.env.NEXT_PUBLIC_SALON_ID;
    return envVar ? Number(envVar) : undefined;
  }, []);

  useEffect(() => {
    const checkQueueStatus = async () => {
      if (!salonId) {
        setIsCheckingQueue(false);
        return;
      }

      try {
        const { data: salonConfig } = await api.get(`/salon/${salonId}`);

        const now = new Date();
        const [openHour, openMinute] = salonConfig.openingTime
          .split(':')
          .map(Number);
        const [closeHour, closeMinute] = salonConfig.closingTime
          .split(':')
          .map(Number);

        const openingDateTime = new Date();
        openingDateTime.setHours(openHour, openMinute, 0, 0);

        const closingDateTime = new Date();
        closingDateTime.setHours(closeHour, closeMinute, 0, 0);

        const queueOpeningTime = new Date(
          openingDateTime.getTime() -
            salonConfig.queuePreOpeningHours * 60 * 60 * 1000
        );

        if (now < queueOpeningTime) {
          setIsQueueOpen(false);
          setClosedReason('before-open');
          const openTime = queueOpeningTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const openDate = queueOpeningTime.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          });
          setQueueOpenTime(openTime);
          setQueueOpenDate(openDate);
        } else if (now >= closingDateTime) {
          setIsQueueOpen(false);
          setClosedReason('after-close');
          // Calcular o próximo dia de abertura (amanhã)
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(openHour, openMinute, 0, 0);

          const tomorrowQueueOpeningTime = new Date(
            tomorrow.getTime() -
              salonConfig.queuePreOpeningHours * 60 * 60 * 1000
          );

          const openTime = tomorrowQueueOpeningTime.toLocaleTimeString(
            'pt-BR',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          );
          const openDate = tomorrowQueueOpeningTime.toLocaleDateString(
            'pt-BR',
            {
              day: '2-digit',
              month: '2-digit',
            }
          );
          setQueueOpenTime(openTime);
          setQueueOpenDate(openDate);
        } else {
          setIsQueueOpen(true);
        }
      } catch (error) {
        console.error('Erro ao verificar status da fila:', error);
        // Se houver erro ao verificar, permite continuar mas mostra aviso
        setIsQueueOpen(true);
      } finally {
        setIsCheckingQueue(false);
      }
    };

    checkQueueStatus();
  }, [salonId]);

  const handleFlowComplete = (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    // Redireciona para a página de acompanhamento da fila
    if (wait.appointmentId) {
      router.push(`/fila/${wait.appointmentId}`);
    } else {
      toast({
        title: 'Erro ao entrar na fila',
        description: 'Não foi possível obter o ID do agendamento.',
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  const handleCancel = () => {
    // Reset do formulário (volta para identificação)
  };

  if (isCheckingQueue) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10 text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Verificando disponibilidade...
      </div>
    );
  }

  if (!isQueueOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Fila Fechada</CardTitle>
            <CardDescription>
              {closedReason === 'after-close' ? (
                <>
                  Infelizmente, o atendimento de hoje está encerrado.
                  <br />
                  Agradecemos seu interesse!
                </>
              ) : (
                <>A fila ainda não está aberta.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, retorne dia {queueOpenDate} às {queueOpenTime} quando a
              fila será aberta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <ClientSignUpFlow
        onFlowComplete={handleFlowComplete}
        onCancel={handleCancel}
        salonId={salonId}
      />
    </div>
  );
}
