import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock time calculation utility
type ServiceData = { manicure: boolean; pedicure: boolean; escova: boolean };

// Mapeamento de tempo por serviço (em minutos)
const SERVICE_TIMES = {
  manicure: 30,
  pedicure: 30,
  escova: 60,
};

export function calculateMockWaitTime(services: ServiceData) {
  // 1. Calcula a duração total dos serviços escolhidos
  let serviceDuration = 0;
  if (services.manicure) serviceDuration += SERVICE_TIMES.manicure;
  if (services.pedicure) serviceDuration += SERVICE_TIMES.pedicure;
  if (services.escova) serviceDuration += SERVICE_TIMES.escova;

  // 2. Simula o tempo de espera da fila
  const peopleInFront = Math.floor(Math.random() * 5) + 1; // De 1 a 5 pessoas na frente
  const averageTimePerPerson = 25; // Média de 25 min por pessoa
  const queueWaitTime = peopleInFront * averageTimePerPerson;

  // 3. O tempo estimado total é o tempo da fila
  const estimatedTime = queueWaitTime;

  console.log('--- CÁLCULO SIMULADO ---');
  console.log('Serviços:', services);
  console.log(`Duração dos serviços: ${serviceDuration} min`);
  console.log(`Pessoas na frente: ${peopleInFront}`);
  console.log(`Tempo de espera da fila: ${queueWaitTime} min`);

  return {
    estimatedTime,
    position: peopleInFront + 1, // A posição dele na fila
  };
}
