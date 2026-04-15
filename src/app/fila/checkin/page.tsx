'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StaticCheckinPage() {
  const searchParams = useSearchParams();
  const salonId = searchParams.get('salonId');

  const salonLabel = useMemo(() => {
    if (!salonId) return 'salão';
    return `salão ${salonId}`;
  }, [salonId]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-slate-100">
      <Card className="w-full max-w-xl border-white/10 bg-slate-950/80 text-center text-slate-100 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge className="mx-auto w-fit rounded-full bg-emerald-500/15 px-4 py-1 text-emerald-200 hover:bg-emerald-500/15">
            Check-in do salão
          </Badge>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            QR estático da placa
          </CardTitle>
          <CardDescription className="text-base text-slate-300">
            Este QR identifica o {salonLabel}. Se você chegou ao salão, volte
            para a tela de tracking e use a opção de escanear QR para registrar
            sua presença.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-slate-100">Como funciona</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>A cliente abre a tela de tracking no celular.</li>
              <li>
                Ela toca em{' '}
                <span className="font-semibold text-slate-100">
                  Escanear QR do salão
                </span>
                .
              </li>
              <li>A câmera lê este QR fixo da plaquinha.</li>
              <li>
                O check-in muda de{' '}
                <span className="font-semibold text-slate-100">confirmed</span>{' '}
                para{' '}
                <span className="font-semibold text-slate-100">arrived</span>.
              </li>
            </ol>
          </div>
          <p className="text-xs text-slate-400">
            Se você abriu esta página pela câmera do celular, ela serve só como
            referência visual. O check-in é concluído pela tela de tracking do
            agendamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
