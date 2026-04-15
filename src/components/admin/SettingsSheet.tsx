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
  const [restMinutes, setRestMinutes] = useState(10);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [confirmationNoticeMinutes, setConfirmationNoticeMinutes] =
    useState(30);
  const [confirmationTimeoutMinutes, setConfirmationTimeoutMinutes] =
    useState(10);
  const [checkinGraceMinutes, setCheckinGraceMinutes] = useState(10);
  const [maxOffsetMinutes, setMaxOffsetMinutes] = useState(10);
  const [lunchStartTime, setLunchStartTime] = useState('');
  const [lunchEndTime, setLunchEndTime] = useState('');
  const [lunchDurationMinutes, setLunchDurationMinutes] = useState(60);
  const [aiName, setAiName] = useState('');
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
    if (
      restMinutes < 0 ||
      bufferMinutes < 0 ||
      confirmationNoticeMinutes < 0 ||
      confirmationTimeoutMinutes < 1 ||
      checkinGraceMinutes < 0 ||
      maxOffsetMinutes < 0
    ) {
      return 'Tempos operacionais não podem ser negativos e o timeout mínimo de confirmação deve ser maior que zero.';
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
        if (Number.isFinite(Number(data.restMinutes))) {
          setRestMinutes(Number(data.restMinutes));
        }
        if (Number.isFinite(Number(data.bufferMinutes))) {
          setBufferMinutes(Number(data.bufferMinutes));
        }
        if (Number.isFinite(Number(data.confirmationNoticeMinutes))) {
          setConfirmationNoticeMinutes(Number(data.confirmationNoticeMinutes));
        }
        if (Number.isFinite(Number(data.confirmationTimeoutMinutes))) {
          setConfirmationTimeoutMinutes(
            Number(data.confirmationTimeoutMinutes)
          );
        }
        if (Number.isFinite(Number(data.checkinGraceMinutes))) {
          setCheckinGraceMinutes(Number(data.checkinGraceMinutes));
        }
        if (Number.isFinite(Number(data.maxOffsetMinutes))) {
          setMaxOffsetMinutes(Number(data.maxOffsetMinutes));
        }
        if (typeof data.lunchStartTime === 'string' && data.lunchStartTime) {
          setLunchStartTime(data.lunchStartTime);
        }
        if (typeof data.lunchEndTime === 'string' && data.lunchEndTime) {
          setLunchEndTime(data.lunchEndTime);
        }
        if (Number.isFinite(Number(data.lunchDurationMinutes))) {
          setLunchDurationMinutes(Number(data.lunchDurationMinutes));
        }
        if (typeof data.aiName === 'string' && data.aiName) {
          setAiName(data.aiName);
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
      restMinutes,
      bufferMinutes,
      confirmationNoticeMinutes,
      confirmationTimeoutMinutes,
      checkinGraceMinutes,
      maxOffsetMinutes,
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
      lunchDurationMinutes: lunchDurationMinutes || null,
      aiName: aiName.trim() || 'Inteligência Artificial',
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
                <option value="optimized">1 atendente Mani+Pedi</option>
                <option value="always_two">
                  2 atendentes (1 Mani e 1 Pedi)
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

          <div>
            <h3 className="text-lg font-medium">Tempos Operacionais (min)</h3>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="rest-minutes">Descanso entre clientes</Label>
                <Input
                  id="rest-minutes"
                  type="number"
                  min="0"
                  value={restMinutes}
                  onChange={(e) => setRestMinutes(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="buffer-minutes">Tempo de chegada</Label>
                <Input
                  id="buffer-minutes"
                  type="number"
                  min="0"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="confirmation-notice-minutes">
                  Aviso de confirmação
                </Label>
                <Input
                  id="confirmation-notice-minutes"
                  type="number"
                  min="0"
                  value={confirmationNoticeMinutes}
                  onChange={(e) =>
                    setConfirmationNoticeMinutes(Number(e.target.value))
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="confirmation-timeout-minutes">
                  Tempo para confirmar
                </Label>
                <Input
                  id="confirmation-timeout-minutes"
                  type="number"
                  min="1"
                  value={confirmationTimeoutMinutes}
                  onChange={(e) =>
                    setConfirmationTimeoutMinutes(Number(e.target.value))
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="checkin-grace-minutes">
                  Tolerância do check-in
                </Label>
                <Input
                  id="checkin-grace-minutes"
                  type="number"
                  min="0"
                  value={checkinGraceMinutes}
                  onChange={(e) =>
                    setCheckinGraceMinutes(Number(e.target.value))
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="offset-minutes">
                  Defasagem máxima (escova x unhas)
                </Label>
                <Input
                  id="offset-minutes"
                  type="number"
                  min="0"
                  value={maxOffsetMinutes}
                  onChange={(e) => setMaxOffsetMinutes(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Horário de Almoço</h3>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="lunch-start">Início do Almoço</Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={lunchStartTime}
                  onChange={(e) => setLunchStartTime(e.target.value)}
                  placeholder="Ex: 12:00"
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="lunch-end">Fim do Almoço</Label>
                <Input
                  id="lunch-end"
                  type="time"
                  value={lunchEndTime}
                  onChange={(e) => setLunchEndTime(e.target.value)}
                  placeholder="Ex: 14:00"
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="lunch-duration">Duração do Almoço (min)</Label>
                <Input
                  id="lunch-duration"
                  type="number"
                  min="0"
                  value={lunchDurationMinutes}
                  onChange={(e) =>
                    setLunchDurationMinutes(Number(e.target.value))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Quando um atendimento termina dentro do horário de almoço, o
                tempo de descanso do atendente será substituído pela duração do
                almoço configurada acima.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Identificação da IA</h3>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="ai-name">Nome da IA</Label>
                <Input
                  id="ai-name"
                  type="text"
                  placeholder="Inteligência Artificial"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nome exibido para os clientes ao buscar horários. Deixe em
                branco para usar o padrão.
              </p>
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
