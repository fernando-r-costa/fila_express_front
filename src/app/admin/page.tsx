'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmSessionReplaceOpen, setConfirmSessionReplaceOpen] =
    useState(false);
  const [pendingLogin, setPendingLogin] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(username, password);

      if (success) {
        router.push('/admin/dashboard');
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      global.console.error('Falha no login:', err);
      if (err.response?.data?.code === 'SESSION_LIMIT_REACHED') {
        setPendingLogin({ username, password });
        setConfirmSessionReplaceOpen(true);
        setIsLoading(false);
        return;
      }

      setError(
        err.response?.data?.error || 'Falha ao conectar com o servidor.'
      );
      setIsLoading(false);
    }
  };

  const handleConfirmSessionReplace = async () => {
    if (!pendingLogin) return;

    setIsLoading(true);
    setError(null);
    setConfirmSessionReplaceOpen(false);

    try {
      const success = await login(
        pendingLogin.username,
        pendingLogin.password,
        {
          forceOldestSession: true,
        }
      );

      if (success) {
        router.push('/admin/dashboard');
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      global.console.error('Falha no login confirmado:', err);
      setError(
        err.response?.data?.error || 'Falha ao conectar com o servidor.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Acesso do Salão</CardTitle>
            <CardDescription>Entre para gerenciar a fila.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Nome de Usuário:</Label>
              <Input
                id="username"
                type="text"
                placeholder="ex: salao_admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha:</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </CardFooter>
        </Card>
      </form>
      <AlertDialog
        open={confirmSessionReplaceOpen}
        onOpenChange={setConfirmSessionReplaceOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de sessões atingido</AlertDialogTitle>
            <AlertDialogDescription>
              Este salão já está conectado em 3 máquinas. Se prosseguir, a
              primeira sessão logada será deslogada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSessionReplace}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Prosseguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
