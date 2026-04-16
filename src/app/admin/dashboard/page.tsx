/*
 * =========================================================================
 * 🚧 DASHBOARD HÍBRIDO (ADAPTADO PARA BACKEND RELACIONAL)
 * =========================================================================
 *
 * 1. mapApiDataToClient:
 * - Converte a resposta NOVA do backend (services: Array) para o formato
 * VISUAL antigo (serviceAllocations: Object) para não quebrar a UI.
 * - Isso permite que os cards de tempo funcionem sem reescrever todo o JSX.
 *
 * 2. Tratamento de Erros:
 * - Adicionada proteção contra campos nulos que podem vir do banco novo.
 *
 * =========================================================================
 */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatBrazilPhone } from '@/lib/utils';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  UserPlus,
  Trash2,
  CheckCircle,
  Clock,
  History,
  Settings,
  UserX,
  Loader2,
  Hand,
  Footprints,
  Phone,
  Mail,
  QrCode,
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

type Attendant = {
  attendantId: number;
  salonId: number;
  name: string;
  roles: string[];
  active: boolean;
};

// Interface adaptada para aceitar estrutura antiga (compatibilidade UI)
type Client = {
  id: string;
  position: number;
  name: string;
  phone?: string;
  email?: string;
  services: string[];
  queue: QueueType;
  status: 'em_atendimento' | 'aguardando';
  rawStatus?:
    | 'waiting'
    | 'confirmed'
    | 'arrived'
    | 'in_progress'
    | 'finished'
    | 'cancelled'
    | 'no_show';
  waitTime: number;
  confirmed?: boolean;
  notified?: boolean;
  startTimeSlot?: string | Date;
  serviceAllocations?: {
    manicure?: { start?: string | Date; end?: string | Date };
    pedicure?: { start?: string | Date; end?: string | Date };
    brush?: { start?: string | Date; end?: string | Date };
    meta?: { offsetAllowanceMinutes?: number; reservations?: any[] };
  };
  serviceAttendants?: Record<string, string>;
  finishedServices?: string[];
  doingServices?: string[];
};
type QueueType = 'manicure_pedicure' | 'escova';

const SERVICE_LABEL_MAP: Record<string, string> = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  brush: 'Escova',
};

const formatServiceWithAttendant = (
  serviceName: string,
  attendantName?: string
) => {
  const serviceLabel = SERVICE_LABEL_MAP[serviceName] || serviceName;
  return attendantName ? `${serviceLabel} - ${attendantName}` : serviceLabel;
};

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

function StatusBadge({ client }: { client: Client; waitingClients: Client[] }) {
  switch (client.rawStatus) {
    case 'waiting':
      return <Badge variant="outline">NA FILA</Badge>;
    case 'confirmed':
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          CONFIRMADO
        </Badge>
      );
    case 'arrived':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          NA ESPERA
        </Badge>
      );
    case 'in_progress':
      return <Badge>ATENDENDO</Badge>;
    case 'finished':
      return (
        <Badge
          variant="outline"
          className="border-emerald-600 text-emerald-600"
        >
          FINALIZADO
        </Badge>
      );
    case 'cancelled':
      return <Badge variant="secondary">CANCELADO</Badge>;
    case 'no_show':
      return <Badge variant="destructive">NO SHOW</Badge>;
    default:
      return <Badge variant="outline">NA FILA</Badge>;
  }
}

interface QueueColumnProps {
  title: string;
  clients: Client[];
  onCallNext: () => void;
  onOptimize: () => void;
  onFinish: (
    clientId: string,
    clientName?: string,
    services?: string[]
  ) => void;
  onRemove: (clientId: string) => void;
  onNoShow: (clientId: string) => void;
  isLoadingNext?: boolean;
  isOptimizing?: boolean;
  capacityChips?: ReactNode;
  disableCallNext?: boolean;
  disableReason?: string;
  queueType?: QueueType;
}

function QueueColumn({
  title,
  clients,
  onCallNext,
  onOptimize,
  onFinish,
  onRemove,
  onNoShow,
  isLoadingNext = false,
  isOptimizing = false,
  capacityChips,
  disableCallNext = false,
  disableReason,
  queueType,
}: QueueColumnProps) {
  const servicingClients = clients.filter((c) => c.status === 'em_atendimento');

  const getPoolSpecificStartTime = (client: Client): number => {
    if (!client.serviceAllocations) return 0;
    const poolServices =
      queueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];

    const startTimes: number[] = [];
    for (const service of poolServices) {
      const alloc =
        client.serviceAllocations[
          service as keyof typeof client.serviceAllocations
        ];
      if (
        alloc &&
        typeof alloc === 'object' &&
        'start' in alloc &&
        alloc.start
      ) {
        startTimes.push(new Date(alloc.start).getTime());
      }
    }
    return startTimes.length > 0 ? Math.min(...startTimes) : 0;
  };

  const waitingClients = clients
    .filter((c) => c.status === 'aguardando')
    .sort((a, b) => {
      const aStartTime = getPoolSpecificStartTime(a);
      const bStartTime = getPoolSpecificStartTime(b);
      // Se não tiver horário (0), joga pro fim ou mantém posição original
      if (aStartTime === 0 && bStartTime === 0) return a.position - b.position;
      if (aStartTime === 0) return 1;
      if (bStartTime === 0) return -1;
      return aStartTime - bStartTime;
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
          {capacityChips}
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onOptimize}
                disabled={isOptimizing}
                variant="outline"
              >
                {isOptimizing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isOptimizing ? 'Otimizando...' : 'Otimizar'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reorganizar fila para preencher buracos e otimizar recursos</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCallNext}
                disabled={isLoadingNext || disableCallNext}
              >
                {isLoadingNext && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoadingNext ? 'Chamando...' : 'Chamar Próximo'}
              </Button>
            </TooltipTrigger>
            {disableCallNext && (
              <TooltipContent>
                <p>
                  {disableReason || 'Sem capacidade disponível no momento.'}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
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
              const localPosition = isWaiting
                ? index - servicingClients.length + 1
                : null;

              let poolSpecificEta: string | null = null;
              let poolServiceStarted = false;
              const allocations = client.serviceAllocations;

              if (allocations) {
                const poolServices =
                  queueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];

                const startTimes: Date[] = [];
                for (const service of poolServices) {
                  const alloc =
                    allocations[service as keyof typeof allocations];
                  if (
                    alloc &&
                    typeof alloc === 'object' &&
                    'start' in alloc &&
                    alloc.start
                  ) {
                    startTimes.push(new Date(alloc.start));
                  }
                }

                if (startTimes.length > 0) {
                  const earliestStart = new Date(
                    Math.min(...startTimes.map((d) => d.getTime()))
                  );
                  poolSpecificEta = earliestStart.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const nowTs = Date.now();
                  poolServiceStarted = nowTs >= earliestStart.getTime();
                }
              }

              let nextServiceInfo: { label: string; timeStr: string } | null =
                null;
              let activeServices: string[] = [];
              if (
                client.status === 'em_atendimento' &&
                client.serviceAllocations
              ) {
                const nowTs = Date.now();
                const hasBrush = !!client.serviceAllocations.brush?.start;
                const hasNails =
                  !!client.serviceAllocations.manicure?.start ||
                  !!client.serviceAllocations.pedicure?.start;
                const hasMultiplePools = hasBrush && hasNails;

                if (hasMultiplePools) {
                  const starts: { label: string; ts: number }[] = [];
                  const addIfFuture = (label: string, start: any) => {
                    if (!start) return;
                    const ts = new Date(start).getTime();
                    if (ts > nowTs + 120000) starts.push({ label, ts });
                  };
                  addIfFuture(
                    'Próximo serviço',
                    client.serviceAllocations.pedicure?.start
                  );
                  addIfFuture(
                    'Próximo serviço',
                    client.serviceAllocations.manicure?.start
                  );
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
                }

                const checkActive = (
                  serviceName: string,
                  start?: any,
                  end?: any
                ) => {
                  if (!start || !end) return;
                  const s = new Date(start).getTime();
                  const e = new Date(end).getTime();
                  if (nowTs >= s - 30000 && nowTs < e)
                    activeServices.push(serviceName);
                };
                checkActive(
                  'manicure',
                  client.serviceAllocations.manicure?.start,
                  client.serviceAllocations.manicure?.end
                );
                checkActive(
                  'pedicure',
                  client.serviceAllocations.pedicure?.start,
                  client.serviceAllocations.pedicure?.end
                );
                checkActive(
                  'brush',
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
                    {client.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{formatBrazilPhone(client.phone)}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {client.services
                        .map((s) =>
                          formatServiceWithAttendant(
                            s,
                            client.serviceAttendants?.[s]
                          )
                        )
                        .join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <StatusBadge
                        client={client}
                        waitingClients={waitingClients}
                      />
                      {poolSpecificEta && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {poolServiceStarted
                              ? `Início: ${poolSpecificEta}`
                              : `Previsto: ${poolSpecificEta}`}
                          </span>
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
                                {formatServiceWithAttendant(
                                  s,
                                  client.serviceAttendants?.[s]
                                )}
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
                          {queueType === 'manicure_pedicure' ? (
                            // Pool Manicure & Pedicure: 2 botões separados (mão e pé)
                            <>
                              {(() => {
                                const finished = client.finishedServices || [];
                                const hasManicure =
                                  client.services.includes('manicure');
                                const hasPedicure =
                                  client.services.includes('pedicure');
                                const maniFinished =
                                  finished.includes('manicure');
                                const pediFinished =
                                  finished.includes('pedicure');

                                return (
                                  <>
                                    {/* Botão Manicure (Mão) */}
                                    {hasManicure && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={maniFinished}
                                            onClick={() =>
                                              onFinish(client.id, client.name, [
                                                'manicure',
                                              ])
                                            }
                                          >
                                            <Hand
                                              className={`h-4 w-4 ${maniFinished ? 'text-muted-foreground' : 'text-green-500'}`}
                                            />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {maniFinished
                                              ? 'Manicure Finalizada'
                                              : 'Finalizar Manicure'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {/* Botão Pedicure (Pé) */}
                                    {hasPedicure && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={pediFinished}
                                            onClick={() =>
                                              onFinish(client.id, client.name, [
                                                'pedicure',
                                              ])
                                            }
                                          >
                                            <Footprints
                                              className={`h-4 w-4 ${pediFinished ? 'text-muted-foreground' : 'text-green-500'}`}
                                            />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {pediFinished
                                              ? 'Pedicure Finalizado'
                                              : 'Finalizar Pedicure'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {/* Botão No-Show */}
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
                                );
                              })()}
                            </>
                          ) : (
                            // Pool Escova: mantém comportamento original (botão único)
                            <>
                              {(() => {
                                const finished = client.finishedServices || [];
                                const hasBrush =
                                  client.services.includes('escova');
                                const brushFinished =
                                  finished.includes('brush');

                                if (!hasBrush || brushFinished) return null;

                                return (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() =>
                                            onFinish(client.id, client.name, [
                                              'brush',
                                            ])
                                          }
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Finalizar Escova</p>
                                      </TooltipContent>
                                    </Tooltip>
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
                                );
                              })()}
                            </>
                          )}
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
    aiName?: string;
  } | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState<QueueType | null>(null);
  const [isCallNextDialogOpen, setIsCallNextDialogOpen] = useState(false);
  const [callNextQueueType, setCallNextQueueType] = useState<QueueType | null>(
    null
  );
  const [callNextClientId, setCallNextClientId] = useState('');
  const [callNextServices, setCallNextServices] = useState<string[]>([]);
  const [callNextAttendants, setCallNextAttendants] = useState<Attendant[]>([]);
  const [callNextAttendantByService, setCallNextAttendantByService] = useState<
    Record<string, string>
  >({});
  const [callNextError, setCallNextError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [aiPendingRequests, setAiPendingRequests] = useState(0);
  const [isAiProcessingRemote, setIsAiProcessingRemote] = useState(false);
  const isRefreshingRef = useRef(false);
  const aiPendingRef = useRef(0);

  const startRequest = () => setPendingRequests((p) => p + 1);
  const endRequest = () => setPendingRequests((p) => Math.max(0, p - 1));

  const incrementAiPending = () => {
    aiPendingRef.current += 1;
    setAiPendingRequests(aiPendingRef.current);
  };

  const decrementAiPending = () => {
    aiPendingRef.current = Math.max(0, aiPendingRef.current - 1);
    setAiPendingRequests(aiPendingRef.current);
  };

  const isAiEndpoint = (url?: string) => {
    if (!url) return false;
    return (
      url.includes('estimate-time') ||
      url.includes('/join') ||
      url.includes('/optimize-queue')
    );
  };

  useEffect(() => {
    const requestId = api.interceptors.request.use((config) => {
      if (isAiEndpoint(config.url)) {
        (config as any).__aiTracked = true;
        incrementAiPending();
      }
      return config;
    });

    const responseId = api.interceptors.response.use(
      (response) => {
        if ((response.config as any).__aiTracked) {
          decrementAiPending();
        }
        return response;
      },
      (error) => {
        if (error?.config && (error.config as any).__aiTracked) {
          decrementAiPending();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestId);
      api.interceptors.response.eject(responseId);
    };
  }, []);

  const belongsToQueue = (c: Client, queueType: QueueType) => {
    if (queueType === 'escova') {
      return c.services.includes('escova');
    }
    return c.services.includes('manicure') || c.services.includes('pedicure');
  };

  const serviceLabelMap: Record<string, string> = SERVICE_LABEL_MAP;

  const getAttendantsForService = (serviceName: string) => {
    return callNextAttendants.filter(
      (attendant) => attendant.active && attendant.roles.includes(serviceName)
    );
  };

  const getPendingServicesForClient = (
    client: Client,
    queueType: QueueType
  ) => {
    const poolServices =
      queueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];
    const finished = client.finishedServices || [];
    const doing = client.doingServices || [];

    return poolServices.filter((service) => {
      const alloc =
        client.serviceAllocations?.[
          service as keyof typeof client.serviceAllocations
        ];
      const isRequested = !!alloc;
      const isFinished = finished.includes(service);
      const isDoing = doing.includes(service);
      return isRequested && !isFinished && !isDoing;
    });
  };

  const poolHasPendingService = (c: Client, queueType: QueueType) => {
    const poolServices =
      queueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];
    const finished = c.finishedServices || [];
    const doing = c.doingServices || [];

    return poolServices.some((service) => {
      const alloc =
        c.serviceAllocations?.[service as keyof typeof c.serviceAllocations];
      const isRequested = !!alloc;
      const isFinished = finished.includes(service);
      const isDoing = doing.includes(service);
      return isRequested && !isFinished && !isDoing;
    });
  };

  const isEligibleForCallNext = (c: Client, queueType: QueueType) =>
    c.rawStatus === 'arrived' &&
    belongsToQueue(c, queueType) &&
    poolHasPendingService(c, queueType);

  // --- MAPPER CRUCIAL (Híbrido) ---
  const mapApiDataToClient = (apiData: any): Client => {
    const serviceMapping: Record<string, string> = {
      brush: 'escova',
      manicure: 'manicure',
      pedicure: 'pedicure',
    };

    // Extrair nomes de serviço, compatível com Array de objetos (Novo) ou Strings (Velho)
    let mappedServices: string[] = [];
    if (Array.isArray(apiData.services)) {
      // Formato Novo: services: [{serviceName: 'brush', status: 'pending'}, ...]
      // Filtrar apenas serviços solicitados (status !== 'not_requested')
      mappedServices = apiData.services
        .filter((s: any) => s.status !== 'not_requested')
        .map((s: any) => serviceMapping[s.serviceName] || s.serviceName);
    } else if (Array.isArray(apiData.servicesRequested)) {
      // Formato Velho: servicesRequested: ['brush', ...]
      mappedServices = apiData.servicesRequested.map(
        (s: string) => serviceMapping[s] || s
      );
    }

    let queue: QueueType = 'manicure_pedicure';
    if (mappedServices.includes('escova') && mappedServices.length === 1) {
      queue = 'escova';
    } else if (mappedServices.includes('escova')) {
      queue = 'manicure_pedicure';
    }

    // Converter Array de Services (Novo) para serviceAllocations (Velho/UI)
    // Isso evita reescrever todo o componente visual
    const syntheticAllocations: any = {};
    const serviceAttendants: Record<string, string> = {};
    if (Array.isArray(apiData.services)) {
      apiData.services
        .filter((s: any) => s.status !== 'not_requested') // Filtrar not_requested
        .forEach((s: any) => {
          // Mapear nome (brush -> brush, etc)
          const name = s.serviceName;
          // Usar realStart se o serviço está em progresso ou finalizado, senão usar estimatedStart
          const startTime =
            (s.status === 'doing' || s.status === 'done') && s.realStart
              ? s.realStart
              : s.estimatedStart;
          const endTime =
            (s.status === 'doing' || s.status === 'done') && s.realEnd
              ? s.realEnd
              : s.estimatedEnd;
          syntheticAllocations[name] = {
            start: startTime,
            end: endTime,
          };
          if (s.attendant?.name) {
            serviceAttendants[name] = s.attendant.name;
          }
        });
    }

    // Se o backend ainda mandar o formato velho, usa ele (prioridade)
    const finalAllocations = apiData.serviceAllocations || syntheticAllocations;

    const statusMapping: Record<string, 'em_atendimento' | 'aguardando'> = {
      waiting: 'aguardando',
      confirmed: 'aguardando',
      arrived: 'aguardando',
      in_progress: 'em_atendimento',
      finished: 'aguardando',
      cancelled: 'aguardando',
      no_show: 'aguardando',
    };

    // Construir array de serviços finalizados baseado no status 'done'
    const finishedServices: string[] = [];
    const doingServices: string[] = [];
    if (Array.isArray(apiData.services)) {
      apiData.services.forEach((s: any) => {
        if (s.status === 'done') {
          finishedServices.push(s.serviceName);
        } else if (s.status === 'doing') {
          doingServices.push(s.serviceName);
        }
      });
    }

    return {
      id: String(apiData.appointmentId),
      position: apiData.position,
      name: apiData.clientName,
      phone: apiData.clientPhone,
      email: apiData.clientEmail,
      services: mappedServices,
      queue,
      status: statusMapping[apiData.status] || 'aguardando',
      rawStatus: apiData.status,
      waitTime: apiData.remainingTime || 0,
      confirmed: apiData.status === 'confirmed' || apiData.status === 'arrived',
      notified: apiData.notified || false,
      serviceAllocations: finalAllocations, // Agora sempre populado
      serviceAttendants,
      finishedServices: finishedServices,
      doingServices: doingServices,
    };
  };

  const fetchSalonConfig = useCallback(async () => {
    if (!salonId) return;
    try {
      startRequest();
      const response = await api.get(`/salon/${salonId}`);
      setSalonConfig({
        numberOfManicureStations: response.data.manicurePedicureAttendants ?? 2,
        numberOfBrushStations: response.data.brushAttendants ?? 1,
        aiName: response.data.aiName,
      });
    } catch (error) {
      console.error('Falha ao buscar configuração do salão:', error);
    } finally {
      endRequest();
    }
  }, [salonId]);

  const fetchQueueData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!salonId) return;
      const silent = opts?.silent === true;
      if (!silent) setIsDataLoading(true);
      if (silent && isRefreshingRef.current) return;
      try {
        if (!silent) startRequest();
        if (silent) isRefreshingRef.current = true;
        const response = await api.get(`/queue/${salonId}`);
        const aiHeader = response.headers?.['x-ai-processing'];
        setIsAiProcessingRemote(
          aiHeader === '1' || aiHeader === 'true' || aiHeader === 'yes'
        );

        // Mapear cada item com o novo mapper inteligente
        const mappedData = response.data.map(mapApiDataToClient);

        setQueueData(mappedData);
        try {
          const cap = await api.get(`/queue/${salonId}/capacity`);
          setCapacity(cap.data);
        } catch (err) {
          console.error('Falha ao buscar capacidade:', err);
        }
      } catch (error) {
        console.error('Falha ao buscar dados da fila:', error);
        if ((error as any).response?.status === 401) {
          toast({
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Faça login novamente.',
            variant: 'destructive',
            duration: Infinity,
          });
          router.push('/admin');
          return;
        }
        if (!silent) {
          toast({
            title: 'Erro ao carregar fila',
            description:
              'Não foi possível buscar os dados. O backend pode estar em manutenção.',
            variant: 'destructive',
            duration: 10000,
          });
        }
      } finally {
        if (silent) isRefreshingRef.current = false;
        if (!silent) setIsDataLoading(false);
        if (!silent) endRequest();
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

  useEffect(() => {
    if (!isAuthenticated || !salonId) return;
    const id = setInterval(() => {
      fetchQueueData({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, salonId, fetchQueueData]);

  useEffect(() => {
    if (!isCallNextDialogOpen || !callNextQueueType) return;

    const eligible = queueData.filter((client) => {
      const poolServices =
        callNextQueueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];
      const finished = client.finishedServices || [];
      const doing = client.doingServices || [];

      const hasPendingInPool = poolServices.some((service) => {
        const alloc =
          client.serviceAllocations?.[
            service as keyof typeof client.serviceAllocations
          ];
        const isRequested = !!alloc;
        const isFinished = finished.includes(service);
        const isDoing = doing.includes(service);
        return isRequested && !isFinished && !isDoing;
      });

      const belongsToPool =
        callNextQueueType === 'escova'
          ? client.services.includes('escova')
          : client.services.includes('manicure') ||
            client.services.includes('pedicure');

      const statusEligible = client.rawStatus === 'arrived';

      return statusEligible && belongsToPool && hasPendingInPool;
    });

    const defaultClient = eligible[0];
    setCallNextClientId(defaultClient?.id ?? '');
    if (!defaultClient) {
      setCallNextServices([]);
    } else {
      const poolServices =
        callNextQueueType === 'escova' ? ['brush'] : ['manicure', 'pedicure'];
      const finished = defaultClient.finishedServices || [];
      const doing = defaultClient.doingServices || [];

      const pendingServices = poolServices.filter((service) => {
        const alloc =
          defaultClient.serviceAllocations?.[
            service as keyof typeof defaultClient.serviceAllocations
          ];
        const isRequested = !!alloc;
        const isFinished = finished.includes(service);
        const isDoing = doing.includes(service);
        return isRequested && !isFinished && !isDoing;
      });

      setCallNextServices(pendingServices);
    }
    setCallNextError(null);
  }, [isCallNextDialogOpen, callNextQueueType, queueData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isCallNextDialogOpen || !callNextQueueType || !salonId) return;

    const loadAttendants = async () => {
      try {
        const response = await api.get('/salon/attendants/active');
        setCallNextAttendants(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        console.error('Falha ao carregar atendentes:', error);
        setCallNextAttendants([]);
      }
    };

    loadAttendants();
  }, [isCallNextDialogOpen, callNextQueueType, salonId]);

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
      </div>
    );
  };

  const isCallNextDisabled = (queueType: QueueType) => {
    if (!capacity) return false;
    const cap =
      queueType === 'escova' ? capacity.brush : capacity.manicure_pedicure;
    return cap.free <= 0;
  };

  const handleManualAddComplete = async () => {
    if (!salonId) return;
    try {
      await fetchQueueData();
      setIsSheetOpen(false);
      toast({
        title: 'Cliente Adicionado!',
        description: `Cliente entrou na fila.`,
        duration: 10000,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettingsSave = async (settings: any) => {
    if (!salonId) return;
    try {
      await api.put('/salon/config', settings);
      toast({
        title: 'Configurações Salvas!',
        description: 'As configurações do salão foram atualizadas.',
        duration: 10000,
      });
      await fetchSalonConfig();
      await fetchQueueData();
      setIsSettingsSheetOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao salvar';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  const handleCallNext = async (queueType: QueueType) => {
    if (!salonId) return;
    const eligibleClients = queueData.filter((client) =>
      isEligibleForCallNext(client, queueType)
    );
    if (eligibleClients.length === 0) {
      toast({
        title: 'Sem Confirmadas',
        description: 'Não há clientes confirmadas para este pool.',
        duration: 10000,
      });
      return;
    }

    setCallNextQueueType(queueType);
    setIsCallNextDialogOpen(true);
  };

  const handleCallNextSubmit = async () => {
    if (!salonId || !callNextQueueType) return;
    if (!callNextClientId) {
      setCallNextError('Selecione uma cliente confirmada.');
      return;
    }

    if (callNextServices.length === 0) {
      setCallNextError('Selecione pelo menos um serviço para chamar.');
      return;
    }

    const missingAttendantService = callNextServices.find(
      (serviceName) => !callNextAttendantByService[serviceName]
    );
    if (missingAttendantService) {
      setCallNextError(
        `Selecione o atendente do serviço ${serviceLabelMap[missingAttendantService] || missingAttendantService}.`
      );
      return;
    }

    const attendantAssignments = Object.fromEntries(
      callNextServices.map((serviceName) => [
        serviceName,
        Number(callNextAttendantByService[serviceName]),
      ])
    );

    setIsCallingNext(callNextQueueType);
    try {
      startRequest();
      const backendQueueType =
        callNextQueueType === 'escova' ? 'brush' : 'manicure_pedicure';
      const response = await api.post('/call-next', {
        salonId,
        queueType: backendQueueType,
        appointmentId: Number(callNextClientId),
        services: callNextServices,
        attendantAssignments,
      });
      await fetchQueueData();
      const clientName = response.data?.client?.clientName || 'Cliente';
      toast({
        title: 'Cliente Chamado',
        description: `${clientName} foi chamada para o atendimento.`,
        duration: 10000,
      });
      setIsCallNextDialogOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao chamar';
      setCallNextError(msg);
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsCallingNext(null);
      endRequest();
    }
  };

  const handleOptimizeQueue = async () => {
    if (!salonId) return;
    setIsOptimizing(true);
    try {
      startRequest();

      // Toast inicial que fica ativo até a operação terminar
      const { dismiss } = toast({
        title: 'Otimizando Fila...',
        description: 'A IA está recalculando os horários da fila. Aguarde...',
        duration: Infinity, // Fica ativo até ser fechado manualmente
      });

      try {
        await api.post('/optimize-queue', { salonId });
        dismiss(); // Fecha o toast de "aguarde"

        toast({
          title: 'Fila Otimizada!',
          description:
            'A IA reorganizou a fila para melhor aproveitamento de recursos.',
          duration: 10000,
        });
      } catch (error) {
        dismiss(); // Fecha o toast de "aguarde"
        throw error; // Repassa o erro para o catch externo
      }

      await fetchQueueData();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro na Otimização',
        description: 'Não foi possível otimizar a fila.',
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsOptimizing(false);
      endRequest();
    }
  };

  const handleFinishService = async (
    clientId: string,
    clientName: string = 'Cliente',
    servicesToFinish?: string[]
  ) => {
    console.log('handleFinishService chamado com:', {
      clientId,
      clientName,
      servicesToFinish,
    });
    if (!salonId) {
      console.error('salonId não definido');
      return;
    }
    try {
      startRequest();

      if (servicesToFinish && servicesToFinish.length > 0) {
        // Finalizar cada serviço individualmente
        for (const serviceName of servicesToFinish) {
          console.log(`Finalizando serviço ${serviceName} para ${clientName}`);
          await api.patch(`/appointments/${clientId}/finish-service`, {
            serviceName: serviceName,
          });
        }
      } else {
        await api.patch(`/appointments/${clientId}/finish`);
      }
      await fetchQueueData();
      toast({
        title: 'Atendimento Finalizado!',
        description: `${clientName} foi liberada.`,
        duration: 10000,
      });
    } catch (error: any) {
      console.error('Erro ao finalizar serviço:', error);
      const msg = error.response?.data?.error || 'Erro ao finalizar';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      endRequest();
    }
  };

  const handleRemoveFromQueue = async (clientId: string) => {
    if (!salonId) return;
    try {
      startRequest();
      setIsOptimizing(true);
      // Buscar nome da cliente antes de remover
      const clientData = queueData.find(
        (c) => String(c.id) === String(clientId)
      );
      const clientName = clientData?.name || 'Cliente';

      const { data } = await api.patch(`/appointments/${clientId}/remove`, {
        reason: 'cancelled',
      });
      toast({
        title: '✋ Cancelamento Registrado',
        description: `${clientName} foi removida da fila. A fila está sendo otimizada para antecipar próximas clientes...`,
        duration: 8000,
      });

      // Aguarda um pouco para deixar a otimização rodar, depois faz refresh
      if (data?.isOptimizing) {
        setTimeout(() => {
          fetchQueueData().finally(() => setIsOptimizing(false));
        }, 2000);
      } else {
        await fetchQueueData();
        setIsOptimizing(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      endRequest();
    }
  };

  const handleNoShow = async (clientId: string) => {
    if (!salonId) return;
    try {
      startRequest();
      setIsOptimizing(true);
      // Buscar nome da cliente antes de marcar no-show
      const clientData = queueData.find(
        (c) => String(c.id) === String(clientId)
      );
      const clientName = clientData?.name || 'Cliente';

      const { data } = await api.patch(`/appointments/${clientId}/remove`, {
        reason: 'no_show',
      });
      toast({
        title: '⚠️ No-Show Registrado',
        description: `${clientName} foi marcada como ausente. A fila está sendo otimizada para antecipar próximas clientes...`,
        variant: 'destructive',
        duration: 8000,
      });

      // Aguarda um pouco para deixar a otimização rodar, depois faz refresh
      if (data?.isOptimizing) {
        setTimeout(() => {
          fetchQueueData().finally(() => setIsOptimizing(false));
        }, 2000);
      } else {
        await fetchQueueData();
        setIsOptimizing(false);
      }
    } catch (error) {
      console.error(error);
      setIsOptimizing(false);
    } finally {
      endRequest();
    }
  };

  const confirmedClientsForCallNext = callNextQueueType
    ? queueData.filter((client) =>
        isEligibleForCallNext(client, callNextQueueType)
      )
    : [];

  const selectedCallNextClient = confirmedClientsForCallNext.find(
    (client) => client.id === callNextClientId
  );

  const availableCallNextServices =
    selectedCallNextClient && callNextQueueType
      ? getPendingServicesForClient(selectedCallNextClient, callNextQueueType)
      : [];

  const handleCallNextClientToggle = (clientId: string) => {
    const nextId = callNextClientId === clientId ? '' : clientId;
    setCallNextClientId(nextId);
    setCallNextAttendantByService({});
    const nextClient = confirmedClientsForCallNext.find(
      (client) => client.id === nextId
    );
    setCallNextServices(
      nextClient && callNextQueueType
        ? getPendingServicesForClient(nextClient, callNextQueueType)
        : []
    );
    setCallNextError(null);
  };

  const handleCallNextServiceToggle = (serviceName: string) => {
    setCallNextServices((current) => {
      const hasService = current.includes(serviceName);
      const nextServices = hasService
        ? current.filter((service) => service !== serviceName)
        : [...current, serviceName];

      if (hasService) {
        setCallNextAttendantByService((currentAssignments) => {
          const nextAssignments = { ...currentAssignments };
          delete nextAssignments[serviceName];
          return nextAssignments;
        });
      }

      return nextServices;
    });
    setCallNextError(null);
  };

  const handleCallNextAttendantChange = (
    serviceName: string,
    attendantId: string
  ) => {
    setCallNextAttendantByService((current) => ({
      ...current,
      [serviceName]: attendantId,
    }));
    setCallNextError(null);
  };

  return (
    <TooltipProvider>
      <AlertDialog
        open={isCallNextDialogOpen}
        onOpenChange={(open) => {
          setIsCallNextDialogOpen(open);
          if (!open) {
            setCallNextQueueType(null);
            setCallNextClientId('');
            setCallNextServices([]);
            setCallNextAttendants([]);
            setCallNextAttendantByService({});
            setCallNextError(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Chamar proxima cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione a cliente confirmada e quais servicos serao iniciados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="call-next-client">Cliente confirmada</Label>
              {confirmedClientsForCallNext.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  Nenhuma cliente confirmada
                </p>
              ) : (
                <div className="space-y-2">
                  {confirmedClientsForCallNext.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={callNextClientId === client.id}
                        onCheckedChange={() =>
                          handleCallNextClientToggle(client.id)
                        }
                      />
                      <span>{client.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="call-next-services">Servicos</Label>
              {availableCallNextServices.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  Selecione uma cliente para ver os servicos.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableCallNextServices.map((service) => (
                    <label
                      key={service}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={callNextServices.includes(service)}
                        onCheckedChange={() =>
                          handleCallNextServiceToggle(service)
                        }
                      />
                      <span>{serviceLabelMap[service] || service}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Atendente por serviço</Label>
              {availableCallNextServices.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  Selecione uma cliente para definir os atendentes.
                </p>
              ) : (
                <div className="space-y-3">
                  {availableCallNextServices.map((serviceName) => {
                    const serviceAttendants =
                      getAttendantsForService(serviceName);
                    const selectedAttendant =
                      callNextAttendantByService[serviceName] ?? '';

                    return (
                      <div
                        key={serviceName}
                        className="space-y-2 rounded-md border border-border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {serviceLabelMap[serviceName] || serviceName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            escolha o profissional
                          </span>
                        </div>
                        {serviceAttendants.length === 0 ? (
                          <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                            Nenhum atendente ativo cadastrado para este serviço.
                          </p>
                        ) : (
                          <select
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            value={selectedAttendant}
                            onChange={(e) =>
                              handleCallNextAttendantChange(
                                serviceName,
                                e.target.value
                              )
                            }
                          >
                            <option value="">Selecione o atendente</option>
                            {serviceAttendants.map((attendant) => (
                              <option
                                key={attendant.attendantId}
                                value={String(attendant.attendantId)}
                              >
                                {attendant.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {callNextError && (
              <p className="text-sm text-destructive">{callNextError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCallNextSubmit}
              disabled={
                confirmedClientsForCallNext.length === 0 ||
                callNextServices.length === 0 ||
                isCallingNext === callNextQueueType
              }
            >
              {isCallingNext === callNextQueueType ? 'Chamando...' : 'Chamar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-2 md:gap-6 md:px-8 md:pb-8 md:pt-3">
        <div className="flex h-auto min-h-[56px] flex-shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 py-2">
          <h1 className="my-0 flex items-center gap-2 px-4 py-1 text-2xl font-bold uppercase leading-none text-secondary">
            Gerenciamento da Fila
            {(aiPendingRequests > 0 ||
              isAiProcessingRemote ||
              isOptimizing) && (
              <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-semibold uppercase text-yellow-200">
                {salonConfig?.aiName || 'IA'} está pensando
                <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
              </span>
            )}
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
              <SheetContent className="flex h-full max-h-screen w-full max-w-3xl flex-col overflow-hidden bg-card p-0">
                <SheetHeader className="shrink-0 px-6 pt-6">
                  <SheetTitle>Configurações do Sistema</SheetTitle>
                </SheetHeader>
                <div className="shrink-0 px-6 pt-4">
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    <Link href="/admin/dashboard/checkin-qr">
                      <QrCode className="mr-2 h-4 w-4" />
                      Abrir QR de Check-in
                    </Link>
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <SettingsSheet
                    onSave={handleSettingsSave}
                    salonId={salonId ?? undefined}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 overflow-y-auto lg:grid-cols-2 lg:items-start">
          <QueueColumn
            title="Manicure & Pedicure"
            clients={manicureQueue}
            onCallNext={() => handleCallNext('manicure_pedicure')}
            onOptimize={handleOptimizeQueue}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
            onNoShow={handleNoShow}
            capacityChips={renderCapacityChips('manicure_pedicure')}
            disableCallNext={isCallNextDisabled('manicure_pedicure')}
            disableReason="Todos os atendentes desse pool estão ocupados no momento."
            isLoadingNext={isCallingNext === 'manicure_pedicure'}
            isOptimizing={isOptimizing}
            queueType="manicure_pedicure"
          />
          <QueueColumn
            title="Escova"
            clients={escovaQueue}
            onCallNext={() => handleCallNext('escova')}
            onOptimize={handleOptimizeQueue}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
            onNoShow={handleNoShow}
            capacityChips={renderCapacityChips('escova')}
            disableCallNext={isCallNextDisabled('escova')}
            disableReason="Todos os atendentes desse pool estão ocupados no momento."
            isLoadingNext={isCallingNext === 'escova'}
            isOptimizing={isOptimizing}
            queueType="escova"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
