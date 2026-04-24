'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

type Attendant = {
  attendantId: number;
  salonId: number;
  name: string;
  roles: string[];
  active: boolean;
};

type CatalogService = {
  serviceId: number;
  salonId: number;
  name: string;
  category?: string | null;
  durationMinutes: number;
};

const KNOWN_SERVICE_LABELS: Record<string, string> = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  brush: 'Escova',
  escova: 'Escova',
  maquiagem: 'Maquiagem',
};

const KNOWN_CATEGORY_LABELS: Record<string, string> = {
  unhas: 'Unhas',
  cabelo: 'Cabelo',
  maquiagem: 'Maquiagem',
};

const toTitleCaseLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const formatCatalogServiceName = (service: CatalogService) => {
  const rawName = String(service.name || '').trim();
  const nameKey = rawName.toLowerCase();
  return KNOWN_SERVICE_LABELS[nameKey] || toTitleCaseLabel(rawName);
};

const formatCatalogCategoryLabel = (category?: string | null) => {
  const rawCategory = String(category || '').trim();
  if (!rawCategory) {
    return 'Outros';
  }

  const categoryKey = rawCategory.toLowerCase();
  return KNOWN_CATEGORY_LABELS[categoryKey] || toTitleCaseLabel(rawCategory);
};

const normalizeServiceKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase();

const formatRoleLabel = (role: string) => {
  const key = normalizeServiceKey(role);
  return KNOWN_SERVICE_LABELS[key] || toTitleCaseLabel(key);
};

interface SettingsSheetProps {
  onSave: (settings: any) => void;
  salonId?: number | string;
}

export function SettingsSheet({ onSave, salonId }: SettingsSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isAttendantModalOpen, setIsAttendantModalOpen] = useState(false);
  const [isAttendantsLoading, setIsAttendantsLoading] = useState(false);
  const [isAttendantSaving, setIsAttendantSaving] = useState(false);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [attendantListFilter, setAttendantListFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [attendantFormError, setAttendantFormError] = useState<string | null>(
    null
  );
  const [attendantForm, setAttendantForm] = useState<{
    attendantId: number | null;
    name: string;
    roles: string[];
    active: boolean;
  }>({
    attendantId: null,
    name: '',
    roles: ['manicure'],
    active: true,
  });

  const [serviceCatalog, setServiceCatalog] = useState<CatalogService[]>([]);

  const [manicureAttendants, setManicureAttendants] = useState(2);
  const [escovaAttendants, setEscovaAttendants] = useState(1);
  const [useActiveAttendantsCapacity, setUseActiveAttendantsCapacity] =
    useState(false);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [mpStrategy, setMpStrategy] = useState<'optimized' | 'always_two'>(
    'optimized'
  );
  const [queuePreOpeningHours, setQueuePreOpeningHours] = useState(1);
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

  const groupedCatalogServices = useMemo(() => {
    const grouped = serviceCatalog.reduce<
      Record<string, { categoryLabel: string; services: CatalogService[] }>
    >((acc, service) => {
      const categoryLabel = formatCatalogCategoryLabel(service.category);
      if (!acc[categoryLabel]) {
        acc[categoryLabel] = { categoryLabel, services: [] };
      }
      acc[categoryLabel].services.push(service);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        services: [...group.services].sort((a, b) =>
          formatCatalogServiceName(a).localeCompare(
            formatCatalogServiceName(b),
            'pt-BR'
          )
        ),
      }))
      .sort((a, b) => {
        if (a.categoryLabel === 'Outros') return 1;
        if (b.categoryLabel === 'Outros') return -1;
        return a.categoryLabel.localeCompare(b.categoryLabel, 'pt-BR');
      });
  }, [serviceCatalog]);

  const availableRoleOptions = useMemo(() => {
    return Array.from(
      new Set(
        serviceCatalog
          .map((service) => normalizeServiceKey(service.name))
          .filter(Boolean)
      )
    ).sort((a, b) =>
      formatRoleLabel(a).localeCompare(formatRoleLabel(b), 'pt-BR')
    );
  }, [serviceCatalog]);

  const getDefaultRole = () => availableRoleOptions[0] || 'manicure';

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const resetAttendantForm = () => {
    setAttendantForm({
      attendantId: null,
      name: '',
      roles: [getDefaultRole()],
      active: true,
    });
    setAttendantFormError(null);
  };

  const toggleAttendantRole = (role: string) => {
    const normalizedRole = normalizeServiceKey(role);
    setAttendantForm((current) => {
      const hasRole = current.roles.includes(normalizedRole);
      const roles = hasRole
        ? current.roles.filter((item) => item !== normalizedRole)
        : [...current.roles, normalizedRole];
      return { ...current, roles };
    });
  };

  const loadAttendants = useCallback(async () => {
    if (!salonId) return;
    try {
      setIsAttendantsLoading(true);
      const response = await api.get('/salon/attendants');
      setAttendants(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      if (error?.response?.status !== 400 && error?.response?.status !== 401) {
        console.error('Falha ao carregar atendentes:', error);
      }
      setAttendants([]);
    } finally {
      setIsAttendantsLoading(false);
    }
  }, [salonId]);

  const openAttendantEditor = (attendant?: Attendant) => {
    if (attendant) {
      setAttendantForm({
        attendantId: attendant.attendantId,
        name: attendant.name,
        roles: (attendant.roles || [])
          .map((role) => normalizeServiceKey(role))
          .filter(Boolean),
        active: attendant.active,
      });
    } else {
      resetAttendantForm();
    }
    setIsAttendantModalOpen(true);
  };

  const closeAttendantModal = () => {
    setIsAttendantModalOpen(false);
    resetAttendantForm();
  };

  const filteredAttendants = attendants.filter((attendant) => {
    if (attendantListFilter === 'active') return attendant.active;
    if (attendantListFilter === 'inactive') return !attendant.active;
    return true;
  });

  const validate = () => {
    if (timeToMinutes(openingTime) >= timeToMinutes(closingTime)) {
      return 'Horário de abertura deve ser anterior ao de fechamento.';
    }
    if (queuePreOpeningHours < 0) {
      return 'Horas de pré-abertura não podem ser negativas.';
    }
    if (
      serviceCatalog.length === 0 ||
      serviceCatalog.some((service) => Number(service.durationMinutes) <= 0)
    ) {
      return 'As durações médias do catálogo devem ser maiores que zero.';
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
        setUseActiveAttendantsCapacity(
          Boolean(data.useActiveAttendantsCapacity)
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

  useEffect(() => {
    const loadServiceCatalog = async () => {
      if (!salonId) return;

      try {
        const response = await api.get('/salon/services');
        const services = Array.isArray(response.data) ? response.data : [];
        setServiceCatalog(services);
      } catch {
        setServiceCatalog([]);
      }
    };

    loadServiceCatalog();
  }, [salonId]);

  useEffect(() => {
    if (!isAttendantModalOpen) return;
    loadAttendants();
  }, [isAttendantModalOpen, loadAttendants]);

  const handleSave = async () => {
    const err = validate();
    setFormError(err);
    if (err) return;
    try {
      setIsLoading(true);
      const newSettings = {
        openingTime,
        closingTime,
        manicurePedicureAttendants: manicureAttendants,
        brushAttendants: escovaAttendants,
        useActiveAttendantsCapacity,
        mpOptimizationStrategy: mpStrategy,
        queuePreOpeningHours,
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

      await onSave(newSettings);

      await api.put('/salon/services', {
        services: serviceCatalog.map((service) => ({
          serviceId: service.serviceId,
          durationMinutes: Number(service.durationMinutes),
        })),
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.error || 'Erro ao salvar configurações.';
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAttendant = async () => {
    if (!salonId) return;

    const name = attendantForm.name.trim();
    if (!name) {
      setAttendantFormError('Informe o nome do atendente.');
      return;
    }

    if (attendantForm.roles.length === 0) {
      setAttendantFormError('Selecione ao menos uma função para o atendente.');
      return;
    }

    try {
      setIsAttendantSaving(true);
      const payload = {
        name,
        roles: attendantForm.roles.map((role) => normalizeServiceKey(role)),
        active: attendantForm.active,
      };

      if (attendantForm.attendantId) {
        await api.put(
          `/salon/attendants/${attendantForm.attendantId}`,
          payload
        );
      } else {
        await api.post('/salon/attendants', payload);
      }

      await loadAttendants();
      resetAttendantForm();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao salvar atendente.';
      setAttendantFormError(msg);
    } finally {
      setIsAttendantSaving(false);
    }
  };

  const handleDeleteAttendant = async (attendantId: number) => {
    if (!salonId) return;
    if (
      !window.confirm(
        'Excluir este atendente? Esta ação não pode ser desfeita.'
      )
    ) {
      return;
    }

    try {
      setIsAttendantSaving(true);
      await api.delete(`/salon/attendants/${attendantId}`);
      await loadAttendants();
      if (attendantForm.attendantId === attendantId) {
        resetAttendantForm();
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao excluir atendente.';
      setAttendantFormError(msg);
    } finally {
      setIsAttendantSaving(false);
    }
  };

  const updateServiceDuration = (
    serviceId: number,
    durationMinutes: number
  ) => {
    setServiceCatalog((current) =>
      current.map((service) =>
        service.serviceId === serviceId
          ? { ...service, durationMinutes }
          : service
      )
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex h-full min-h-0 flex-col p-4"
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
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-medium">Estratégia de Unhas</h3>
            <Separator className="my-4" />
            <div className="space-y-3 rounded-md border p-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="mp-strategy"
                  className="mt-1"
                  checked={mpStrategy === 'optimized'}
                  onChange={() => setMpStrategy('optimized')}
                />
                <span>
                  <span className="block font-medium">1 Atendente</span>
                  <span className="block text-muted-foreground">
                    Unhas com 1 atendente por vez.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="mp-strategy"
                  className="mt-1"
                  checked={mpStrategy === 'always_two'}
                  onChange={() => setMpStrategy('always_two')}
                />
                <span>
                  <span className="block font-medium">2 Atendentes</span>
                  <span className="block text-muted-foreground">
                    Unhas com 2 atendentes simultâneos.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Atendentes</h3>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                A capacidade depende do cadastro de atendentes.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => openAttendantEditor()}
              >
                Gerenciar Atendentes
              </Button>
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
              {serviceCatalog.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Nenhum serviço foi carregado do catálogo.
                </div>
              ) : (
                groupedCatalogServices.map((group) => (
                  <div
                    key={group.categoryLabel}
                    className="space-y-3 rounded-md border p-3"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {group.categoryLabel}
                    </div>
                    <div className="space-y-3">
                      {group.services.map((service) => (
                        <div
                          key={service.serviceId}
                          className="grid grid-cols-2 items-center gap-4"
                        >
                          <Label
                            htmlFor={`service-duration-${service.serviceId}`}
                          >
                            {formatCatalogServiceName(service)}
                          </Label>
                          <Input
                            id={`service-duration-${service.serviceId}`}
                            type="number"
                            min="1"
                            value={service.durationMinutes}
                            onChange={(e) =>
                              updateServiceDuration(
                                service.serviceId,
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
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

      <AlertDialog
        open={isAttendantModalOpen}
        onOpenChange={(open) => {
          setIsAttendantModalOpen(open);
          if (!open) {
            closeAttendantModal();
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
          <div className="flex h-full max-h-[90vh] flex-col">
            <AlertDialogHeader className="shrink-0 border-b px-6 py-5 text-left">
              <AlertDialogTitle>Gerenciar atendentes</AlertDialogTitle>
              <AlertDialogDescription>
                Cadastre, edite, ative ou remova os atendentes do salão.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid flex-1 gap-6 overflow-hidden px-6 py-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                    Lista de atendentes
                  </h4>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openAttendantEditor()}
                  >
                    Novo atendente
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['all', 'Todos'],
                      ['active', 'Ativos'],
                      ['inactive', 'Inativos'],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={
                        attendantListFilter === value ? 'default' : 'outline'
                      }
                      onClick={() => setAttendantListFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {isAttendantsLoading ? (
                  <div className="flex items-center gap-2 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando atendentes...
                  </div>
                ) : filteredAttendants.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    Nenhum atendente encontrado para este filtro.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAttendants.map((attendant) => (
                      <div
                        key={attendant.attendantId}
                        className="rounded-md border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{attendant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {attendant.roles
                                .map((role) => formatRoleLabel(role))
                                .join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {attendant.active ? 'Ativo' : 'Inativo'}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openAttendantEditor(attendant)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDeleteAttendant(attendant.attendantId)
                              }
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-0 space-y-4 overflow-y-auto border-l pl-6">
                <div>
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                    {attendantForm.attendantId
                      ? 'Editar atendente'
                      : 'Novo atendente'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Marque as funções que este profissional pode executar.
                  </p>
                </div>

                {attendantFormError && (
                  <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                    {attendantFormError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendant-name">Nome</Label>
                    <Input
                      id="attendant-name"
                      value={attendantForm.name}
                      onChange={(e) =>
                        setAttendantForm((current) => ({
                          ...current,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Ana"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Funções</Label>
                    <div className="space-y-2 rounded-md border p-3">
                      {availableRoleOptions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Nenhuma função disponível no catálogo.
                        </div>
                      ) : (
                        availableRoleOptions.map((role) => (
                          <label
                            key={role}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={attendantForm.roles.includes(role)}
                              onCheckedChange={() => toggleAttendantRole(role)}
                            />
                            <span>{formatRoleLabel(role)}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="attendant-active">Ativo</Label>
                        <p className="text-xs text-muted-foreground">
                          Se desmarcado, o atendente não aparecerá na chamada do
                          próximo.
                        </p>
                      </div>
                      <Checkbox
                        id="attendant-active"
                        checked={attendantForm.active}
                        onCheckedChange={(checked) =>
                          setAttendantForm((current) => ({
                            ...current,
                            active: Boolean(checked),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveAttendant}
                    disabled={isAttendantSaving}
                  >
                    {isAttendantSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {attendantForm.attendantId
                      ? 'Salvar alterações'
                      : 'Cadastrar atendente'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAttendantForm}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="shrink-0 border-t px-6 py-4">
              <AlertDialogCancel onClick={closeAttendantModal}>
                Fechar
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-0 border-t bg-card p-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
}
