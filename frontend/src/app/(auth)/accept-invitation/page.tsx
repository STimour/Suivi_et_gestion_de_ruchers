'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/lib/auth/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2, LogIn, UserPlus } from 'lucide-react';

function AcceptInvitationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthenticated'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token d\'invitation manquant.');
      return;
    }

    if (authService.isAuthenticated()) {
      // User is logged in — accept the invitation directly
      const accept = async () => {
        try {
          await authService.acceptInvitation(token);
          // Clear any pending token
          localStorage.removeItem('pending_invitation_token');
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Erreur lors de l\'acceptation de l\'invitation.');
        }
      };
      accept();
    } else {
      // User is not logged in — store token and show options
      localStorage.setItem('pending_invitation_token', token);
      setStatus('unauthenticated');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo_ruche_1.png"
              alt="Logo Ruche"
              width={80}
              height={80}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-amber-900">
              Invitation
            </CardTitle>
            <CardDescription className="text-amber-700/70">
              Rejoindre une entreprise
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm text-amber-800/80">Traitement de l&apos;invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-700">
                Invitation acceptée avec succès !
              </p>
              <p className="text-xs text-amber-700/70">
                Redirection vers le tableau de bord...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="border-amber-200 text-amber-800"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          )}

          {status === 'unauthenticated' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800/80 text-center">
                Connectez-vous ou créez un compte pour rejoindre l&apos;entreprise.
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/login">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-amber-200 text-amber-800" size="lg">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationInner />
    </Suspense>
  );
}
