'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService, ProfileType } from '@/lib/auth/authService';
import { useAuth } from '@/lib/auth/AuthContext';

export default function UpgradeRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  const activeEntreprise = useMemo(() => {
    if (!user?.entreprises?.length) return null;
    return user.entreprises.find((e) => e.id === user.entreprise_id) || user.entreprises[0];
  }, [user]);

  const entrepriseId = user?.entreprise_id;

  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      try {
        const data = await authService.listProfiles();
        if (!active) return;
        setProfiles(data);
        const current = activeEntreprise?.typeProfiles || user?.entreprise_typeProfiles || [];
        setSelectedProfiles(current);
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Impossible de charger les profils.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, [activeEntreprise?.typeProfiles, user?.entreprise_typeProfiles]);

  const toggleProfile = (value: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!entrepriseId) {
      setError('Entreprise active introuvable.');
      return;
    }
    if (!selectedProfiles.length) {
      setError('Selectionnez au moins un profil.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await authService.updateEntrepriseProfiles(entrepriseId, selectedProfiles);
      window.location.href = '/dashboard/profile';
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre a jour les profils.');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-amber-100/70 bg-[radial-gradient(circle_at_top,_#fef3c7,_#ecfccb,_#ffffff)] p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Configurer les profils</h1>
            <p className="mt-1 text-amber-800/70">Mettez a jour les profils apres votre passage au Premium.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-amber-200 text-amber-800">
              <Link href="/upgrade-premium">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-amber-200 text-amber-800 hover:bg-amber-50"
              aria-label="Fermer la configuration"
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

        <Card className="border-amber-200 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Sparkles className="h-5 w-5 text-amber-700" />
              Types de profils
            </CardTitle>
            <CardDescription>Selectionnez les profils que vous voulez activer pour votre entreprise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800/80">
                Chargement des profils...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profiles.map((profile) => {
                  const selected = selectedProfiles.includes(profile.value);
                  return (
                    <button
                      key={profile.value}
                      type="button"
                      onClick={() => toggleProfile(profile.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-amber-100 bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-amber-900">{profile.titre}</h4>
                          <p className="text-sm text-amber-800/70">{profile.description}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200">
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="h-3 w-3 rounded-full bg-amber-200" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmit}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise a jour...
                  </>
                ) : (
                  'Enregistrer les profils'
                )}
              </Button>
              <Button asChild variant="outline" className="border-amber-200 text-amber-800">
                <Link href="/dashboard/profile">Plus tard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
