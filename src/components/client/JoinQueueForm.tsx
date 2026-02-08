'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatBrazilPhoneInput } from '@/lib/utils';

type ClientData = {
  name: string;
  phone: string;
  email: string;
};

interface JoinQueueFormProps {
  onSuccess: (data: ClientData) => void;
}

export function JoinQueueForm({ onSuccess }: JoinQueueFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const sanitizePhone = (value: string) => value.replace(/\D/g, '');
  const isValidBrazilMobile = (value: string) => /^[1-9]{2}9\d{8}$/.test(value);
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPhoneError(null);
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Informe um e-mail válido.');
      return;
    }

    const digitsOnly = sanitizePhone(phone);
    if (!isValidBrazilMobile(digitsOnly)) {
      setPhoneError('Informe um celular válido com DDD ((XX) XXXXX-XXXX).');
      return;
    }

    setIsLoading(true);

    const data = { name, phone: digitsOnly, email: trimmedEmail };

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(data);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Identificação</CardTitle>
          <CardDescription>Preencha seus dados para começar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome:</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone (WhatsApp):</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(XX) XXXXX-XXXX"
              required
              value={phone}
              onChange={(e) => setPhone(formatBrazilPhoneInput(e.target.value))}
              aria-invalid={phoneError ? 'true' : undefined}
              aria-describedby={phoneError ? 'phone-error' : undefined}
            />
            {phoneError && (
              <p id="phone-error" className="text-xs text-destructive">
                {phoneError}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail:</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailError ? 'true' : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-xs text-destructive">
                {emailError}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Avançar
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
