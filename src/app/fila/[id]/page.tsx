'use client';

import { useState, useEffect } from 'react';
import { QueueTrackingView } from '@/components/client/QueueTrackingView';
import { TimeConfirmationSkeleton } from '@/components/client/TimeConfirmationSkeleton';

// Em um cenário real, você teria uma função de serviço para buscar dados
// import { fetchQueueStatusById } from '@/services/queueService';

// Mock de dados para teste
type MockData = {
  initialTime: number;
  initialPosition: number;
  serviceData: { manicure: boolean; pedicure: boolean; escova: boolean };
};

export default function QueuePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<MockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. SIMULANDO A BUSCA DE DADOS NA API USANDO O ID
    console.log(`Buscando dados para o cliente com ID: ${params.id}`);
    setTimeout(() => {
      // Aqui viriam os dados do seu backend
      const fetchedData: MockData = {
        initialTime: 45, // Ex: Dado vindo do backend
        initialPosition: 5, // Ex: Dado vindo do backend
        serviceData: { manicure: true, pedicure: true, escova: false },
      };
      setData(fetchedData);
      setIsLoading(false);
    }, 1500); // Simula 1.5s de loading de rede
  }, [params.id]);

  const handleCancel = () => {
    console.log('PROCESSO CANCELADO PELO LINK DIRETO');
    // Aqui você poderia, por exemplo, redirecionar para a home
    // window.location.href = '/';
  };

  const handleFinalConfirmation = () => {
    console.log('CLIENTE CONFIRMOU PRESENÇA PELO LINK DIRETO!');
    // Mudar para uma tela de sucesso
  };

  // Enquanto busca os dados, mostre um skeleton
  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <TimeConfirmationSkeleton />
      </div>
    );
  }

  // 2. APENAS RENDERIZE O COMPONENTE PRINCIPAL E PASSE OS DADOS
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
