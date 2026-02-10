'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/lib/auth/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

function VerifyAccountPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    const verify = async () => {
      setStatus('loading');
      try {
        await authService.verifyAccount(token);
        setStatus('success');
        setMessage('Votre compte est désormais actif.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Impossible de vérifier le compte.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#ecfccb,_#dcfce7)] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-2xl border border-amber-100/60 bg-white/90 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo_ruche_1.png"
              alt="Logo Ruche"
              width={72}
              height={72}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-amber-900">Validation du compte</CardTitle>
            <CardDescription className="text-amber-800/70">
              Finalisez votre inscription en confirmant votre email.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-green-600" />
              <p className="text-sm text-amber-800/80">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-green-600" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild variant="outline" className="border-amber-200 text-amber-800">
              <Link href="/register">Retour à l'inscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense>
      <VerifyAccountPageInner />
    </Suspense>
  );
}
