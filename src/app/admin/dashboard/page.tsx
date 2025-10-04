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
import React from 'react';

const mockQueueData = [
  // --- Fila de Manicure & Pedicure (5 Clientes) ---
  {
    position: 0, // Posição 0 para quem está em atendimento
    name: 'Ana Silva',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'em_atendimento',
    waitTime: 0,
  },
  {
    position: 1, // O próximo da fila
    name: 'Bruna Costa',
    services: ['Manicure', 'Pedicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 35,
  },
  {
    position: 2, // Será "Notificado" pois o tempo é <= 30
    name: 'Mariana Alves',
    services: ['Pedicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 20,
  },
  {
    position: 3, // Status "Aguardando" normal
    name: 'Felipa Souza',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 60,
  },
  {
    position: 4, // Status "Aguardando" normal
    name: 'Carla Dias',
    services: ['Manicure'],
    queue: 'manicure_pedicure',
    status: 'aguardando',
    waitTime: 85,
  },

  // --- Fila de Escova (3 Clientes) ---
  {
    position: 0, // Posição 0 para quem está em atendimento
    name: 'Ricarda Gomes',
    services: ['Escova'],
    queue: 'escova',
    status: 'em_atendimento',
    waitTime: 0,
  },
  {
    position: 1, // O próximo da fila
    name: 'Julia Lima',
    services: ['Escova'],
    queue: 'escova',
    status: 'aguardando',
    waitTime: 45,
  },
  {
    position: 2, // Será "Notificado" pois o tempo é <= 30
    name: 'Luiza Pereira',
    services: ['Escova'],
    queue: 'escova',
    status: 'aguardando',
    waitTime: 15,
  },
];

type Client = (typeof mockQueueData)[0];

function StatusBadge({
  client,
  waitingClients,
}: {
  client: Client;
  waitingClients: Client[];
}) {
  if (client.status === 'em_atendimento') {
    return <Badge>Em Atendimento</Badge>;
  }

  const isNext =
    waitingClients.length > 0 && waitingClients[0].name === client.name;
  if (isNext) {
    return <Badge variant="secondary">Próximo Atendimento</Badge>;
  }

  if (client.waitTime <= 30) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
        Notificado
      </Badge>
    );
  }

  return <Badge variant="outline">Aguardando</Badge>;
}

interface QueueColumnProps {
  title: string;
  clients: Client[];
}

function QueueColumn({ title, clients }: QueueColumnProps) {
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
        <Button>Chamar Próximo</Button>
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
                            <Button variant="outline" size="icon">
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
  const manicureQueue = mockQueueData.filter(
    (c) => c.queue === 'manicure_pedicure'
  );
  const escovaQueue = mockQueueData.filter((c) => c.queue === 'escova');

  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-secondary">
            Gerenciamento da Fila
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <QueueColumn title="Manicure & Pedicure" clients={manicureQueue} />
          <QueueColumn title="Escova" clients={escovaQueue} />
        </div>
      </main>
    </TooltipProvider>
  );
}
