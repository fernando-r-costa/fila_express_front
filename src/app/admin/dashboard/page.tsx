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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { SettingsSheet } from '@/components/admin/SettingsSheet';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

type Client = {
  id: string;
  position: number;
  name: string;
  services: string[];
  queue: QueueType;
  status: 'em_atendimento' | 'aguardando';
  waitTime: number;
};
type QueueType = 'manicure_pedicure' | 'escova';

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
  onFinish: (clientId: string) => void;
  onRemove: (clientId: string) => void;
  onNoShow: (clientId: string) => void;
  isLoadingNext?: boolean;
}

function QueueColumn({
  title,
  clients,
  onCallNext,
  onFinish,
  onRemove,
  onNoShow,
  isLoadingNext = false,
}: QueueColumnProps) {
  const servicingClient = clients.find((c) => c.status === 'em_atendimento');
  const waitingClients = clients
    .filter((c) => c.status === 'aguardando')
    .sort((a, b) => a.position - b.position);
  const allClientsInOrder = [servicingClient, ...waitingClients].filter(
    Boolean
  ) as Client[];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            <span className="text-xl font-bold">{clients.length}</span>{' '}
            cliente(s) no total.
          </CardDescription>
        </div>
        <Button onClick={onCallNext} disabled={isLoadingNext}>
          {isLoadingNext ? 'Chamando...' : 'Chamar Próximo'}{' '}
        </Button>
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
            {allClientsInOrder.map((client) => {
              const isWaiting = client.status === 'aguardando';
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
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-bold">
                    {client.status === 'em_atendimento' ? '-' : client.position}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.services.join(', ')}
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
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {client.status === 'em_atendimento' ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onFinish(client.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Finalizar Atendimento</p>
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

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [clientInServiceWarning, setClientInServiceWarning] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState<QueueType | null>(null);

  useEffect(() => {
    if (isAuthenticated && salonId) {
      const fetchQueueData = async () => {
        setIsDataLoading(true);
        try {
          const response = await api.get(`/queue/${salonId}`);
          setQueueData(response.data);
        } catch (error) {
          console.error('Falha ao buscar dados da fila:', error);
          toast({
            title: 'Erro ao carregar fila',
            description:
              'Não foi possível buscar os dados da fila. Tente recarregar a página.',
            variant: 'destructive',
          });
        } finally {
          setIsDataLoading(false);
        }
      };

      fetchQueueData();
    }
  }, [isAuthenticated, salonId, toast]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || (isAuthenticated && isDataLoading)) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const manicureQueue = queueData.filter(
    (c) => c.queue === 'manicure_pedicure'
  );
  const escovaQueue = queueData.filter((c) => c.queue === 'escova');

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

    setIsSubmitting(true);
    try {
      const servicesList = (
        Object.keys(services) as Array<keyof ServiceData>
      ).filter((k) => services[k] === true);

      const payload = {
        salonId: salonId,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        servicesRequested: servicesList,
      };

      const response = await api.post('/join', payload);

      const newClient = response.data;

      setQueueData((prevData) => [...prevData, newClient]);
      setIsSheetOpen(false);
      toast({
        title: 'Cliente Adicionado!',
        description: `${newClient.name} entrou na fila.`,
      });
    } catch (error) {
      console.error('Falha ao adicionar cliente:', error);
      toast({
        title: 'Erro ao adicionar cliente',
        description:
          'Não foi possível adicionar o cliente. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
      const response = await api.put('/config', settings);

      toast({
        title: 'Configurações Salvas!',
        description: 'As configurações do salão foram atualizadas com sucesso.',
      });
      setIsSettingsSheetOpen(false);
    } catch (error) {
      console.error('Falha ao salvar configurações:', error);
      const errorMessage =
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

    const servicingClient = queueData.find(
      (c) => c.queue === queueType && c.status === 'em_atendimento'
    );
    if (servicingClient) {
      setClientInServiceWarning(servicingClient.name);
      setIsWarningModalOpen(true);
      return;
    }

    const waitingClients = queueData.filter(
      (c) => c.queue === queueType && c.status === 'aguardando'
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
      const response = await api.post('call-next', {
        salonId,
        queueType,
      });

      const updatedClient = response.data;

      setQueueData((prevData) =>
        prevData.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );

      toast({
        title: 'Cliente Chamado!',
        description: `${updatedClient.name} está em atendimento.`,
      });
    } catch (error) {
      console.error('Falha ao chamar próximo cliente:', error);
      const errorMessage =
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

  const handleFinishService = async (clientId: string) => {
    if (!salonId) {
      toast({
        title: 'Erro de autenticação',
        description: 'ID do salão não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.patch(`/appointments/${clientId}/finish`);

      const updatedClient = response.data;

      setQueueData((prevData) =>
        prevData.filter((client) => client.id !== clientId)
      );

      toast({
        title: 'Atendimento Finalizado!',
        description: `O atendimento foi concluído com sucesso.`,
      });
    } catch (error) {
      console.error('Falha ao finalizar atendimento:', error);
      const errorMessage =
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
        reason: 'removed_by_admin',
      });

      const updatedClient = response.data;

      setQueueData((prevData) =>
        prevData.filter((client) => client.id !== clientId)
      );

      toast({
        title: 'Cliente Removido!',
        description: `O cliente foi removido da fila com sucesso.`,
      });
    } catch (error) {
      console.error('Falha ao remover cliente:', error);
      const errorMessage =
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

      const updatedClient = response.data;

      setQueueData((prevData) =>
        prevData.filter((client) => client.id !== clientId)
      );

      toast({
        title: 'Cliente Marcado como Não Compareceu',
        description: `O cliente foi marcado como não compareceu e removido da fila.`,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Falha ao marcar como não compareceu:', error);
      const errorMessage =
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
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="bg-foreground/50 px-4 text-2xl font-bold uppercase text-secondary">
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
              <SheetContent className="w-full max-w-md bg-card">
                <SheetHeader>
                  <SheetTitle>Configurações do Sistema</SheetTitle>
                </SheetHeader>
                <SettingsSheet onSave={handleSettingsSave} />
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
            isLoadingNext={isCallingNext === 'manicure_pedicure'}
          />
          <QueueColumn
            title="Escova"
            clients={escovaQueue}
            onCallNext={() => handleCallNext('escova')}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
            onNoShow={handleNoShow}
            isLoadingNext={isCallingNext === 'escova'}
          />
        </div>
        <AlertDialog
          open={isWarningModalOpen}
          onOpenChange={setIsWarningModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Atendimento em Andamento</AlertDialogTitle>
              <AlertDialogDescription>
                Você precisa finalizar o atendimento de{' '}
                <span className="font-bold">{clientInServiceWarning}</span>{' '}
                antes de chamar o próximo cliente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Entendido</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </TooltipProvider>
  );
}
