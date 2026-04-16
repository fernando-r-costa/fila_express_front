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
  manicure: boolean;
  pedicure: boolean;
  escova: boolean;
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
  const [selectedServices, setSelectedServices] = useState<ServiceData>({
    manicure: false,
    pedicure: false,
    escova: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serviceAvailability, setServiceAvailability] = useState({
    manicure: true,
    pedicure: true,
    escova: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadAvailability = async () => {
      if (!salonId) return;

      try {
        const { data } = await api.get(`/salon/${salonId}`);

        const nailsCount = Number(
          data?.manicurePedicureAttendants ??
            data?.numberOfManicurePedicureStations ??
            0
        );
        const brushCount = Number(
          data?.brushAttendants ?? data?.numberOfBrushStations ?? 0
        );
        const nextAvailability = {
          manicure: nailsCount > 0,
          pedicure: nailsCount > 0,
          escova: brushCount > 0,
        };

        if (!isMounted) return;

        setServiceAvailability(nextAvailability);

        setSelectedServices((prev) => ({
          manicure: nextAvailability.manicure ? prev.manicure : false,
          pedicure: nextAvailability.pedicure ? prev.pedicure : false,
          escova: nextAvailability.escova ? prev.escova : false,
        }));
      } catch {
        // Em erro de leitura, mantém habilitado para não bloquear indevidamente.
      }
    };

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const handleCheckboxChange = (service: keyof typeof selectedServices) => {
    if (!serviceAvailability[service]) {
      return;
    }

    setSelectedServices((prev) => ({
      ...prev,
      [service]: !prev[service],
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
          <div
            className={`flex items-center space-x-2 ${
              !serviceAvailability.manicure ? 'opacity-50' : ''
            }`}
          >
            <Checkbox
              id="manicure"
              checked={selectedServices.manicure}
              onCheckedChange={() => handleCheckboxChange('manicure')}
              disabled={!serviceAvailability.manicure || isLoading}
            />
            <Label htmlFor="manicure">Manicure</Label>
            {!serviceAvailability.manicure && (
              <span className="text-xs text-muted-foreground">
                indisponível
              </span>
            )}
          </div>
          <div
            className={`flex items-center space-x-2 ${
              !serviceAvailability.pedicure ? 'opacity-50' : ''
            }`}
          >
            <Checkbox
              id="pedicure"
              checked={selectedServices.pedicure}
              onCheckedChange={() => handleCheckboxChange('pedicure')}
              disabled={!serviceAvailability.pedicure || isLoading}
            />
            <Label htmlFor="pedicure">Pedicure</Label>
            {!serviceAvailability.pedicure && (
              <span className="text-xs text-muted-foreground">
                indisponível
              </span>
            )}
          </div>
          <div
            className={`flex items-center space-x-2 ${
              !serviceAvailability.escova ? 'opacity-50' : ''
            }`}
          >
            <Checkbox
              id="escova"
              checked={selectedServices.escova}
              onCheckedChange={() => handleCheckboxChange('escova')}
              disabled={!serviceAvailability.escova || isLoading}
            />
            <Label htmlFor="escova">Escova</Label>
            {!serviceAvailability.escova && (
              <span className="text-xs text-muted-foreground">
                indisponível
              </span>
            )}
          </div>
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
