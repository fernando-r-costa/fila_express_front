'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationView } from '@/components/client/TimeConfirmationView';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type TrackingData = {
  initialTime: number;
  initialPosition: number | null;
  serviceData: { manicure: boolean; pedicure: boolean; escova: boolean };
  clientPhone: string;
  notified: boolean;
  confirmedEta?: string;
};

export default function QueuePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = Number(params.id as string);
  const { toast } = useToast();
  const [data, setData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const isConfirmedRef = useRef(false);
  const dataRef = useRef<TrackingData | null>(null);

  // Sincronizar refs com states
  useEffect(() => {
    isConfirmedRef.current = isConfirmed;
  }, [isConfirmed]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const salonId = useMemo(() => {
    const envVar = process.env.NEXT_PUBLIC_SALON_ID;
    return envVar ? Number(envVar) : undefined;
  }, []);

  const mapServicesFromBackend = (servicesRequested: string[]) => {
    return {
      manicure: servicesRequested.includes('manicure'),
      pedicure: servicesRequested.includes('pedicure'),
      escova: servicesRequested.includes('brush'),
    };
  };

  const handleFinalConfirmation = useCallback(
    async (currentTime: number, clientPhone?: string) => {
      const phone = clientPhone || dataRef.current?.clientPhone;
      if (!phone) {
        toast({
          title: 'Dados insuficientes',
          description: 'Não foi possível obter seu telefone para confirmar.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const response = await api.patch(
          `/appointments/${appointmentId}/confirm`,
          {
            clientPhone: phone,
          }
        );

        // Buscar o agendamento atualizado usando a rota pública
        const { data: trackingData } = await api.get(
          `/appointments/${appointmentId}/track`
        );

        if (trackingData?.startTimeSlot) {
          // Usar o horário do backend
          const etaDate = new Date(trackingData.startTimeSlot);
          const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setData((prev) =>
            prev ? ({ ...prev, confirmedEta: formattedEta } as any) : null
          );
        } else {
          setFinalTime(currentTime); // Fallback
        }

        toast({
          title: 'Presença confirmada!',
          description: 'Obrigado! Até já.',
        });
        setIsConfirmed(true);
      } catch (error) {
        console.error('Erro ao confirmar presença:', error);
        const errorMessage =
          (error as any).response?.data?.error ||
          (error as any).response?.data?.message ||
          'Não foi possível confirmar sua presença agora. Tente novamente.';
        toast({
          title: 'Confirmação não concluída',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [appointmentId, toast]
  );

  // Confirmação automática quando tempo <= 20 minutos
  const handleAutoConfirmation = useCallback(
    async (currentTime: number, clientPhone: string) => {
      console.log('[QueuePage] Iniciando confirmação automática');
      await handleFinalConfirmation(currentTime, clientPhone);
    },
    [handleFinalConfirmation]
  );

  const fetchData = useCallback(async () => {
    console.log('[QueuePage] fetchData iniciado', {
      appointmentId,
      isConfirmed: isConfirmedRef.current,
    });

    if (Number.isNaN(appointmentId)) {
      console.log('[QueuePage] ID inválido', { appointmentId });
      toast({
        title: 'ID inválido',
        description: 'O link do agendamento está incorreto.',
        variant: 'destructive',
      });
      return;
    }

    // Não buscar se já confirmou
    if (isConfirmedRef.current) {
      console.log('[QueuePage] Já confirmado, não busca mais');
      return;
    }

    try {
      console.log(
        '[QueuePage] Buscando agendamento...',
        `/appointments/${appointmentId}/track`
      );
      const { data: appointment } = await api.get(
        `/appointments/${appointmentId}/track`
      );
      console.log('[QueuePage] Agendamento recebido', appointment);

      // Se o agendamento foi finalizado ou cancelado, redireciona para home
      if (['finished', 'cancelled', 'no_show'].includes(appointment.status)) {
        console.log(
          '[QueuePage] Agendamento não está mais ativo',
          appointment.status
        );
        toast({
          title: 'Agendamento finalizado',
          description: 'Este agendamento já foi concluído ou cancelado.',
          variant: 'default',
        });
        router.push('/');
        return;
      }

      // Se já está confirmado no backend, mostrar tela de confirmação
      if (appointment.status === 'confirmed' && !isConfirmedRef.current) {
        console.log('[QueuePage] Agendamento já confirmado no backend');
        const etaDate = new Date(appointment.startTimeSlot);
        const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Criar dados completos com confirmedEta
        const tracking: TrackingData = {
          initialTime: Number(appointment.remainingTime ?? 0),
          initialPosition: appointment.position ?? null,
          serviceData: mapServicesFromBackend(
            appointment.servicesRequested || []
          ),
          clientPhone: appointment.clientPhone || '',
          notified: appointment.notified ?? false,
          confirmedEta: formattedEta,
        };

        setData(tracking);
        setIsConfirmed(true);
        return;
      }

      const tracking: TrackingData = {
        initialTime: Number(appointment.remainingTime ?? 0),
        initialPosition: appointment.position ?? null,
        serviceData: mapServicesFromBackend(
          appointment.servicesRequested || []
        ),
        clientPhone: appointment.clientPhone || '',
        notified: appointment.notified ?? false,
      };
      setData(tracking);

      // Se tempo <= 20 minutos, confirma automaticamente
      if (tracking.initialTime <= 20 && !isConfirmedRef.current) {
        console.log('[QueuePage] Tempo <= 20 min, confirmando automaticamente');
        // Chamar diretamente handleFinalConfirmation para evitar dependência circular
        await handleFinalConfirmation(
          tracking.initialTime,
          tracking.clientPhone
        );
      }
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      toast({
        title: 'Falha ao carregar',
        description: 'Agendamento não foi encontrado.',
        variant: 'destructive',
      });
    }
  }, [appointmentId, toast, router, handleFinalConfirmation]);

  useEffect(() => {
    console.log('[QueuePage] useEffect montado - carregando dados iniciais');
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };

    loadInitialData();

    // Polling a cada 30 segundos para atualizar o tempo estimado
    // O tempo é recalculado no backend toda vez que chama o próximo
    // Para quando o cliente confirma presença
    const intervalId = setInterval(() => {
      if (!isConfirmedRef.current) {
        console.log('[QueuePage] Polling - atualizando dados da fila');
        fetchData();
      } else {
        console.log(
          '[QueuePage] Polling cancelado - cliente já confirmou presença'
        );
        clearInterval(intervalId);
      }
    }, 30000); // 30 segundos

    return () => {
      console.log('[QueuePage] Limpando interval de polling');
      clearInterval(intervalId);
    };
  }, [fetchData]);

  const handleCancel = async () => {
    console.log('[QueuePage] handleCancel chamado', {
      appointmentId,
      hasData: !!data,
      clientPhone: data?.clientPhone,
    });

    if (!data?.clientPhone) {
      console.log('[QueuePage] Cancelamento bloqueado - sem telefone');
      toast({
        title: 'Dados insuficientes',
        description: 'Não foi possível obter seu telefone para cancelar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('[QueuePage] Enviando requisição de cancelamento', {
        url: `/appointments/${appointmentId}/remove`,
        data: {
          reason: 'cancelled',
          clientPhone: data.clientPhone,
        },
      });

      const response = await api.patch(
        `/appointments/${appointmentId}/remove`,
        {
          reason: 'cancelled',
          clientPhone: data.clientPhone,
        }
      );

      console.log('[QueuePage] Cancelamento bem-sucedido', response.data);

      toast({
        title: 'Atendimento cancelado',
        description: 'Você saiu da fila.',
      });
      router.push('/');
    } catch (error) {
      console.error('[QueuePage] Erro ao cancelar:', error);
      console.error('[QueuePage] Detalhes do erro:', {
        response: (error as any).response,
        message: (error as any).message,
      });

      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível cancelar. Tente novamente mais tarde ou no salão.';
      toast({
        title: 'Não foi possível cancelar',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10 text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando seu agendamento...
      </div>
    );
  }

  if (isConfirmed) {
    let formattedEta: string | null = null;

    // Priorizar o horário do backend (confirmedEta)
    if (data?.confirmedEta) {
      formattedEta = data.confirmedEta;
    } else if (finalTime !== null) {
      // Fallback: calcular localmente
      const now = new Date();
      const etaDate = new Date(now.getTime() + finalTime * 60000);
      formattedEta = etaDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return (
      <div className="flex flex-col items-center justify-center">
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
            <p className="text-5xl font-bold text-primary">{formattedEta}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-4">
        {data.initialTime > 20 && data.initialTime <= 30 ? (
          <TimeConfirmationView
            remainingTime={data.initialTime}
            onConfirm={() =>
              handleFinalConfirmation(data.initialTime, data.clientPhone)
            }
            onCancel={handleCancel}
          />
        ) : (
          <QueueTrackingView
            initialTime={data.initialTime}
            initialPosition={data.initialPosition ?? undefined}
            serviceData={data.serviceData}
            onCancel={handleCancel}
            onFinalConfirmation={handleFinalConfirmation}
          />
        )}
      </div>
    </div>
  );
}
