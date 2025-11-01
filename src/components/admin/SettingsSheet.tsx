'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface SettingsSheetProps {
  onSave: (settings: any) => void;
  salonId?: number | string;
}

export function SettingsSheet({ onSave, salonId }: SettingsSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [manicureAttendants, setManicureAttendants] = useState(2);
  const [escovaAttendants, setEscovaAttendants] = useState(1);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [mpStrategy, setMpStrategy] = useState<'optimized' | 'always_two'>(
    'optimized'
  );
  const [queuePreOpeningHours, setQueuePreOpeningHours] = useState(1);
  const [manicureAvgTime, setManicureAvgTime] = useState(30);
  const [pedicureAvgTime, setPedicureAvgTime] = useState(50);
  const [brushAvgTime, setBrushAvgTime] = useState(60);
  const [formError, setFormError] = useState<string | null>(null);

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const validate = () => {
    if (timeToMinutes(openingTime) >= timeToMinutes(closingTime)) {
      return 'Horário de abertura deve ser anterior ao de fechamento.';
    }
    if (manicureAttendants < 1 || escovaAttendants < 1) {
      return 'Quantidade de atendentes deve ser no mínimo 1 em cada pool.';
    }
    if (queuePreOpeningHours < 0) {
      return 'Horas de pré-abertura não podem ser negativas.';
    }
    if (manicureAvgTime <= 0 || pedicureAvgTime <= 0 || brushAvgTime <= 0) {
      return 'Durações médias devem ser maiores que zero.';
    }
    return null;
  };

  useEffect(() => {
    const loadSalonConfig = async () => {
      if (!salonId) return;
      try {
        setIsFetching(true);
        const res = await api.get(`/salon/${salonId}`);
        const data = res.data || {};
        // Aceitar tanto novos quanto legados
        setManicureAttendants(
          Number(
            data.manicurePedicureAttendants ??
              data.numberOfManicureStations ??
              2
          )
        );
        setEscovaAttendants(
          Number(data.brushAttendants ?? data.numberOfBrushStations ?? 1)
        );
        if (typeof data.openingTime === 'string')
          setOpeningTime(data.openingTime);
        if (typeof data.closingTime === 'string')
          setClosingTime(data.closingTime);
        if (
          data.mpOptimizationStrategy === 'always_two' ||
          data.mpOptimizationStrategy === 'optimized'
        ) {
          setMpStrategy(data.mpOptimizationStrategy);
        }
        if (Number.isFinite(Number(data.queuePreOpeningHours))) {
          setQueuePreOpeningHours(Number(data.queuePreOpeningHours));
        }
        if (Number.isFinite(Number(data.manicureAvgTime))) {
          setManicureAvgTime(Number(data.manicureAvgTime));
        }
        if (Number.isFinite(Number(data.pedicureAvgTime))) {
          setPedicureAvgTime(Number(data.pedicureAvgTime));
        }
        if (Number.isFinite(Number(data.brushAvgTime))) {
          setBrushAvgTime(Number(data.brushAvgTime));
        }
      } catch (err) {
        // Silencioso; o dashboard exibirá toasts se necessário
        // Poderíamos adicionar um pequeno aviso local aqui se quisermos
      } finally {
        setIsFetching(false);
      }
    };
    loadSalonConfig();
  }, [salonId]);

  const handleSave = () => {
    const err = validate();
    setFormError(err);
    if (err) return;
    setIsLoading(true);
    const newSettings = {
      openingTime,
      closingTime,
      manicurePedicureAttendants: manicureAttendants,
      brushAttendants: escovaAttendants,
      mpOptimizationStrategy: mpStrategy,
      queuePreOpeningHours,
      manicureAvgTime,
      pedicureAvgTime,
      brushAvgTime,
    };
    onSave(newSettings);
    setIsLoading(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex h-full flex-col p-4"
    >
      <div className="space-y-3">
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados do
            salão...
          </div>
        )}
        {formError && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            {formError}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-medium">
              Estratégia de Manicure + Pedicure
            </h3>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="mp-strategy">Otimização</Label>
              <select
                id="mp-strategy"
                className="col-span-1 rounded-md border bg-background p-2"
                value={mpStrategy}
                onChange={(e) =>
                  setMpStrategy(e.target.value as 'optimized' | 'always_two')
                }
              >
                <option value="optimized">
                  Liberar 1 atendente (1 faz Mani+Pedi)
                </option>
                <option value="always_two">
                  Sempre 2 atendentes (Mani e Pedi)
                </option>
              </select>
            </div>
          </div>

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
                  onChange={(e) =>
                    setManicureAttendants(Number(e.target.value))
                  }
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
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="preopen-hours">
                  Pré-abertura da fila (horas)
                </Label>
                <Input
                  id="preopen-hours"
                  type="number"
                  min="0"
                  value={queuePreOpeningHours}
                  onChange={(e) =>
                    setQueuePreOpeningHours(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Duração Média (min)</h3>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="avg-manicure">Manicure</Label>
                <Input
                  id="avg-manicure"
                  type="number"
                  min="1"
                  value={manicureAvgTime}
                  onChange={(e) => setManicureAvgTime(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="avg-pedicure">Pedicure</Label>
                <Input
                  id="avg-pedicure"
                  type="number"
                  min="1"
                  value={pedicureAvgTime}
                  onChange={(e) => setPedicureAvgTime(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="avg-brush">Escova</Label>
                <Input
                  id="avg-brush"
                  type="number"
                  min="1"
                  value={brushAvgTime}
                  onChange={(e) => setBrushAvgTime(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-0 border-t bg-card p-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
}
