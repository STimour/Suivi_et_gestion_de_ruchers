"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "stripe_checkout_success" }, window.location.origin);
    }
    const timeout = setTimeout(() => {
      window.location.href = "/register?payment=success";
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#ecfccb,_#dcfce7)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border border-amber-100/60 bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold text-emerald-700">
            Paiement confirme
          </CardTitle>
          <CardDescription>
            Votre paiement a bien ete traite. Vous pouvez fermer cet onglet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/register">Retour a l'inscription</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Aller au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
