'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// --- DADOS DE EXEMPLO PARA ATENDIMENTOS FINALIZADOS ---
const mockCompletedData = [
  {
    name: 'Ana Silva',
    phone: '(34) 99999-1111',
    services: ['Manicure'],
    entryTime: '09:05',
    startTime: '09:15',
    finishTime: '09:45',
  },
  {
    name: 'Ricarda Gomes',
    phone: '(34) 99999-2222',
    services: ['Escova'],
    entryTime: '09:10',
    startTime: '09:20',
    finishTime: '10:05',
  },
  {
    name: 'Bruno Costa',
    phone: '(34) 98888-1111',
    services: ['Manicure', 'Pedicure'],
    entryTime: '09:15',
    startTime: '09:45',
    finishTime: '10:30',
  },
];

// --- DADOS DE EXEMPLO PARA CANCELAMENTOS (GERAL) ---
const mockCancelledData = [
  {
    name: 'Mariana Alves',
    email: 'mariana.alves@email.com',
    services: ['Pedicure'],
    status: 'Cancelado na espera',
  },
  {
    name: 'Julia Lima',
    email: 'julia.lima@email.com',
    services: ['Escova'],
    status: 'Não compareceu',
  },
  {
    name: 'Mariana Alves',
    email: 'mariana.alves@email.com',
    services: ['Manicure'],
    status: 'Cancelado na espera',
  },
];

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [date, setDate] = useState<Date>(new Date());
  const [showCancellations, setShowCancellations] = useState(false);

  // Proteção da rota
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router]);

  // Simulação: "Buscar" novos dados quando a data do filtro muda
  useEffect(() => {
    console.log(
      `Simulando busca de atendimentos para o dia: ${format(date, 'PPP', { locale: ptBR })}`
    );
    // Em uma aplicação real, aqui você faria uma chamada à API com a data selecionada
    // para buscar os 'mockCompletedData' daquele dia.
  }, [date]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-secondary">Relatórios</h1>
        <div className="flex items-center gap-4">
          {!showCancellations && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => setDate(newDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowCancellations(!showCancellations)}
          >
            {showCancellations
              ? 'Ver Atendimentos Finalizados'
              : 'Ver Relatório de Cancelamentos'}
          </Button>
        </div>
      </div>

      {showCancellations ? (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Geral de Cancelamentos</CardTitle>
            <CardDescription>
              Lista de todos os cancelamentos e não comparecimentos para
              identificar padrões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCancelledData.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.email}
                      </div>
                    </TableCell>
                    <TableCell>{item.services.join(', ')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'Não compareceu'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atendimentos</CardTitle>
            <CardDescription>
              Atendimentos finalizados para o dia{' '}
              <span className="font-bold text-primary">
                {format(date, 'dd/MM/yyyy')}
              </span>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Entrada Fila</TableHead>
                  <TableHead>Início Atend.</TableHead>
                  <TableHead>Fim Atend.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCompletedData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.phone}
                      </div>
                    </TableCell>
                    <TableCell>{item.services.join(', ')}</TableCell>
                    <TableCell>{item.entryTime}</TableCell>
                    <TableCell>{item.startTime}</TableCell>
                    <TableCell>{item.finishTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
