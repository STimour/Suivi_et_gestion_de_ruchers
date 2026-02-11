'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Crown, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { authService, OffreItem } from '@/lib/auth/authService';
import { useAuth } from '@/lib/auth/AuthContext';

function formatQuota(value?: number | null) {
  if (value === undefined || value === null) return '-';
  if (value === -1) return 'Illimité';
  return String(value);
}

export default function UpgradePremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [premiumOffer, setPremiumOffer] = useState<OffreItem | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const entrepriseId = user?.entreprise_id;
  const entrepriseNom = user?.entreprise_nom || 'Entreprise active';

  const limitation = useMemo(() => premiumOffer?.limitations_offres?.[0], [premiumOffer]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!entrepriseId) {
        if (active) {
          setError('Entreprise active introuvable.');
          setLoading(false);
        }
        return;
      }

      const token = authService.getToken();
      if (!token) {
        if (active) {
          setError('Session invalide. Veuillez vous reconnecter.');
          setLoading(false);
        }
        return;
      }

      try {
        const [offres, status] = await Promise.all([
          authService.listOffres(),
          authService.getEntrepriseOffreStatus(entrepriseId, token),
        ]);

        const premium =
          offres.find((o) => (o.value || '').toLowerCase() === 'premium') ||
          offres.find((o) => Boolean(o.stripeProductId)) ||
          null;

        const statusType = String(status?.type || '').toLowerCase();
        const entrepriseIsPremium = Boolean(status?.paid || statusType === 'premium');

        if (active) {
          setPremiumOffer(premium);
          setIsPremium(entrepriseIsPremium);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Impossible de charger les informations premium.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [entrepriseId]);

  const handleUpgrade = async () => {
    if (!entrepriseId) {
      setError('Entreprise active introuvable.');
      return;
    }

    setError('');
    setProcessing(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('checkout_context', 'upgrade-premium');
      }
      const checkout = await authService.createPremiumCheckout(entrepriseId);
      window.location.href = checkout.url;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la redirection vers le paiement.');
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-amber-100/70 bg-[radial-gradient(circle_at_top,_#fef3c7,_#ecfccb,_#ffffff)] p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Passer au premium</h1>
            <p className="mt-1 text-amber-800/70">Activez Premium pour {entrepriseNom}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-amber-200 text-amber-800">
              <Link href="/dashboard/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour profil
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-amber-200 text-amber-800 hover:bg-amber-50"
              aria-label="Fermer la page upgrade premium"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push('/dashboard');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="border-amber-200 bg-white/85">
            <CardContent className="py-10">
              <div className="flex items-center justify-center gap-2 text-amber-800">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement de l'offre premium...
              </div>
            </CardContent>
          </Card>
        ) : isPremium ? (
          <Card className="border-green-200 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                Votre entreprise est deja Premium
              </CardTitle>
              <CardDescription>Vous pouvez continuer a utiliser toutes les fonctionnalites avancees.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/dashboard">Aller au dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-white/90">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge className="bg-green-600 text-white hover:bg-green-600">Upgrade</Badge>
                <Badge variant="outline" className="border-amber-200 text-amber-800">
                  Freemium vers Premium
                </Badge>
              </div>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Crown className="h-5 w-5 text-amber-700" />
                {premiumOffer?.titre || 'Offre Premium'}
              </CardTitle>
              <CardDescription>
                {premiumOffer?.description || 'Augmentez vos quotas et debloquez le mode avance.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-amber-700/70">Ruchers max</p>
                  <p className="mt-1 text-lg font-semibold text-amber-900">{formatQuota(limitation?.nbRuchersMax)}</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-amber-700/70">Capteurs max</p>
                  <p className="mt-1 text-lg font-semibold text-amber-900">{formatQuota(limitation?.nbCapteursMax)}</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-amber-700/70">Reines max</p>
                  <p className="mt-1 text-lg font-semibold text-amber-900">{formatQuota(limitation?.nbReinesMax)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tarif mensuel
                </p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {premiumOffer?.prixTTC != null ? `${premiumOffer.prixTTC} EUR TTC` : 'Sur devis'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleUpgrade}
                  disabled={processing || !premiumOffer}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Passer au premium
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" className="border-amber-200 text-amber-800">
                  <Link href="/dashboard/profile">Plus tard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
