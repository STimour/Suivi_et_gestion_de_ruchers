import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fee2e2,_#fff7ed,_#fef9c3)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border border-amber-100/60 bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold text-amber-700">
            Paiement annule
          </CardTitle>
          <CardDescription>
            Le paiement a ete annule. Vous pouvez reessayer quand vous voulez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/register">Retour a l'inscription</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
