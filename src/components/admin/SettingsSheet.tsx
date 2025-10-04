'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface SettingsSheetProps {
  onSave: (settings: any) => void;
  // No futuro, você passaria os valores atuais:
  // currentSettings: { ... };
}

export function SettingsSheet({ onSave }: SettingsSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  // No futuro, você inicializaria este estado com os valores atuais
  const [manicureAttendants, setManicureAttendants] = useState(2);
  const [escovaAttendants, setEscovaAttendants] = useState(1);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const newSettings = {
      manicureAttendants,
      escovaAttendants,
      openingTime,
      closingTime,
    };

    console.log('Salvando novas configurações:', newSettings);

    // Simula a chamada para a API
    setTimeout(() => {
      onSave(newSettings);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form
      onSubmit={handleSave}
      className="flex h-full flex-col justify-between p-4"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Atendentes</h3>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="manicure-attendants">Manicure & Pedicure</Label>
              <Input
                id="manicure-attendants"
                type="number"
                min="1"
                value={manicureAttendants}
                onChange={(e) => setManicureAttendants(Number(e.target.value))}
                className="col-span-1"
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="escova-attendants">Escova</Label>
              <Input
                id="escova-attendants"
                type="number"
                min="1"
                value={escovaAttendants}
                onChange={(e) => setEscovaAttendants(Number(e.target.value))}
                className="col-span-1"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Horário de Funcionamento</h3>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="opening-time">Abertura</Label>
              <Input
                id="opening-time"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="closing-time">Fechamento</Label>
              <Input
                id="closing-time"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
}
