'use client';

import { useState } from 'react';
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
  onSuccess: (services: ServiceData) => void;
}

export function ServiceSelectionForm({
  clientData,
  onSuccess,
}: ServiceSelectionFormProps) {
  const [selectedServices, setSelectedServices] = useState<ServiceData>({
    manicure: false,
    pedicure: false,
    escova: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckboxChange = (service: keyof typeof selectedServices) => {
    setSelectedServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAnyServiceSelected) {
      console.error('Nenhum serviço selecionado.');
      return;
    }

    setIsLoading(true);

    console.log('Enviando serviços selecionados:', {
      client: clientData,
      services: selectedServices,
    });

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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manicure"
              checked={selectedServices.manicure}
              onCheckedChange={() => handleCheckboxChange('manicure')}
            />
            <Label htmlFor="manicure">Manicure</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pedicure"
              checked={selectedServices.pedicure}
              onCheckedChange={() => handleCheckboxChange('pedicure')}
            />
            <Label htmlFor="pedicure">Pedicure</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="escova"
              checked={selectedServices.escova}
              onCheckedChange={() => handleCheckboxChange('escova')}
            />
            <Label htmlFor="escova">Escova</Label>
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
