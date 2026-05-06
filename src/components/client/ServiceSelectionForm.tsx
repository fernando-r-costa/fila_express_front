'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

type ClientData = {
  name: string;
  phone: string;
  email: string;
};

type ServiceData = {
  [serviceName: string]: boolean;
};

type CatalogService = {
  serviceId: number;
  salonId: number;
  name: string;
  category?: string | null;
  durationMinutes?: number;
  available?: boolean;
};

interface ServiceSelectionFormProps {
  clientData: ClientData;
  salonId?: number;
  onSuccess: (services: ServiceData) => void;
}

export function ServiceSelectionForm({
  clientData,
  salonId,
  onSuccess,
}: ServiceSelectionFormProps) {
  const [selectedServices, setSelectedServices] = useState<ServiceData>({});
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const normalizeServiceName = (value: string) => {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'escova') return 'brush';
    return normalized;
  };

  const formatServiceLabel = (serviceName: string) => {
    const normalized = normalizeServiceName(serviceName);
    if (normalized === 'manicure') return 'Manicure';
    if (normalized === 'pedicure') return 'Pedicure';
    if (normalized === 'brush') return 'Escova';
    if (normalized === 'maquiagem') return 'Maquiagem';

    return normalized
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    let isMounted = true;

    const loadAvailability = async () => {
      if (!salonId) return;

      setIsCatalogLoading(true);

      try {
        const { data } = await api.get(`/salon/${salonId}/services`);
        const services = Array.isArray(data) ? data : [];

        if (!isMounted) return;

        setCatalogServices(services);

        setSelectedServices((prev) => {
          const next: ServiceData = {};
          for (const service of services) {
            const key = normalizeServiceName(service.name);
            const isAvailable = Boolean(service.available);
            next[key] = isAvailable ? Boolean(prev[key]) : false;
          }
          return next;
        });
      } catch {
        // Em erro de leitura, mantém sem opções para não enviar seleção inconsistente.
        if (!isMounted) return;
        setCatalogServices([]);
        setSelectedServices({});
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      }
    };

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const handleCheckboxChange = (serviceName: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return;
    }

    const key = normalizeServiceName(serviceName);

    setSelectedServices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAnyServiceSelected) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(selectedServices);
    }, 1500);
  };

  const isAnyServiceSelected = Object.values(selectedServices).some(
    (service) => service === true
  );

  const orderedCatalogServices = [...catalogServices].sort((a, b) => {
    const categoryA = String(a.category || '').toLowerCase();
    const categoryB = String(b.category || '').toLowerCase();
    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB, 'pt-BR');
    }
    return formatServiceLabel(a.name).localeCompare(
      formatServiceLabel(b.name),
      'pt-BR'
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Seleção de Serviços</CardTitle>
          <CardDescription className="text-center">
            Escolha um ou mais serviços
            <br />
            que deseja realizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isCatalogLoading ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando serviços...
            </div>
          ) : orderedCatalogServices.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum serviço disponível no catálogo.
            </div>
          ) : (
            orderedCatalogServices.map((service) => {
              const key = normalizeServiceName(service.name);
              const isAvailable = Boolean(service.available);

              return (
                <div
                  key={service.serviceId}
                  className={`flex items-center space-x-2 ${
                    !isAvailable ? 'opacity-50' : ''
                  }`}
                >
                  <Checkbox
                    id={`service-${service.serviceId}`}
                    checked={Boolean(selectedServices[key])}
                    onCheckedChange={() =>
                      handleCheckboxChange(service.name, isAvailable)
                    }
                    disabled={!isAvailable || isLoading}
                  />
                  <Label htmlFor={`service-${service.serviceId}`}>
                    {formatServiceLabel(service.name)}
                  </Label>
                  {!isAvailable && (
                    <span className="text-xs text-muted-foreground">
                      indisponível
                    </span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isAnyServiceSelected}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Consultar Tempo
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
