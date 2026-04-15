'use client';

import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildStaticCheckinUrl } from '@/lib/checkin';

export default function CheckinQrPage() {
  const salonId = Number(process.env.NEXT_PUBLIC_SALON_ID || '0');

  const checkinUrl = useMemo(() => {
    if (!salonId) return '';
    return buildStaticCheckinUrl(salonId);
  }, [salonId]);

  const printPage = () => window.print();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)] px-4 py-8 text-slate-100 print:bg-white print:text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <div>
            <Badge className="mb-3 rounded-full bg-emerald-500/15 px-4 py-1 text-emerald-200 hover:bg-emerald-500/15">
              Check-in presencial
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              QR fixo da recepção
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Imprima esta página e deixe visível na recepção. A cliente abre a
              tela de acompanhamento no celular, toca em escanear e lê este QR
              ao chegar no salão.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-slate-950"
            >
              <Link href="/admin/dashboard">Voltar ao dashboard</Link>
            </Button>
            <Button
              type="button"
              onClick={printPage}
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              Imprimir
            </Button>
          </div>
        </div>

        <Card className="border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 print:border-slate-200 print:bg-white print:shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl print:text-slate-900">
              Escaneie para confirmar sua chegada
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-10 pt-2">
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] print:border print:border-slate-200 print:shadow-none">
              {checkinUrl ? (
                <QRCodeSVG
                  value={checkinUrl}
                  size={320}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                  includeMargin
                />
              ) : (
                <div className="flex h-[320px] w-[320px] items-center justify-center border-2 border-dashed border-slate-300 text-sm text-slate-500">
                  Defina `NEXT_PUBLIC_SALON_ID` para gerar o QR.
                </div>
              )}
            </div>

            <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-xl text-slate-300 print:border-slate-200 print:bg-white print:text-slate-700">
              <p className="text-base font-semibold text-slate-100 print:text-slate-900">
                Instruções rápidas
              </p>
              <p className="mt-2">
                1 - Abra a tela de acompanhamento no celular.
              </p>
              <p className="mt-2">2 - Toque em escanear QR CODE no salão.</p>
              <p className="mt-2">3 - Aponte para este código.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
