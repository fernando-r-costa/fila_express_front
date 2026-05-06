'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Camera, Loader2, ScanLine, X } from 'lucide-react';
import api from '@/lib/api';

type ScannerProps = {
  appointmentId: number;
  salonId?: number | null;
  clientPhone?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  onClose?: () => void;
};

type DetectedResult = { rawValue?: string };

const extractSalonId = (rawValue: string) => {
  try {
    const url = new URL(rawValue);
    const salonId = url.searchParams.get('salonId');
    if (salonId) return Number(salonId);
  } catch {
    // Não é URL; continua tentando formatos simples.
  }

  const match =
    rawValue.match(/salonId=(\d+)/i) || rawValue.match(/salon[:\s-]*(\d+)/i);
  if (match?.[1]) return Number(match[1]);

  const digits = rawValue.replace(/\D/g, '');
  return digits ? Number(digits) : null;
};

export function SalonCheckinScanner({
  appointmentId,
  salonId,
  clientPhone,
  onSuccess,
  onCancel,
  onClose,
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [needsManualPermission, setNeedsManualPermission] = useState(false);

  const stopScanner = () => {
    runningRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleDetected = async (rawValue: string) => {
    const detectedSalonId = extractSalonId(rawValue);
    if (!detectedSalonId) {
      setError('O QR lido não contém o salão esperado.');
      return;
    }

    if (salonId && detectedSalonId !== Number(salonId)) {
      setError('Este QR não corresponde ao salão deste agendamento.');
      return;
    }

    setIsSubmitting(true);
    setMessage('QR validado. Registrando check-in...');

    try {
      await api.patch(`/appointments/${appointmentId}/checkin`, {
        salonId: detectedSalonId,
        clientPhone,
      });

      stopScanner();
      setIsRunning(false);
      setMessage('Check-in realizado com sucesso.');
      onSuccess();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          'Não foi possível registrar o check-in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanner = async () => {
    setError(null);
    setNeedsManualPermission(false);
    setMessage('Ativando câmera...');

    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError('Seu navegador não permite acesso à câmera.');
      return;
    }

    if (!window.isSecureContext) {
      setNeedsManualPermission(true);
      setError(
        'A câmera só abre em contexto seguro. Abra este endereço em HTTPS ou use um navegador/dispositivo que permita câmera em rede local.'
      );
      return;
    }

    if (!('BarcodeDetector' in window)) {
      setNeedsManualPermission(true);
      setError(
        'Seu navegador não suporta leitura nativa de QR code. No iPhone, use Safari atualizado; em alguns casos é necessário HTTPS.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });

      streamRef.current = stream;
      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ['qr_code'],
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsRunning(true);
      runningRef.current = true;
      setMessage('Aponte a câmera para o QR fixo do salão.');

      const scanLoop = async () => {
        if (!videoRef.current || !detectorRef.current || !runningRef.current)
          return;

        try {
          const results: DetectedResult[] = await detectorRef.current.detect(
            videoRef.current
          );
          const rawValue = results[0]?.rawValue;

          if (rawValue) {
            await handleDetected(rawValue);
            return;
          }
        } catch {
          // Continua tentando na próxima frame.
        }

        frameRef.current = requestAnimationFrame(scanLoop);
      };

      frameRef.current = requestAnimationFrame(scanLoop);
    } catch (cameraError: any) {
      const cameraName = cameraError?.name || '';
      if (
        cameraName === 'NotAllowedError' ||
        cameraName === 'PermissionDeniedError'
      ) {
        setNeedsManualPermission(true);
        setError(
          'Permissão de câmera negada. Toque no ícone de cadeado na barra do navegador e permita o acesso à câmera.'
        );
      } else {
        setError(
          cameraError?.message ||
            'Não foi possível iniciar a câmera do dispositivo.'
        );
      }
      stopScanner();
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-300">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Escanear QR do salão</p>
            <p className="text-xs text-slate-400">
              Aponte para o QR fixo da plaquinha na recepção.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-100">
          <p className="font-semibold">Permissão da câmera</p>
          <p className="mt-1">
            Ao tocar em iniciar leitura, o navegador deve perguntar se você
            permite o uso da câmera. Se não aparecer, verifique o cadeado na
            barra de endereço e autorize a câmera manualmente.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            muted
            playsInline
          />
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <Camera className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitting ? (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirmando check-in...
          </div>
        ) : null}

        <div className="flex gap-2">
          {!isRunning ? (
            <Button type="button" className="flex-1" onClick={startScanner}>
              <ScanLine className="mr-2 h-4 w-4" />
              Iniciar leitura
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                stopScanner();
                setIsRunning(false);
                setMessage('Leitura interrompida.');
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Parar leitura
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                stopScanner();
                setIsRunning(false);
                setMessage('Leitura interrompida.');
                onCancel();
              }}
            >
              Cancelar atendimento
            </Button>
          )}

          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-400">
          Se a câmera não reconhecer o QR, aproxime o celular da placa e
          mantenha o código centralizado na tela.
        </div>

        {needsManualPermission && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
            Se você estiver no celular e a câmera não abrir, o problema
            normalmente é permissão negada ou acesso sem HTTPS. Use o cadeado do
            navegador para liberar a câmera ou acesse por uma URL segura.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
