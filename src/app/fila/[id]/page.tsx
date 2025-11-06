'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationView } from '@/components/client/TimeConfirmationView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
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

  // Sincronizar ref com state
  useEffect(() => {
    isConfirmedRef.current = isConfirmed;
  }, [isConfirmed]);

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

  const fetchData = useCallback(async () => {
    console.log('[QueuePage] fetchData iniciado', {
      salonId,
      appointmentId,
      isConfirmed: isConfirmedRef.current,
    });

    if (!salonId || Number.isNaN(appointmentId)) {
      console.log('[QueuePage] Dados insuficientes', {
        salonId,
        appointmentId,
      });
      toast({
        title: 'Dados insuficientes',
        description: 'Configuração do salão ou ID inválido.',
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
      console.log('[QueuePage] Buscando fila...', `/queue/${salonId}`);
      const { data: queue } = await api.get(`/queue/${salonId}`);
      console.log('[QueuePage] Fila recebida', {
        total: queue.length,
        appointmentId,
      });

      const found = queue.find(
        (apt: any) => apt.appointmentId === appointmentId
      );

      if (!found) {
        console.log('[QueuePage] Agendamento não encontrado na fila');
        toast({
          title: 'Agendamento não encontrado',
          description: 'Verifique o link recebido do salão.',
          variant: 'destructive',
        });
        router.push('/');
        return;
      }

      console.log('[QueuePage] Agendamento encontrado', {
        remainingTime: found.remainingTime,
        position: found.position,
        notified: found.notified,
      });

      const tracking: TrackingData = {
        initialTime: Number(found.remainingTime ?? 0),
        initialPosition: found.position ?? null,
        serviceData: mapServicesFromBackend(found.servicesRequested || []),
        clientPhone: found.clientPhone || '',
        notified: found.notified ?? false,
      };
      setData(tracking);
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
      toast({
        title: 'Falha ao carregar',
        description: 'Não foi possível carregar seu agendamento agora.',
        variant: 'destructive',
      });
    }
  }, [salonId, appointmentId, toast, router]);

  useEffect(() => {
    console.log('[QueuePage] useEffect montado - carregando dados iniciais');
    setIsLoading(true);
    fetchData();
    setIsLoading(false);

    // Sem polling - dados são baseados no momento de entrada na fila
    // Cliente receberá notificação quando faltar 30 minutos
  }, [fetchData]);

  const handleCancel = async () => {
    try {
      await api.patch(`/appointments/${appointmentId}/remove`, {
        reason: 'cancelled',
      });
      toast({
        title: 'Atendimento cancelado',
        description: 'Você saiu da fila.',
      });
      router.push('/');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast({
        title: 'Não foi possível cancelar',
        description: 'Tente novamente mais tarde ou no salão.',
        variant: 'destructive',
      });
    }
  };

  const handleFinalConfirmation = async (currentTime: number) => {
    if (!data?.clientPhone) {
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
          clientPhone: data.clientPhone,
        }
      );

      // Buscar o agendamento atualizado para pegar o startTimeSlot real do backend
      const { data: queue } = await api.get(`/queue/${salonId}`);
      const confirmedAppointment = queue.find(
        (apt: any) => apt.appointmentId === appointmentId
      );

      if (confirmedAppointment?.startTimeSlot) {
        // Usar o horário do backend ao invés de calcular localmente
        const etaDate = new Date(confirmedAppointment.startTimeSlot);
        setFinalTime(null); // Não usamos mais finalTime para calcular
        // Guardar o horário formatado diretamente
        const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        // Armazenar em um novo state
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
        (error as any).response?.data?.message ||
        'Não foi possível confirmar sua presença agora. Tente novamente.';
      toast({
        title: 'Confirmação não concluída',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <TimeConfirmationSkeleton />
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
      <div className="flex min-h-screen items-center justify-center">
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative w-full">
        {data.notified && data.initialTime <= 30 ? (
          <TimeConfirmationView
            remainingTime={data.initialTime}
            onConfirm={() => handleFinalConfirmation(data.initialTime)}
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
