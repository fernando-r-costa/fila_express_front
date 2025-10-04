'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';

// função de serviço para buscar dados

// Mock de dados para teste
type MockData = {
  initialTime: number;
  initialPosition: number;
  serviceData: { manicure: boolean; pedicure: boolean; escova: boolean };
};

export default function QueuePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. SIMULANDO A BUSCA DE DADOS NA API USANDO O ID
    console.log(`Buscando dados para o cliente com ID: ${id}`);
    setTimeout(() => {
      const fetchedData: MockData = {
        initialTime: 45,
        initialPosition: 5,
        serviceData: { manicure: true, pedicure: true, escova: false },
      };
      setData(fetchedData);
      setIsLoading(false);
    }, 1500);
  }, [id]);

  const handleCancel = () => {
    console.log('PROCESSO CANCELADO PELO LINK DIRETO');
    // redirecionar para a home
  };

  const handleFinalConfirmation = () => {
    console.log('CLIENTE CONFIRMOU PRESENÇA PELO LINK DIRETO!');
    // tela de sucesso
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <TimeConfirmationSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <QueueTrackingView
        initialTime={data.initialTime}
        initialPosition={data.initialPosition}
        serviceData={data.serviceData}
        onCancel={handleCancel}
        onFinalConfirmation={handleFinalConfirmation}
      />
    </div>
  );
}
