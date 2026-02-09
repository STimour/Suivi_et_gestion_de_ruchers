'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService, OffreItem, ProfileType } from "@/lib/auth/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, CheckCircle2, CreditCard, Loader2, Sparkles, Users } from "lucide-react";

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState('');

  const [userData, setUserData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [entrepriseData, setEntrepriseData] = useState({
    nom: '',
    adresse: '',
  });

  const [offres, setOffres] = useState<OffreItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<OffreItem | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'paid' | 'error'>('idle');
  const storageKeys = {
    authToken: 'onboarding_auth_token',
    entrepriseId: 'onboarding_entreprise_id',
    paymentStatus: 'onboarding_payment_status',
  };

  const steps = [
    { id: 1, label: "Compte" },
    { id: 2, label: "Choix" },
    { id: 3, label: "Entreprise" },
    { id: 4, label: "Offre" },
    { id: 5, label: "Paiement" },
    { id: 6, label: "Profils" },
  ];

  const isFreemium = useMemo(() => {
    const value = (selectedOffer?.value || '').toLowerCase();
    return value === 'freemium';
  }, [selectedOffer]);

  const stripeRequired = useMemo(() => {
    return !!selectedOffer?.stripeProductId;
  }, [selectedOffer]);

  // Si l'utilisateur est déjà connecté (compte créé mais pas d'entreprise), sauter au step 2
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existingToken = authService.getToken();
    if (existingToken && step === 1) {
      setAuthToken(existingToken);
      setStep(2);
    }
  }, []);

  useEffect(() => {
    if (isFreemium && selectedProfiles.length > 1) {
      setSelectedProfiles(selectedProfiles.slice(0, 1));
    }
  }, [isFreemium, selectedProfiles]);

  useEffect(() => {
    const loadOffres = async () => {
      if (step !== 4) return;
      setLoading(true);
      setError('');
      try {
        const data = await authService.listOffres();
        setOffres(data);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les offres');
      } finally {
        setLoading(false);
      }
    };
    loadOffres();
  }, [step]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (step !== 6) return;
      setLoading(true);
      setError('');
      try {
        const data = await authService.listProfiles();
        setProfiles(data);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les profils');
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authToken) {
      const savedToken = localStorage.getItem(storageKeys.authToken);
      if (savedToken) {
        setAuthToken(savedToken);
      }
    }
    if (!entrepriseId) {
      const savedEntrepriseId = localStorage.getItem(storageKeys.entrepriseId);
      if (savedEntrepriseId) {
        setEntrepriseId(savedEntrepriseId);
      }
    }

    const paymentParam = searchParams?.get('payment');
    if (paymentParam === 'success') {
      setPaymentStatus('paid');
      setStep(6);
      localStorage.setItem(storageKeys.paymentStatus, 'paid');
    } else if (paymentStatus === 'idle') {
      const savedStatus = localStorage.getItem(storageKeys.paymentStatus);
      if (savedStatus === 'pending') {
        setPaymentStatus('pending');
        setStep(5);
      }
    }

    // Load pending invitation token
    const pendingToken = localStorage.getItem('pending_invitation_token');
    if (pendingToken) {
      setInvitationToken(pendingToken);
    }
  }, [authToken, entrepriseId, paymentStatus, searchParams]);

  useEffect(() => {
    if (step !== 5 || paymentStatus !== 'pending') return;
    if (!entrepriseId || !authToken) return;

    const interval = setInterval(async () => {
      try {
        const status = await authService.getEntrepriseOffreStatus(entrepriseId, authToken);
        if (status?.paid || (status?.type?.toLowerCase() === 'premium' && status?.stripeCustomerId)) {
          setPaymentStatus('paid');
          setStep(6);
        }
      } catch (err) {
        setPaymentStatus('error');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, paymentStatus, entrepriseId, authToken]);

  useEffect(() => {
    if (step !== 5 || paymentStatus !== 'pending') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'stripe_checkout_success') {
        setPaymentStatus('paid');
        setStep(6);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [step, paymentStatus]);

  const handleRegisterUser = async () => {
    setError('');
    setLoading(true);

    if (userData.password !== userData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const authData = await authService.registerUser({
        email: userData.email,
        password: userData.password,
        nom: userData.nom,
        prenom: userData.prenom,
      });
      authService.setToken(authData.access_token);
      setAuthToken(authData.access_token);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntreprise = async () => {
    if (!authToken) {
      setError('Session invalide, veuillez recommencer');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const entreprise = await authService.createEntrepriseForOnboarding(
        {
          nom: entrepriseData.nom,
          adresse: entrepriseData.adresse,
        },
        authToken
      );
      if (entreprise.access_token) {
        authService.setToken(entreprise.access_token);
        setAuthToken(entreprise.access_token);
      }
      setEntrepriseId(entreprise.id);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'entreprise');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOffer = async () => {
    if (!selectedOffer) {
      setError('Veuillez sélectionner une offre');
      return;
    }
    if (!entrepriseId) {
      setError('Entreprise manquante');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (selectedOffer.stripeProductId) {
        const checkout = await authService.createPremiumCheckout(entrepriseId);
        setCheckoutUrl(checkout.url);
        setPaymentStatus('pending');
        setStep(5);
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKeys.authToken, authToken || '');
          localStorage.setItem(storageKeys.entrepriseId, entrepriseId);
          localStorage.setItem(storageKeys.paymentStatus, 'pending');
        }
        window.location.href = checkout.url;
        return;
      }

      await authService.updateEntrepriseOffre(entrepriseId, selectedOffer.value);
      setStep(6);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sélection de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilesSubmit = async () => {
    if (!entrepriseId) {
      setError('Entreprise manquante');
      return;
    }
    if (!selectedProfiles.length) {
      setError('Sélectionnez au moins un profil');
      return;
    }
    if (isFreemium && selectedProfiles.length > 1) {
      setError('L\'offre Freemium est limitée à un seul profil');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.updateEntrepriseProfiles(entrepriseId, selectedProfiles);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour des profils');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileToggle = (value: string) => {
    if (isFreemium) {
      setSelectedProfiles([value]);
      return;
    }
    setSelectedProfiles((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  };

  const handleAcceptInvitation = async () => {
    if (!invitationToken.trim()) {
      setError('Veuillez saisir un token d\'invitation');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.acceptInvitation(invitationToken.trim());
      localStorage.removeItem('pending_invitation_token');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#ecfccb,_#dcfce7)] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border border-amber-100/60 bg-white/90 backdrop-blur">
        <CardHeader className="space-y-6 text-center">
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
            <CardTitle className="text-3xl font-bold text-amber-900">
              Inscription guidée
            </CardTitle>
            <CardDescription className="text-amber-800/70">
              Avancez étape par étape pour un démarrage fluide
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {steps.map((s) => {
              const displayStep = step === 7 ? 2 : step;
              const isActive = displayStep === s.id;
              const isDone = displayStep > s.id;
              return (
              <div
                key={s.id}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-green-600 text-white"
                    : isDone
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white/80 text-center text-[11px] leading-5 text-amber-900">
                  {s.id}
                </span>
                {s.label}
              </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                Vos informations personnelles
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-amber-900">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={userData.prenom}
                    onChange={(e) => setUserData((prev) => ({ ...prev, prenom: e.target.value }))}
                    type="text"
                    placeholder="Jean"
                    required
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-amber-900">Nom *</Label>
                  <Input
                    id="nom"
                    value={userData.nom}
                    onChange={(e) => setUserData((prev) => ({ ...prev, nom: e.target.value }))}
                    type="text"
                    placeholder="Dupont"
                    required
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900">Email *</Label>
                <Input
                  id="email"
                  value={userData.email}
                  onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                  type="email"
                  placeholder="vous@exemple.com"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-900">Mot de passe *</Label>
                  <Input
                    id="password"
                    value={userData.password}
                    onChange={(e) => setUserData((prev) => ({ ...prev, password: e.target.value }))}
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-confirm" className="text-amber-900">Confirmer *</Label>
                  <Input
                    id="password-confirm"
                    value={userData.passwordConfirm}
                    onChange={(e) => setUserData((prev) => ({ ...prev, passwordConfirm: e.target.value }))}
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleRegisterUser}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <CheckCircle2 className="h-4 w-4" />
                Comment souhaitez-vous continuer ?
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-2xl border border-amber-100 bg-white p-6 text-left transition hover:border-amber-300 hover:shadow-lg"
                >
                  <Building2 className="mb-3 h-8 w-8 text-amber-600" />
                  <h4 className="text-lg font-semibold text-amber-900">Créer une entreprise</h4>
                  <p className="mt-1 text-sm text-amber-800/70">
                    Créez votre propre entreprise et configurez vos ruchers.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => invitationToken ? handleAcceptInvitation() : setStep(7)}
                  className="rounded-2xl border border-amber-100 bg-white p-6 text-left transition hover:border-green-300 hover:shadow-lg"
                >
                  <Users className="mb-3 h-8 w-8 text-green-600" />
                  <h4 className="text-lg font-semibold text-amber-900">Rejoindre une entreprise</h4>
                  <p className="mt-1 text-sm text-amber-800/70">
                    J&apos;ai reçu une invitation pour rejoindre une entreprise existante.
                  </p>
                </button>
              </div>
              <div className="flex items-center justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Users className="h-4 w-4" />
                Rejoindre une entreprise
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation_token" className="text-amber-900">Token d&apos;invitation *</Label>
                <Input
                  id="invitation_token"
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value)}
                  type="text"
                  placeholder="Collez votre token d'invitation ici"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
                <p className="text-xs text-amber-700/70">
                  Vous trouverez ce token dans l&apos;email d&apos;invitation que vous avez reçu.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleAcceptInvitation}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    'Rejoindre l\'entreprise'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <CheckCircle2 className="h-4 w-4" />
                Création de l'entreprise
              </div>
              <div className="space-y-2">
                <Label htmlFor="entreprise_nom" className="text-amber-900">Nom de l'entreprise *</Label>
                <Input
                  id="entreprise_nom"
                  value={entrepriseData.nom}
                  onChange={(e) => setEntrepriseData((prev) => ({ ...prev, nom: e.target.value }))}
                  type="text"
                  placeholder="Mon Rucher SARL"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entreprise_adresse" className="text-amber-900">Adresse de l'entreprise *</Label>
                <Input
                  id="entreprise_adresse"
                  value={entrepriseData.adresse}
                  onChange={(e) => setEntrepriseData((prev) => ({ ...prev, adresse: e.target.value }))}
                  type="text"
                  placeholder="123 rue des Abeilles, 75001 Paris"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleCreateEntreprise}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création de l'entreprise...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                Choisissez une offre
              </div>
              {loading && offres.length === 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800/80">
                  Chargement des offres...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {offres.map((offre) => {
                  const selected = selectedOffer?.value === offre.value;
                  const limitation = offre.limitations_offres?.[0];
                  return (
                    <button
                      type="button"
                      key={offre.value}
                      onClick={() => setSelectedOffer(offre)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        selected
                          ? "border-green-500 bg-green-50 shadow-lg"
                          : "border-amber-100 bg-white hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-amber-900">{offre.titre}</h4>
                          <p className="text-sm text-amber-800/70">{offre.description}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200">
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="h-3 w-3 rounded-full bg-amber-200" />
                          )}
                        </div>
                      </div>
                      {limitation && (
                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-amber-800/70">
                          <div className="rounded-lg bg-amber-50 px-2 py-2 text-center">
                            Ruchers {limitation.nbRuchersMax}
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2 py-2 text-center">
                            Capteurs {limitation.nbCapteursMax}
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2 py-2 text-center">
                            Reines {limitation.nbReinesMax}
                          </div>
                        </div>
                      )}
                      {offre.prixTTC != null && (
                        <div className="mt-3 text-sm font-semibold text-green-700">
                          {offre.prixTTC} € TTC / mois
                        </div>
                      )}
                    </button>
                  );
                  })}
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => setStep(3)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleSelectOffer}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-900">
                <CreditCard className="h-4 w-4" />
                Paiement sécurisé
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-green-600" />
                <p className="text-sm text-amber-800/80">
                  Nous attendons la confirmation de votre paiement.
                </p>
                <p className="text-xs text-amber-700/70">
                  Tant que le paiement n'est pas validé, cette étape reste en attente.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                {checkoutUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-200 text-amber-800"
                    onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Ouvrir la page de paiement
                  </Button>
                )}
                {paymentStatus === 'error' && (
                  <p className="text-xs text-red-600">
                    Nous n'arrivons pas à vérifier le paiement. Veuillez réessayer.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => {
                    setPaymentStatus('idle');
                    setStep(4);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Revenir aux offres
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={() => setPaymentStatus('pending')}
                  disabled={paymentStatus === 'pending'}
                >
                  {paymentStatus === 'pending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification en cours...
                    </>
                  ) : (
                    'J\'ai payé'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <CheckCircle2 className="h-4 w-4" />
                Choisissez vos profils
              </div>
              {isFreemium && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800/80">
                  Offre Freemium: un seul profil est autorisé.
                </div>
              )}
              {loading && profiles.length === 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800/80">
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
                      onClick={() => handleProfileToggle(profile.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-green-500 bg-green-50 shadow-lg"
                          : "border-amber-100 bg-white hover:border-amber-300"
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
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-amber-700"
                  onClick={() => setStep(stripeRequired ? 5 : 4)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleProfilesSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalisation...
                    </>
                  ) : (
                    'Terminer'
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700/70">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
