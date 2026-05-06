/*
 * =========================================================================
 * � QUEUE TRACKING PAGE - RELACIONAL COMPLETO
 * =========================================================================
 *
 * Página de rastreamento em tempo real do agendamento.
 *
 * Fluxos:
 * 1. Fila Ativa: Exibe tempo restante e posição com polling a cada 30s
 * 2. Notificado/Próximo: Exibe TimeConfirmationView para confirmar presença
 * 3. Confirmado: Exibe horário final do atendimento
 * 4. Finalizado: Redireciona para home
 *
 * Dados extraídos de appointment.services[0].estimatedStart para ETA
 * =========================================================================
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationView } from '@/components/client/TimeConfirmationView';
import { SalonCheckinScanner } from '@/components/client/SalonCheckinScanner';
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

const CONFIRMATION_NOTICE_MINUTES = 30;
const AUTO_CANCEL_THRESHOLD_MINUTES = 20;

type TrackingData = {
  initialTime: number;
  initialPosition: number | null;
  serviceData: { manicure: boolean; pedicure: boolean; escova: boolean };
  clientPhone: string;
  salonId?: number | null;
  notified: boolean;
  status?: string;
  confirmedEta?: string;
  checkinDeadlineLabel?: string;
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

  // --- LÓGICA DE MAPEAMENTO HÍBRIDA (NOVO + LEGADO) ---
  const mapServicesFromBackend = (appointmentData: any) => {
    const servicesMap = { manicure: false, pedicure: false, escova: false };
    let serviceNames: string[] = [];

    // Cenário 1: Backend Novo (Relacional) -> services: [{ serviceName: 'brush' }, ...]
    if (Array.isArray(appointmentData.services)) {
      serviceNames = appointmentData.services
        .filter(
          (s: any) => s.status !== 'not_requested' && s.status !== 'cancelled'
        )
        .map((s: any) => s.serviceName);
    }
    // Cenário 2: Backend Legado ou Simplificado -> servicesRequested: ['brush', ...]
    else if (Array.isArray(appointmentData.servicesRequested)) {
      serviceNames = appointmentData.servicesRequested;
    }

    if (serviceNames.includes('manicure')) servicesMap.manicure = true;
    if (serviceNames.includes('pedicure')) servicesMap.pedicure = true;
    if (serviceNames.includes('brush') || serviceNames.includes('escova'))
      servicesMap.escova = true;

    return servicesMap;
  };

  // Helper para pegar o primeiro serviço SOLICITADO (ignora not_requested)
  const getFirstRequestedService = (appointment: any) => {
    if (!appointment.services || !Array.isArray(appointment.services)) {
      return null;
    }
    const requested = appointment.services.filter(
      (s: any) => s.status !== 'not_requested' && s.status !== 'cancelled'
    );
    if (requested.length === 0) return null;
    // Retorna o serviço com menor estimatedStart
    return requested.reduce((earliest: any, current: any) => {
      const earliestStart = new Date(earliest.estimatedStart).getTime();
      const currentStart = new Date(current.estimatedStart).getTime();
      return currentStart < earliestStart ? current : earliest;
    });
  };

  const handleFinalConfirmation = useCallback(
    async (currentTime: number, clientPhone?: string) => {
      const phone = clientPhone || dataRef.current?.clientPhone;
      if (!phone) {
        toast({
          title: 'Dados insuficientes',
          description: 'Não foi possível obter seu telefone para confirmar.',
          variant: 'destructive',
          duration: 10000,
        });
        return;
      }

      // Bloqueia confirmação se já em atendimento
      if (isConfirmedRef.current) {
        toast({
          title: 'Operação não permitida',
          description:
            'Seu agendamento já foi confirmado ou está em andamento.',
          variant: 'destructive',
          duration: 10000,
        });
        return;
      }

      try {
        await api.patch(`/appointments/${appointmentId}/confirm`, {
          clientPhone: phone,
        });

        // Tenta buscar atualização
        try {
          const { data: trackingData } = await api.get(
            `/appointments/${appointmentId}/track`
          );
          const checkinDeadlineLabel = trackingData?.checkinDeadlineAt
            ? new Date(trackingData.checkinDeadlineAt).toLocaleTimeString(
                'pt-BR',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Sao_Paulo',
                }
              )
            : undefined;
          const firstService = getFirstRequestedService(trackingData);
          if (firstService) {
            const etaDate = new Date(firstService.estimatedStart);
            const formattedEta = etaDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            setData((prev) =>
              prev
                ? ({
                    ...prev,
                    confirmedEta: formattedEta,
                    checkinDeadlineLabel,
                  } as any)
                : null
            );
          } else {
            setData((prev) =>
              prev ? ({ ...prev, checkinDeadlineLabel } as any) : null
            );
            setFinalTime(currentTime);
          }
        } catch (e) {
          // Se falhar o track, usa o tempo local
          setFinalTime(currentTime);
        }

        toast({
          title: 'Presença confirmada!',
          description: 'Obrigado! Até já.',
          duration: 10000,
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
          duration: 10000,
        });
      }
    },
    [appointmentId, toast]
  );

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (Number.isNaN(appointmentId)) return;
      if (!forceRefresh && isConfirmedRef.current) return;

      try {
        const { data: appointment } = await api.get(
          `/appointments/${appointmentId}/track`
        );

        // Tratamento para status de finalização
        if (['finished', 'cancelled', 'no_show'].includes(appointment.status)) {
          toast({
            title: 'Agendamento finalizado',
            description: 'Este agendamento já foi concluído ou cancelado.',
            duration: 10000,
          });
          router.push('/');
          return;
        }

        // Bloqueia confirmação se já em atendimento
        if (appointment.status === 'in_progress' && !isConfirmedRef.current) {
          toast({
            title: 'Agendamento em andamento',
            description:
              'Seu atendimento já foi iniciado. Não é possível confirmar novamente.',
            duration: 10000,
          });
          setIsConfirmed(true);
          return;
        }

        // Mapeia serviços usando a nova função híbrida
        const servicesMapped = mapServicesFromBackend(appointment);
        const checkinDeadlineLabel = appointment?.checkinDeadlineAt
          ? new Date(appointment.checkinDeadlineAt).toLocaleTimeString(
              'pt-BR',
              {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
              }
            )
          : undefined;

        // Se já confirmado ou já chegou presencialmente (arrived)
        if (
          ['confirmed', 'arrived'].includes(appointment.status) &&
          !isConfirmedRef.current
        ) {
          let formattedEta = '';

          // Pega o primeiro estimatedStart dos serviços SOLICITADOS
          const firstService = getFirstRequestedService(appointment);
          if (firstService) {
            const etaDate = new Date(firstService.estimatedStart);
            formattedEta = etaDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
          } else {
            const fallbackMinutes = Number(
              appointment.remainingTime ?? appointment.waitTimeMinutes ?? 0
            );
            if (Number.isFinite(fallbackMinutes) && fallbackMinutes >= 0) {
              const etaDate = new Date(Date.now() + fallbackMinutes * 60000);
              formattedEta = etaDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
              });
            }
          }

          setData({
            initialTime: Number(
              appointment.remainingTime ?? appointment.waitTimeMinutes ?? 0
            ),
            initialPosition: appointment.position ?? null,
            serviceData: servicesMapped,
            clientPhone: appointment.clientPhone || '',
            salonId: appointment.salonId ?? null,
            notified: appointment.notified ?? false,
            status: appointment.status,
            confirmedEta: formattedEta,
            checkinDeadlineLabel,
          });
          setIsConfirmed(true);
          return;
        }

        // Dados normais de fila
        let formattedEta = undefined;
        if (appointment.notified) {
          const firstService = getFirstRequestedService(appointment);
          if (firstService) {
            const etaDate = new Date(firstService.estimatedStart);
            formattedEta = etaDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }

        setData({
          initialTime: Number(
            appointment.remainingTime ?? appointment.waitTimeMinutes ?? 0
          ),
          initialPosition: appointment.position ?? null,
          serviceData: servicesMapped,
          clientPhone: appointment.clientPhone || '',
          salonId: appointment.salonId ?? null,
          notified: appointment.notified ?? false,
          status: appointment.status,
          confirmedEta: formattedEta,
          checkinDeadlineLabel,
        });
        // Sucesso - sem erros
      } catch (error: any) {
        console.error('Erro ao buscar agendamento:', error);

        toast({
          title: 'Falha ao carregar',
          description: 'Agendamento não encontrado ou erro de conexão.',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },
    [appointmentId, toast, router]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    loadInitialData();

    const intervalId = setInterval(() => {
      if (!isConfirmedRef.current) {
        fetchData();
      } else {
        clearInterval(intervalId);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleCancel = async () => {
    if (!data?.clientPhone) return;
    try {
      await api.patch(`/appointments/${appointmentId}/remove`, {
        reason: 'cancelled',
        clientPhone: data.clientPhone,
      });
      toast({
        title: 'Atendimento cancelado',
        description: 'Você saiu da fila.',
        duration: 10000,
      });
      router.push('/');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao cancelar';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  // --- RENDERIZAÇÃO ---

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10 text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando seu agendamento...
      </div>
    );
  }

  if (!data) return null;

  if (isConfirmed) {
    let formattedEta = data.confirmedEta;
    if (!formattedEta && finalTime !== null) {
      const now = new Date();
      const etaDate = new Date(now.getTime() + finalTime * 60000);
      formattedEta = etaDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (!formattedEta) {
      const fallbackMinutes = Number(data.initialTime ?? 0);
      if (Number.isFinite(fallbackMinutes) && fallbackMinutes >= 0) {
        const etaDate = new Date(Date.now() + fallbackMinutes * 60000);
        formattedEta = etaDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        });
      }
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle>
              {data.status === 'arrived'
                ? 'Check-in confirmado!'
                : 'Presença Confirmada!'}
            </CardTitle>
            <CardDescription>
              {data.status === 'arrived'
                ? 'Sua chegada foi registrada. Aguarde o início do atendimento.'
                : 'Obrigado! Pode se dirigir ao salão.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.status === 'arrived' ? (
              <div className="space-y-2">
                <p className="text-lg">Seu check-in foi validado.</p>
                <p className="text-sm text-muted-foreground">
                  Você já está dentro da fila presencial do salão.
                </p>
                {data.confirmedEta && (
                  <p className="pt-2 text-sm text-muted-foreground">
                    Previsão de atendimento:{' '}
                    <span className="font-semibold text-foreground">
                      {data.confirmedEta}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="text-lg">Seu atendimento está previsto para:</p>
                <p className="text-5xl font-bold text-primary">
                  {formattedEta || '--:--'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Assim que chegar ao salão, escaneie o QR da recepção para
                  registrar sua presença.
                </p>
                {data.checkinDeadlineLabel && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Limite para check-in:{' '}
                    <span className="font-semibold text-foreground">
                      {data.checkinDeadlineLabel}
                    </span>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {data.status === 'confirmed' && data.salonId ? (
          <div className="mt-6 w-full max-w-md">
            <SalonCheckinScanner
              appointmentId={appointmentId}
              salonId={data.salonId}
              clientPhone={data.clientPhone}
              onCancel={handleCancel}
              onSuccess={async () => {
                await fetchData(true);
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-4">
        {data.notified ||
        (data.initialTime > AUTO_CANCEL_THRESHOLD_MINUTES &&
          data.initialTime <= CONFIRMATION_NOTICE_MINUTES) ? (
          <TimeConfirmationView
            remainingTime={data.initialTime}
            autoCancelThresholdMinutes={AUTO_CANCEL_THRESHOLD_MINUTES}
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
