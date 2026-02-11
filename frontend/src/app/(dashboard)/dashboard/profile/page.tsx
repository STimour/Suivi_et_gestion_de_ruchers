'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, CreditCard, Mail, Shield, User as UserIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth/AuthContext';

type Entreprise = NonNullable<ReturnType<typeof useAuth>['user']>['entreprises'] extends Array<infer T>
  ? T
  : never;

function formatDate(date?: string | null) {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${numeric.toFixed(2)} EUR`;
}

function formatQuota(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric === -1) return 'Illimité';
  return String(value);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const activeEntreprise = useMemo(() => {
    if (!user?.entreprises?.length) return null;
    return user.entreprises.find((e) => e.id === user.entreprise_id) || user.entreprises[0];
  }, [user]);

  if (!user) return null;

  const offerType = activeEntreprise?.offre?.type?.titre || activeEntreprise?.typeOffre || '-';
  const offerValue = (activeEntreprise?.offre?.type?.value || activeEntreprise?.typeOffre || '').toLowerCase();
  const isPremium = Boolean(activeEntreprise?.paid || activeEntreprise?.subscriptionActive || offerValue === 'premium');
  const role = activeEntreprise?.role || user.entreprise_role || '-';
  const profileTypes = activeEntreprise?.typeProfiles || user.entreprise_typeProfiles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Mon profil</h1>
          <p className="text-amber-700/70 mt-1">Informations du compte et de l&apos;entreprise active.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-amber-200 text-amber-800 hover:bg-amber-50"
          aria-label="Fermer le profil"
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

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-amber-700" />
            Compte utilisateur
          </CardTitle>
          <CardDescription>Informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Prénom</p>
              <p className="text-amber-900 font-medium mt-1">{user.prenom || '-'}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Nom</p>
              <p className="text-amber-900 font-medium mt-1">{user.nom || '-'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-amber-100 p-4 bg-white flex items-center gap-3">
            <Mail className="h-4 w-4 text-amber-700" />
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Email</p>
              <p className="text-amber-900 font-medium">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-700" />
            Entreprise active
          </CardTitle>
          <CardDescription>Contexte courant de travail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-green-100 p-4 bg-white">
            <p className="text-xs uppercase tracking-wide text-amber-700/70">Nom</p>
            <p className="text-amber-900 font-medium mt-1">{activeEntreprise?.nom || user.entreprise_nom || '-'}</p>
          </div>
          {!isPremium && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-green-800">Offre Freemium active</p>
                <p className="text-sm text-green-700/80">Passez au Premium pour debloquer plus de capacites.</p>
              </div>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/upgrade-premium">Passer au premium</Link>
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-amber-200 text-amber-800">
              <Shield className="h-3 w-3" />
              Role: {role}
            </Badge>
            {isPremium && (
              <>
                <Badge
                  variant="outline"
                  className={
                    activeEntreprise?.paid
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-amber-300 bg-amber-50 text-amber-700'
                  }
                >
                  {activeEntreprise?.paid ? 'Paiement actif' : 'Non paye'}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    activeEntreprise?.subscriptionActive
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-orange-300 bg-orange-50 text-orange-700'
                  }
                >
                  {activeEntreprise?.subscriptionActive ? 'Subscription active' : 'Subscription inactive'}
                </Badge>
              </>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-700/70 mb-2">Type de profils</p>
            <div className="flex flex-wrap gap-2">
              {profileTypes.length > 0 ? (
                profileTypes.map((type) => (
                  <Badge key={type} variant="outline" className="border-amber-200 text-amber-800">
                    {type}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-amber-700/70">Aucun profil spécifique</p>
              )}
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" className="border-amber-200 text-amber-800 hover:bg-amber-50">
                <Link href="/upgrade-register">Modifier les profils</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-700" />
            Offre et quotas
          </CardTitle>
          <CardDescription>Détails de l&apos;abonnement de l&apos;entreprise active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPremium && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-green-800">Vous etes sur l&apos;offre Freemium</p>
                <p className="text-sm text-green-700/80">Passez au Premium pour debloquer plus de capacites.</p>
              </div>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/upgrade-premium">Passer au premium</Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Entreprise</p>
              <p className="text-amber-900 font-medium mt-1">{activeEntreprise?.nom || user.entreprise_nom || '-'}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Offre</p>
              <p className="text-amber-900 font-medium mt-1">{offerType}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Etat</p>
              <p className="text-amber-900 font-medium mt-1">{activeEntreprise?.offre?.active ? 'Active' : '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Ruchers max</p>
              <p className="text-amber-900 font-semibold mt-1">{formatQuota(activeEntreprise?.offre?.nbRuchersMax)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Capteurs max</p>
              <p className="text-amber-900 font-semibold mt-1">{formatQuota(activeEntreprise?.offre?.nbCapteursMax)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Reines max</p>
              <p className="text-amber-900 font-semibold mt-1">{formatQuota(activeEntreprise?.offre?.nbReinesMax)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Prix HT</p>
              <p className="text-amber-900 font-medium mt-1">{formatPrice(activeEntreprise?.offre?.type?.prixHT)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Prix TTC</p>
              <p className="text-amber-900 font-medium mt-1">{formatPrice(activeEntreprise?.offre?.type?.prixTTC)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Date debut</p>
              <p className="text-amber-900 font-medium mt-1">{formatDate(activeEntreprise?.offre?.dateDebut)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 p-4 bg-white">
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Date fin</p>
              <p className="text-amber-900 font-medium mt-1">{formatDate(activeEntreprise?.offre?.dateFin)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
