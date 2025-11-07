'use client';

import { ClientSignUpFlow } from '@/components/client/ClientSignUpFlow';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type ClientData = { name: string; phone: string; email: string };
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };
type WaitData = {
  estimatedTime: number;
  position: number;
  appointmentId?: number;
};

export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();

  const salonId = useMemo(() => {
    const envVar = process.env.NEXT_PUBLIC_SALON_ID;
    return envVar ? Number(envVar) : undefined;
  }, []);

  const handleFlowComplete = (
    client: ClientData,
    services: ServiceData,
    wait: WaitData
  ) => {
    // Redireciona para a página de acompanhamento da fila
    if (wait.appointmentId) {
      router.push(`/fila/${wait.appointmentId}`);
    } else {
      toast({
        title: 'Erro ao entrar na fila',
        description: 'Não foi possível obter o ID do agendamento.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Reset do formulário (volta para identificação)
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <ClientSignUpFlow
        onFlowComplete={handleFlowComplete}
        onCancel={handleCancel}
        salonId={salonId}
      />
    </div>
  );
}
