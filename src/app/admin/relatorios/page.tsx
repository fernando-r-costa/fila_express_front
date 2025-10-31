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
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Link from 'next/link';

type CompletedAppointment = {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  servicesRequested: string[];
  createdAt: string;
  startTime: string;
  finishTime: string;
};

type CancelledAppointment = {
  appointmentId: number;
  clientName: string;
  clientEmail: string;
  servicesRequested: string[];
  status: 'cancelled' | 'no_show';
  finishTime: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, salonId } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [showCancellations, setShowCancellations] = useState(false);
  const [completedData, setCompletedData] = useState<CompletedAppointment[]>(
    []
  );
  const [cancelledData, setCancelledData] = useState<CancelledAppointment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const mapServicesFromBackend = (services: string[]) => {
    return services.map((s) => {
      if (s === 'brush') return 'Escova';
      if (s === 'manicure') return 'Manicure';
      if (s === 'pedicure') return 'Pedicure';
      return s;
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      if (!salonId) return;
      setIsLoading(true);
      try {
        const dateParam = format(date, 'yyyy-MM-dd');
        const { data } = await api.get(
          `/history/completed/${salonId}?date=${dateParam}`
        );
        setCompletedData(data);
      } catch (error) {
        console.error('Erro ao buscar atendimentos finalizados:', error);
        toast({
          title: 'Erro ao carregar histórico',
          description:
            'Não foi possível buscar os atendimentos finalizados. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!showCancellations) {
      fetchCompletedAppointments();
    }
  }, [date, salonId, showCancellations, toast]);

  useEffect(() => {
    const fetchCancelledAppointments = async () => {
      if (!salonId) return;
      setIsLoading(true);
      try {
        const { data } = await api.get(`/history/cancelled/${salonId}`);
        setCancelledData(data);
      } catch (error) {
        console.error('Erro ao buscar cancelamentos:', error);
        toast({
          title: 'Erro ao carregar cancelamentos',
          description:
            'Não foi possível buscar o histórico de cancelamentos. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (showCancellations) {
      fetchCancelledAppointments();
    }
  }, [showCancellations, salonId, toast]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
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
                {cancelledData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Nenhum cancelamento registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  cancelledData.map((item, index) => (
                    <TableRow key={`${item.appointmentId}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{item.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.clientEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapServicesFromBackend(item.servicesRequested).join(
                          ', '
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'no_show'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {item.status === 'no_show'
                            ? 'Não compareceu'
                            : 'Cancelado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                {completedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum atendimento finalizado nesta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  completedData.map((item) => (
                    <TableRow key={item.appointmentId}>
                      <TableCell>
                        <div className="font-medium">{item.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.clientPhone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapServicesFromBackend(item.servicesRequested).join(
                          ', '
                        )}
                      </TableCell>
                      <TableCell>{formatTime(item.createdAt)}</TableCell>
                      <TableCell>{formatTime(item.startTime)}</TableCell>
                      <TableCell>{formatTime(item.finishTime)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
