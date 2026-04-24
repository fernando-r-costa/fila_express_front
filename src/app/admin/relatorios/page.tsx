/*
 * =========================================================================
 * ✅ RELATÓRIOS - COMPLETO (MODELO RELACIONAL)
 * =========================================================================
 *
 * Página de relatórios totalmente integrada com o backend relacional.
 *
 * ENDPOINTS IMPLEMENTADOS:
 * - GET /history/completed/:salonId?date=YYYY-MM-DD
 * - GET /history/cancelled/:salonId?date=YYYY-MM-DD&status=(cancelled|no_show)
 *
 * FORMATO DE DADOS:
 * - Suporta formato híbrido: servicesRequested[] (legado) e services[] (novo)
 * - Tradução automática: brush→Escova, manicure→Manicure, pedicure→Pedicure
 * - Timestamps com timezone (America/Sao_Paulo)
 * =========================================================================
 */

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
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Link from 'next/link';
import { formatBrazilPhone } from '@/lib/utils';

// Tipagem Híbrida (Suporta legado e novo)
type CompletedAppointment = {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  servicesRequested?: string[]; // Legado
  services?: { serviceName: string }[]; // Novo Relacional
  createdAt?: string;
  startTime?: string;
  finishTime?: string;
  queueEntryTime?: string;
  serviceStartTime?: string;
  serviceFinishTime?: string;
};

type CompletedServiceHistory = {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  attendantId?: number | null;
  attendantName?: string | null;
  serviceStatus: string;
  queueEntryTime?: string;
  serviceStartTime?: string;
  serviceFinishTime?: string;
};

type CancelledAppointment = {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  servicesRequested?: string[]; // Legado
  services?: { serviceName: string }[]; // Novo Relacional
  status: 'cancelled' | 'no_show';
  finishTime: string;
  blocked?: boolean;
};

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, salonId } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [showCancellations, setShowCancellations] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<
    'all' | 'cancelled' | 'no_show'
  >('all');
  const [completedData, setCompletedData] = useState<CompletedServiceHistory[]>(
    []
  );
  const [cancelledData, setCancelledData] = useState<CancelledAppointment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Helper Híbrido: Extrai lista de strings de serviços independente do formato
  const mapServicesFromBackend = (item: any) => {
    let services: string[] = [];

    if (item.serviceName) {
      const label =
        item.serviceName === 'brush' || item.serviceName === 'escova'
          ? 'Escova'
          : item.serviceName === 'manicure'
            ? 'Manicure'
            : item.serviceName === 'pedicure'
              ? 'Pedicure'
              : item.serviceName === 'maquiagem'
                ? 'Maquiagem'
                : item.serviceName;
      return [item.attendantName ? `${label} - ${item.attendantName}` : label];
    }

    if (Array.isArray(item.services)) {
      // Novo formato: [{ serviceName: 'brush', status: 'pending' }]
      // Filtrar apenas serviços solicitados (status !== 'not_requested')
      services = item.services
        .filter((s: any) => s.status !== 'not_requested')
        .map((s: any) => {
          const label =
            s.serviceName === 'brush' || s.serviceName === 'escova'
              ? 'Escova'
              : s.serviceName === 'manicure'
                ? 'Manicure'
                : s.serviceName === 'pedicure'
                  ? 'Pedicure'
                  : s.serviceName === 'maquiagem'
                    ? 'Maquiagem'
                    : s.serviceName;
          return s.attendant?.name ? `${label} - ${s.attendant.name}` : label;
        });
    } else if (Array.isArray(item.servicesRequested)) {
      // Formato antigo: ['brush']
      services = item.servicesRequested;
    }

    // Tradução
    return services.map((s) => {
      if (s === 'brush' || s === 'escova') return 'Escova';
      if (s === 'manicure') return 'Manicure';
      if (s === 'pedicure') return 'Pedicure';
      if (s === 'maquiagem') return 'Maquiagem';
      return s;
    });
  };

  const formatServiceLabel = (serviceName: string) => {
    if (!serviceName) return '';
    const normalized = serviceName.toLowerCase().trim();
    if (normalized === 'brush' || normalized === 'escova') return 'Escova';
    if (normalized === 'manicure') return 'Manicure';
    if (normalized === 'pedicure') return 'Pedicure';
    if (normalized === 'maquiagem') return 'Maquiagem';
    // Fallback: capitaliza primeira letra se não encontrar mapeamento
    return serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
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
        const errorMessage =
          (error as any).response?.data?.error ||
          (error as any).response?.data?.message ||
          'Não foi possível buscar os atendimentos finalizados.';
        toast({
          title: 'Erro ao carregar histórico',
          description: errorMessage,
          variant: 'destructive',
          duration: 10000,
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
        const dateParam = format(date, 'yyyy-MM-dd');
        const params = new URLSearchParams();
        if (dateParam) params.append('date', dateParam);
        if (cancelStatus !== 'all') params.append('status', cancelStatus);
        const { data } = await api.get(
          `/history/cancelled/${salonId}?${params.toString()}`
        );
        setCancelledData(data);
      } catch (error) {
        console.error('Erro ao buscar cancelamentos:', error);
        const errorMessage =
          (error as any).response?.data?.error ||
          (error as any).response?.data?.message ||
          'Não foi possível buscar o histórico de cancelamentos.';
        toast({
          title: 'Erro ao carregar cancelamentos',
          description: errorMessage,
          variant: 'destructive',
          duration: 10000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (showCancellations) {
      fetchCancelledAppointments();
    }
  }, [showCancellations, salonId, toast, date, cancelStatus]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-secondary">Relatórios</h1>
        <div className="flex flex-wrap items-center gap-4">
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
          {showCancellations && (
            <div className="flex items-center gap-2">
              <select
                id="statusFilter"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={cancelStatus}
                onChange={(e) =>
                  setCancelStatus(
                    e.target.value as 'all' | 'cancelled' | 'no_show'
                  )
                }
              >
                <option value="all">Todos</option>
                <option value="cancelled">CANCELADO</option>
                <option value="no_show">NO SHOW</option>
              </select>
            </div>
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
            <CardTitle>Relatório de Cancelamentos</CardTitle>
            <CardDescription>
              Cancelamentos e não comparecimentos para o dia{' '}
              <span className="font-bold text-primary">
                {format(date, 'dd/MM/yyyy')}
              </span>
              {cancelStatus !== 'all' && (
                <>
                  {' '}
                  · Status:{' '}
                  <span className="font-bold">
                    {cancelStatus === 'no_show' ? 'NO SHOW' : 'CANCELADO'}
                  </span>
                </>
              )}
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
                      Nenhum cancelamento registrado para esta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  cancelledData.map((item, index) => (
                    <TableRow key={`${item.appointmentId}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{item.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBrazilPhone(item.clientPhone)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.clientEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapServicesFromBackend(item).join(', ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === 'no_show'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {item.status === 'no_show'
                              ? 'NO SHOW'
                              : 'CANCELADO'}
                          </Badge>
                          {item.status === 'no_show' && item.blocked && (
                            <Badge variant="outline">Bloqueado</Badge>
                          )}
                        </div>
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
                  <TableHead>Serviço</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Entrada Fila</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum atendimento finalizado nesta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  completedData.map((item, index) => (
                    <TableRow
                      key={`${item.appointmentId}-${item.serviceName}-${index}`}
                    >
                      <TableCell>
                        <div className="font-medium">{item.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBrazilPhone(item.clientPhone)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.clientEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatServiceLabel(item.serviceName)}
                      </TableCell>
                      <TableCell>{item.attendantName || '-'}</TableCell>
                      <TableCell>
                        {formatTime(item.queueEntryTime ?? '')}
                      </TableCell>
                      <TableCell>
                        {formatTime(item.serviceStartTime ?? '')}
                      </TableCell>
                      <TableCell>
                        {formatTime(item.serviceFinishTime ?? '')}
                      </TableCell>
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
