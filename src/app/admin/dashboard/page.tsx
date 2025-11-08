'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Trash2,
  CheckCircle,
  Clock,
  History,
  Settings,
  UserX,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { SettingsSheet } from '@/components/admin/SettingsSheet';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = {
  estimatedTime: number;
  position: number;
  appointmentId?: number;
};

type Client = {
  id: string;
  position: number;
  name: string;
  services: string[];
  queue: QueueType;
  status: 'em_atendimento' | 'aguardando';
  waitTime: number;
  confirmed?: boolean;
  serviceAllocations?: {
    manicure?: { start?: string | Date; end?: string | Date };
    pedicure?: { start?: string | Date; end?: string | Date };
    brush?: { start?: string | Date; end?: string | Date };
    meta?: { offsetAllowanceMinutes?: number; reservations?: any[] };
  };
  finishedServices?: string[];
};
type QueueType = 'manicure_pedicure' | 'escova';

type CapacitySummary = {
  timestamp: string;
  manicure_pedicure: {
    total: number;
    busy: number;
    free: number;
    inProgress: number;
    resting: number;
    reservations: number;
  };
  brush: {
    total: number;
    busy: number;
    free: number;
    inProgress: number;
    resting: number;
    reservations: number;
  };
};

function StatusBadge({
  client,
  waitingClients,
}: {
  client: Client;
  waitingClients: Client[];
}) {
  if (client.status === 'em_atendimento') return <Badge>Em Atendimento</Badge>;
  if (waitingClients.length > 0 && waitingClients[0].name === client.name)
    return <Badge variant="secondary">Próximo</Badge>;
  if (client.confirmed)
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        Confirmado
      </Badge>
    );
  if (client.waitTime <= 30)
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
        Notificado
      </Badge>
    );
  return <Badge variant="outline">Aguardando</Badge>;
}

interface QueueColumnProps {
  title: string;
  clients: Client[];
  onCallNext: () => void;
  onFinish: (clientId: string, services?: string[]) => void;
  onRemove: (clientId: string) => void;
  onNoShow: (clientId: string) => void;
  isLoadingNext?: boolean;
  capacityChips?: ReactNode;
  disableCallNext?: boolean;
  disableReason?: string;
  queueType?: QueueType;
}

function QueueColumn({
  title,
  clients,
  onCallNext,
  onFinish,
  onRemove,
  onNoShow,
  isLoadingNext = false,
  capacityChips,
  disableCallNext = false,
  disableReason,
  queueType,
}: QueueColumnProps) {
  const servicingClients = clients.filter((c) => c.status === 'em_atendimento');

  // Ordenar clientes aguardando pelo horário de início do serviço específico deste pool
  const waitingClients = clients
    .filter((c) => c.status === 'aguardando')
    .sort((a, b) => {
      // Pegar o horário de início do serviço relevante para este pool
      const getPoolStartTime = (client: Client): number => {
        if (!client.serviceAllocations) return 0;

        if (queueType === 'escova') {
          // Pool de escova: usar brush.start
          const brushStart = client.serviceAllocations.brush?.start;
          return brushStart ? new Date(brushStart).getTime() : 0;
        } else {
          // Pool de manicure/pedicure: usar o menor entre manicure.start e pedicure.start
          const maniStart = client.serviceAllocations.manicure?.start;
          const pediStart = client.serviceAllocations.pedicure?.start;
          const times: number[] = [];
          if (maniStart) times.push(new Date(maniStart).getTime());
          if (pediStart) times.push(new Date(pediStart).getTime());
          return times.length > 0 ? Math.min(...times) : 0;
        }
      };

      return getPoolStartTime(a) - getPoolStartTime(b);
    });

  const allClientsInOrder = [...servicingClients, ...waitingClients];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            <span className="text-xl font-bold">{clients.length}</span>{' '}
            cliente(s) no total.
          </CardDescription>
          {/* Capacity chips injected by parent */}
          {capacityChips}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onCallNext}
              disabled={isLoadingNext || disableCallNext}
            >
              {isLoadingNext ? 'Chamando...' : 'Chamar Próximo'}{' '}
            </Button>
          </TooltipTrigger>
          {disableCallNext && (
            <TooltipContent>
              <p>{disableReason || 'Sem capacidade disponível no momento.'}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos.</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allClientsInOrder.map((client, index) => {
              const isWaiting = client.status === 'aguardando';

              // Calcular posição local baseada na ordem após sorting
              // Posição = índice - número de clientes em atendimento + 1
              const localPosition = isWaiting
                ? index - servicingClients.length + 1
                : null;

              let etaTime: string | null = null;
              if (isWaiting && client.waitTime) {
                const now = new Date();
                const etaDate = new Date(
                  now.getTime() + client.waitTime * 60000
                );
                etaTime = etaDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }
              // Preparar info de reserva/segundo serviço
              let nextServiceInfo: { label: string; timeStr: string } | null =
                null;
              let activeServices: string[] = [];
              if (
                client.status === 'em_atendimento' &&
                client.serviceAllocations
              ) {
                const nowTs = Date.now();
                const starts: { label: string; ts: number }[] = [];
                const addIfFuture = (label: string, start: any) => {
                  if (!start) return;
                  const ts = new Date(start).getTime();
                  if (ts > nowTs) starts.push({ label, ts });
                };
                addIfFuture(
                  'Próximo serviço',
                  client.serviceAllocations.pedicure?.start
                );
                addIfFuture(
                  'Próximo serviço',
                  client.serviceAllocations.manicure?.start
                );
                // brush normalmente já começou quando está nessa coluna, mas mantemos genérico
                addIfFuture('Escova', client.serviceAllocations.brush?.start);
                if (starts.length > 0) {
                  const next = starts.sort((a, b) => a.ts - b.ts)[0];
                  const d = new Date(next.ts);
                  const timeStr = d.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  nextServiceInfo = { label: next.label, timeStr };
                }

                const checkActive = (label: string, start?: any, end?: any) => {
                  if (!start || !end) return;
                  const s = new Date(start).getTime();
                  const e = new Date(end).getTime();
                  if (nowTs >= s && nowTs < e) activeServices.push(label);
                };
                checkActive(
                  'MANICURE',
                  client.serviceAllocations.manicure?.start,
                  client.serviceAllocations.manicure?.end
                );
                checkActive(
                  'PEDICURE',
                  client.serviceAllocations.pedicure?.start,
                  client.serviceAllocations.pedicure?.end
                );
                checkActive(
                  'ESCOVA',
                  client.serviceAllocations.brush?.start,
                  client.serviceAllocations.brush?.end
                );
              }

              return (
                <TableRow key={client.id}>
                  <TableCell className="font-bold">
                    {client.status === 'em_atendimento' ? '-' : localPosition}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {client.services.map((s) => s.toUpperCase()).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <StatusBadge
                        client={client}
                        waitingClients={waitingClients}
                      />
                      {isWaiting && etaTime && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{etaTime}</span>
                        </div>
                      )}
                      {client.status === 'em_atendimento' &&
                        nextServiceInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {nextServiceInfo.label}: {nextServiceInfo.timeStr}
                            </span>
                          </div>
                        )}
                      {client.status === 'em_atendimento' &&
                        activeServices.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[10px] uppercase text-muted-foreground">
                            {activeServices.map((s) => (
                              <span
                                key={`${client.id}-${s}`}
                                className="rounded border px-1 py-0.5"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {client.status === 'em_atendimento' ? (
                        <>
                          {(() => {
                            // Determinar quais serviços deste pool ainda não foram finalizados
                            const finished = client.finishedServices || [];
                            const hasManicure =
                              client.services.includes('manicure');
                            const hasPedicure =
                              client.services.includes('pedicure');
                            const hasBrush = client.services.includes('escova');

                            const maniFinished = finished.includes('manicure');
                            const pediFinished = finished.includes('pedicure');
                            const brushFinished = finished.includes('brush');

                            // Serviços deste pool que ainda não foram finalizados
                            let poolServices: string[] = [];
                            let tooltipText = 'Finalizar Atendimento';

                            if (queueType === 'manicure_pedicure') {
                              if (hasManicure && !maniFinished)
                                poolServices.push('manicure');
                              if (hasPedicure && !pediFinished)
                                poolServices.push('pedicure');
                              if (poolServices.length > 0) {
                                tooltipText = `Finalizar ${poolServices
                                  .map(
                                    (s) =>
                                      s.charAt(0).toUpperCase() + s.slice(1)
                                  )
                                  .join(' + ')}`;
                              }
                            } else if (queueType === 'escova') {
                              if (hasBrush && !brushFinished) {
                                poolServices.push('brush');
                                tooltipText = 'Finalizar Escova';
                              }
                            }

                            // Se não há serviços deste pool para finalizar, não mostrar botão
                            if (poolServices.length === 0) return null;

                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      onFinish(client.id, poolServices)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{tooltipText}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => onNoShow(client.id)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Não Compareceu</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => onRemove(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir da Fila</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, salonId } = useAuth();
  const { toast } = useToast();

  const [queueData, setQueueData] = useState<Client[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
  const [salonConfig, setSalonConfig] = useState<{
    numberOfManicureStations: number;
    numberOfBrushStations: number;
  } | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState<QueueType | null>(null);
  // Evitar concorrência em atualizações silenciosas
  const isRefreshingRef = useRef(false);

  const belongsToQueue = (c: Client, queueType: QueueType) => {
    if (queueType === 'escova') {
      return c.services.includes('escova');
    }
    return c.services.includes('manicure') || c.services.includes('pedicure');
  };

  const mapApiDataToClient = (apiData: any): Client => {
    const serviceMapping: Record<string, string> = {
      brush: 'escova',
      manicure: 'manicure',
      pedicure: 'pedicure',
    };

    const mappedServices = apiData.servicesRequested.map(
      (service: string) => serviceMapping[service] || service
    );

    let queue: QueueType = 'manicure_pedicure';
    if (mappedServices.includes('escova') && mappedServices.length === 1) {
      queue = 'escova';
    } else if (mappedServices.includes('escova')) {
      queue = 'manicure_pedicure';
    }

    const statusMapping: Record<string, 'em_atendimento' | 'aguardando'> = {
      waiting: 'aguardando',
      confirmed: 'aguardando',
      in_progress: 'em_atendimento',
      finished: 'aguardando', // Já finalizados normalmente não aparecem na fila
      cancelled: 'aguardando', // Cancelados normalmente não aparecem na fila
      no_show: 'aguardando', // No-show normalmente não aparecem na fila
    };

    return {
      id: String(apiData.appointmentId),
      position: apiData.position,
      name: apiData.clientName,
      services: mappedServices,
      queue,
      status: statusMapping[apiData.status] || 'aguardando',
      waitTime: apiData.remainingTime || 0,
      confirmed: apiData.status === 'confirmed',
      serviceAllocations: apiData.serviceAllocations,
      finishedServices: apiData.finishedServices || [],
    };
  };

  const fetchSalonConfig = useCallback(async () => {
    if (!salonId) return;
    try {
      const response = await api.get(`/salon/${salonId}`);
      setSalonConfig({
        numberOfManicureStations:
          response.data.manicurePedicureAttendants ??
          response.data.numberOfManicureStations ??
          2,
        numberOfBrushStations:
          response.data.brushAttendants ??
          response.data.numberOfBrushStations ??
          1,
      });
    } catch (error) {
      console.error('Falha ao buscar configuração do salão:', error);
    }
  }, [salonId]);

  const fetchQueueData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!salonId) return;
      const silent = opts?.silent === true;
      if (!silent) setIsDataLoading(true);
      // Evitar múltiplos fetches concorrentes no modo silencioso
      if (silent && isRefreshingRef.current) return;
      try {
        if (silent) isRefreshingRef.current = true;
        const response = await api.get(`/queue/${salonId}`);
        const mappedData = response.data.map(mapApiDataToClient);
        setQueueData(mappedData);
        // buscar capacidade
        try {
          const cap = await api.get(`/queue/${salonId}/capacity`);
          setCapacity(cap.data);
        } catch (err) {
          console.error('Falha ao buscar capacidade:', err);
        }
      } catch (error) {
        console.error('Falha ao buscar dados da fila:', error);

        // Se receber 401 (não autorizado), redirecionar para login
        if ((error as any).response?.status === 401) {
          console.log(
            'Sessão expirada ou não autorizada. Redirecionando para login...'
          );
          toast({
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Faça login novamente.',
            variant: 'destructive',
          });
          router.push('/admin');
          return;
        }

        if (!silent) {
          toast({
            title: 'Erro ao carregar fila',
            description:
              'Não foi possível buscar os dados da fila. Tente recarregar a página.',
            variant: 'destructive',
          });
        }
      } finally {
        if (silent) isRefreshingRef.current = false;
        if (!silent) setIsDataLoading(false);
      }
    },
    [salonId, toast, router]
  );

  useEffect(() => {
    if (isAuthenticated && salonId) {
      fetchQueueData();
      fetchSalonConfig();
    }
  }, [isAuthenticated, salonId, fetchQueueData, fetchSalonConfig]);

  // Polling a cada 20s, modo silencioso (sem piscar loading)
  useEffect(() => {
    if (!isAuthenticated || !salonId) return;
    const id = setInterval(() => {
      fetchQueueData({ silent: true });
    }, 20000);
    return () => clearInterval(id);
  }, [isAuthenticated, salonId, fetchQueueData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || (isAuthenticated && isDataLoading)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10 text-secondary">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const manicureQueue = queueData.filter((c) =>
    belongsToQueue(c, 'manicure_pedicure')
  );
  const escovaQueue = queueData.filter((c) => belongsToQueue(c, 'escova'));

  const renderCapacityChips = (queueType: QueueType) => {
    if (!capacity) return null;
    const cap =
      queueType === 'escova' ? capacity.brush : capacity.manicure_pedicure;
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase text-muted-foreground">
        <span className="rounded border px-2 py-0.5">
          Ocupação: {cap.busy}/{cap.total}
        </span>
        {cap.resting > 0 && (
          <span className="rounded border px-2 py-0.5">
            Descanso: {cap.resting}
          </span>
        )}
        {cap.reservations > 0 && (
          <span className="rounded border px-2 py-0.5">
            Reservas: {cap.reservations}
          </span>
        )}
      </div>
    );
  };

  const isCallNextDisabled = (queueType: QueueType) => {
    if (!capacity) return false; // sem dado, não bloqueia
    const cap =
      queueType === 'escova' ? capacity.brush : capacity.manicure_pedicure;
    return cap.free <= 0;
  };

  const handleManualAddComplete = async (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado. Tente fazer login novamente.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await fetchQueueData();

      setIsSheetOpen(false);
      toast({
        title: 'Cliente Adicionado!',
        description: `${client.name} entrou na fila.`,
      });
    } catch (error) {
      console.error('Falha ao adicionar cliente:', error);
      toast({
        title: 'Erro ao adicionar cliente',
        description:
          'Não foi possível adicionar o cliente. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  const handleSettingsSave = async (settings: any) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.put('/salon/config', settings);

      toast({
        title: 'Configurações Salvas!',
        description: 'As configurações do salão foram atualizadas com sucesso.',
      });
      // Atualizar dados após salvar
      await fetchSalonConfig();
      await fetchQueueData();
      setIsSettingsSheetOpen(false);
    } catch (error) {
      console.error('Falha ao salvar configurações:', error);
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível salvar as configurações. Tente novamente.';
      toast({
        title: 'Erro ao salvar configurações',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCallNext = async (queueType: QueueType) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    const waitingClients = queueData.filter(
      (c) => belongsToQueue(c, queueType) && c.status === 'aguardando'
    );
    if (waitingClients.length === 0) {
      toast({
        title: 'Fila Vazia',
        description: 'Não há clientes aguardando para serem chamados.',
      });
      return;
    }

    setIsCallingNext(queueType);
    try {
      const backendQueueType =
        queueType === 'escova' ? 'brush' : 'manicure_pedicure';
      const response = await api.post('/call-next', {
        salonId,
        queueType: backendQueueType,
      });

      await fetchQueueData();

      toast({
        title: 'Cliente Chamado!',
        description: response.data?.message || 'Cliente chamado com sucesso.',
      });
    } catch (error) {
      console.error('Falha ao chamar próximo cliente:', error);
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível chamar o cliente. Tente novamente.';
      toast({
        title: 'Erro ao chamar cliente',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCallingNext(null);
    }
  };

  const handleFinishService = async (
    clientId: string,
    servicesToFinish?: string[]
  ) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (servicesToFinish && servicesToFinish.length > 0) {
        // Finalização parcial (por pool)
        await api.patch(`/appointments/${clientId}/finish-service`, {
          services: servicesToFinish,
        });
      } else {
        // Finalização completa
        await api.patch(`/appointments/${clientId}/finish`);
      }

      await fetchQueueData();

      const serviceNames = servicesToFinish
        ? servicesToFinish.map((s) => s.toUpperCase()).join(', ')
        : 'todos os serviços';

      toast({
        title: 'Atendimento Finalizado!',
        description: `${serviceNames} concluído(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Falha ao finalizar atendimento:', error);
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível finalizar o atendimento. Tente novamente.';
      toast({
        title: 'Erro ao finalizar atendimento',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromQueue = async (clientId: string) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.patch(`/appointments/${clientId}/remove`, {
        reason: 'cancelled',
      });

      await fetchQueueData();

      toast({
        title: 'Cliente Removido!',
        description: `O cliente foi removido da fila com sucesso.`,
      });
    } catch (error) {
      console.error('Falha ao remover cliente:', error);
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível remover o cliente. Tente novamente.';
      toast({
        title: 'Erro ao remover cliente',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleNoShow = async (clientId: string) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.patch(`/appointments/${clientId}/remove`, {
        reason: 'no_show',
      });

      await fetchQueueData();

      toast({
        title: 'Cliente Marcado como Não Compareceu',
        description: `O cliente foi marcado como não compareceu e removido da fila.`,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Falha ao marcar como não compareceu:', error);
      const errorMessage =
        (error as any).response?.data?.error ||
        (error as any).response?.data?.message ||
        'Não foi possível marcar o cliente como não compareceu. Tente novamente.';
      toast({
        title: 'Erro ao marcar não comparecimento',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <TooltipProvider>
      <main className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 pt-2 md:gap-6 md:px-8 md:pb-8 md:pt-3">
        <div className="sticky top-0 z-20 flex h-14 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-transparent py-2">
          <h1 className="my-0 flex items-center px-4 py-1 text-2xl font-bold uppercase leading-none text-secondary">
            Gerenciamento da Fila
          </h1>
          <div className="flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-md bg-card">
                <SheetHeader>
                  <SheetTitle>Adicionar Novo Cliente na Fila</SheetTitle>
                </SheetHeader>
                <ClientSignUpFlow
                  onFlowComplete={handleManualAddComplete}
                  onCancel={() => setIsSheetOpen(false)}
                  salonId={salonId ?? undefined}
                />
              </SheetContent>
            </Sheet>
            <Button asChild variant="outline">
              <Link href="/admin/relatorios">
                <History className="mr-2 h-4 w-4" />
                Relatórios
              </Link>
            </Button>
            <Sheet
              open={isSettingsSheetOpen}
              onOpenChange={setIsSettingsSheetOpen}
            >
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-3xl bg-card">
                <SheetHeader>
                  <SheetTitle>Configurações do Sistema</SheetTitle>
                </SheetHeader>
                <SettingsSheet
                  onSave={handleSettingsSave}
                  salonId={salonId ?? undefined}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <QueueColumn
            title="Manicure & Pedicure"
            clients={manicureQueue}
            onCallNext={() => handleCallNext('manicure_pedicure')}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
            onNoShow={handleNoShow}
            capacityChips={renderCapacityChips('manicure_pedicure')}
            disableCallNext={isCallNextDisabled('manicure_pedicure')}
            disableReason="Todos os atendentes desse pool estão ocupados no momento."
            isLoadingNext={isCallingNext === 'manicure_pedicure'}
            queueType="manicure_pedicure"
          />
          <QueueColumn
            title="Escova"
            clients={escovaQueue}
            onCallNext={() => handleCallNext('escova')}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
            onNoShow={handleNoShow}
            capacityChips={renderCapacityChips('escova')}
            disableCallNext={isCallNextDisabled('escova')}
            disableReason="Todos os atendentes desse pool estão ocupados no momento."
            isLoadingNext={isCallingNext === 'escova'}
            queueType="escova"
          />
        </div>
      </main>
    </TooltipProvider>
  );
}
