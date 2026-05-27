'use client';

// export default function HomePage() {
//   return (
//     <main className="flex h-dvh items-start justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-6 pt-14 md:pt-24">
//       <div className="flex flex-col items-center justify-center rounded-2xl bg-black/70 px-8 py-10 text-center">
//         {/* eslint-disable-next-line @next/next/no-img-element */}
//         <img
//           src="/wallpapers/logo_fundo_preto.png"
//           alt="Logo do Salão"
//           className="mb-8 h-auto w-full max-w-[250px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]"
//         />
//         <h1 className="text-xl font-semibold uppercase tracking-[0.2em] text-white md:text-3xl">
//           NOVIDADES EM BREVE, AGUARDEM
//         </h1>
//       </div>
//     </main>
//   );
// }

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
        const dayOfWeek = now.getDay(); // 0=domingo, 6=sábado

        // Buscar configuração do dia atual no weeklySchedule
        const todayConfig = Array.isArray(salonConfig.weeklySchedule)
          ? salonConfig.weeklySchedule.find(
              (day: any) => Number(day.dayOfWeek) === dayOfWeek
            )
          : null;

        // Se não houver config semanal, usar os horários globais
        const openingTimeStr =
          todayConfig?.openingTime || salonConfig.openingTime;
        const closingTimeStr =
          todayConfig?.closingTime || salonConfig.closingTime;
        const isClosed = todayConfig?.closed ?? false;

        // Verificar se o dia está fechado
        if (isClosed) {
          setIsQueueOpen(false);
          setClosedReason('after-close');

          // Encontrar próximo dia aberto
          let nextOpenDay = new Date(now);
          for (let i = 1; i <= 7; i++) {
            nextOpenDay.setDate(now.getDate() + i);
            const nextDayOfWeek = nextOpenDay.getDay();
            const nextDayConfig = Array.isArray(salonConfig.weeklySchedule)
              ? salonConfig.weeklySchedule.find(
                  (day: any) => Number(day.dayOfWeek) === nextDayOfWeek
                )
              : null;

            if (!nextDayConfig?.closed) {
              const nextOpeningStr =
                nextDayConfig?.openingTime || salonConfig.openingTime;
              const [nextHour, nextMinute] = nextOpeningStr
                .split(':')
                .map(Number);
              nextOpenDay.setHours(nextHour, nextMinute, 0, 0);

              const nextQueueTime = new Date(
                nextOpenDay.getTime() -
                  salonConfig.queuePreOpeningHours * 60 * 60 * 1000
              );

              setQueueOpenTime(
                nextQueueTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              );
              setQueueOpenDate(
                nextQueueTime.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })
              );
              break;
            }
          }
        } else {
          // Dia aberto, verificar horários
          const [openHour, openMinute] = openingTimeStr.split(':').map(Number);
          const [closeHour, closeMinute] = closingTimeStr
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

            // Encontrar próximo dia aberto
            let nextOpenDay = new Date(now);
            for (let i = 1; i <= 7; i++) {
              nextOpenDay.setDate(now.getDate() + i);
              const nextDayOfWeek = nextOpenDay.getDay();
              const nextDayConfig = Array.isArray(salonConfig.weeklySchedule)
                ? salonConfig.weeklySchedule.find(
                    (day: any) => Number(day.dayOfWeek) === nextDayOfWeek
                  )
                : null;

              if (!nextDayConfig?.closed) {
                const nextOpeningStr =
                  nextDayConfig?.openingTime || salonConfig.openingTime;
                const [nextHour, nextMinute] = nextOpeningStr
                  .split(':')
                  .map(Number);
                nextOpenDay.setHours(nextHour, nextMinute, 0, 0);

                const nextQueueTime = new Date(
                  nextOpenDay.getTime() -
                    salonConfig.queuePreOpeningHours * 60 * 60 * 1000
                );

                setQueueOpenTime(
                  nextQueueTime.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                );
                setQueueOpenDate(
                  nextQueueTime.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                );
                break;
              }
            }
          } else {
            setIsQueueOpen(true);
          }
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
