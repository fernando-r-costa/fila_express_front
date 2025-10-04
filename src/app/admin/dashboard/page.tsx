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
} from 'lucide-react';
import React, { useState } from 'react';
import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { SettingsSheet } from '@/components/admin/SettingsSheet';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = { estimatedTime: number; position: number };

// Dados iniciais da fila
const initialMockData = [
  // --- Fila de Manicure & Pedicure (5 Clientes) ---
  {
    position: 0,
    name: 'Ana Silva',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'em_atendimento',
    waitTime: 0,
  },
  {
    position: 1,
    name: 'Bruna Costa',
    services: ['Manicure', 'Pedicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 35,
  },
  {
    position: 2,
    name: 'Mariana Alves',
    services: ['Pedicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 20,
  },
  {
    position: 3,
    name: 'Felipa Souza',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 60,
  },
  {
    position: 4,
    name: 'Carla Dias',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 85,
  },
  // --- Fila de Escova (3 Clientes) ---
  {
    position: 0,
    name: 'Ricarda Gomes',
    services: ['Escova'],
    queue: 'escova',
    status: 'em_atendimento',
    waitTime: 0,
  },
  {
    position: 1,
    name: 'Julia Lima',
    services: ['Escova'],
    queue: 'escova',
    status: 'aguardando',
    waitTime: 45,
  },
  {
    position: 2,
    name: 'Luiza Pereira',
    services: ['Escova'],
    queue: 'escova',
    status: 'aguardando',
    waitTime: 15,
  },
];

type Client = (typeof initialMockData)[0];
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
    return <Badge variant="secondary">Próximo Atendimento</Badge>;
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
  onFinish: (clientName: string) => void;
  onRemove: (clientName: string) => void;
}

function QueueColumn({
  title,
  clients,
  onCallNext,
  onFinish,
  onRemove,
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
            {clients.length} cliente(s) no total.
          </CardDescription>
        </div>
        <Button onClick={onCallNext}>Chamar Próximo</Button>
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
                <TableRow key={client.name}>
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
                      {client.status === 'em_atendimento' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onFinish(client.name)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Finalizar Atendimento</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onRemove(client.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir da Fila</p>
                        </TooltipContent>
                      </Tooltip>
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
  const [queueData, setQueueData] = useState(initialMockData);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [clientInServiceWarning, setClientInServiceWarning] = useState<
    string | null
  >(null);

  const manicureQueue = queueData.filter(
    (c) => c.queue === 'manicure_pedicure'
  );
  const escovaQueue = queueData.filter((c) => c.queue === 'escova');

  const handleManualAddComplete = (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    const servicesList = (
      Object.keys(services) as Array<keyof ServiceData>
    ).filter((k) => services[k] === true);
    const targetQueue = servicesList.includes('escova')
      ? 'escova'
      : 'manicure_pedicure';

    const queueToAdd = queueData.filter(
      (c) => c.queue === targetQueue && c.status === 'aguardando'
    );
    const newPosition = Math.max(0, ...queueToAdd.map((c) => c.position)) + 1;

    const newClient = {
      position: newPosition,
      name: client.name,
      services: servicesList,
      queue: targetQueue,
      status: 'aguardando',
      waitTime: wait.estimatedTime,
    };
    setQueueData((prevData) => [...prevData, newClient]);
    setIsSheetOpen(false);
  };

  const handleSettingsSave = (settings: any) => {
    console.log('Configurações salvas no painel principal!', settings);
    // Aqui você poderia, por exemplo, atualizar o estado global da aplicação
    setIsSettingsSheetOpen(false);
  };

  const handleCallNext = (queueType: QueueType) => {
    const servicingClient = queueData.find(
      (c) => c.queue === queueType && c.status === 'em_atendimento'
    );
    if (servicingClient) {
      setClientInServiceWarning(servicingClient.name);
      setIsWarningModalOpen(true);
      return;
    }
    const waitingClients = queueData
      .filter((c) => c.queue === queueType && c.status === 'aguardando')
      .sort((a, b) => a.position - b.position);
    if (waitingClients.length === 0) return;
    const nextClient = waitingClients[0];
    const updatedQueue = queueData.map((client) =>
      client.name === nextClient.name
        ? { ...client, status: 'em_atendimento', position: 0 }
        : client
    );
    setQueueData(updatedQueue);
  };

  const handleFinishService = (clientName: string) => {
    const finishedClient = queueData.find((c) => c.name === clientName);
    if (!finishedClient) return;

    let updatedQueue = queueData.filter((client) => client.name !== clientName);
    updatedQueue = updatedQueue.map((client) => {
      if (
        client.queue === finishedClient.queue &&
        client.position > finishedClient.position
      ) {
        return { ...client, position: client.position - 1 };
      }
      return client;
    });
    setQueueData(updatedQueue);
  };

  const handleRemoveFromQueue = handleFinishService;

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
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              Histórico
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
          />
          <QueueColumn
            title="Escova"
            clients={escovaQueue}
            onCallNext={() => handleCallNext('escova')}
            onFinish={handleFinishService}
            onRemove={handleRemoveFromQueue}
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
