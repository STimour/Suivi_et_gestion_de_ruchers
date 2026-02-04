import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Hexagon, MapPin, Shield, ShieldOff, Pencil, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditRucheDialog } from './EditRucheDialog';

interface RucheListProps {
    ruches: any[];
}

const getStatutColor = (statut: string) => {
    switch (statut) {
        case 'Active':
            return 'bg-green-100 text-green-800';
        case 'Faible':
            return 'bg-yellow-100 text-yellow-800';
        case 'Malade':
            return 'bg-red-100 text-red-800';
        case 'Morte':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export function RucheList({ ruches }: RucheListProps) {
    const [editingRucheId, setEditingRucheId] = useState<string | null>(null);

    if (ruches.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed border-green-200">
                <p>Aucune ruche trouvée</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-green-50/50">
                        <TableRow>
                            <TableHead className="w-[150px]">Immatriculation</TableHead>
                            <TableHead>Rucher</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Race</TableHead>
                            <TableHead className="text-center">Statut</TableHead>
                            <TableHead className="text-center">Sécurisée</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ruches.map((ruche) => (
                            <TableRow key={ruche.id} className="hover:bg-green-50/30">
                                <TableCell className="font-mono font-medium text-green-900">
                                    <div className="flex items-center gap-2">
                                        <Hexagon className="h-4 w-4 text-green-600" />
                                        {ruche.immatriculation}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {ruche.rucher ? (
                                        <Link href={`/dashboard/apiaries/${ruche.rucher.id}`} className="flex items-center gap-1.5 hover:text-amber-600">
                                            <MapPin className="h-3 w-3 text-amber-600" />
                                            <span className="text-sm">{ruche.rucher.nom}</span>
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-gray-400">Sans rucher</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">{ruche.type}</TableCell>
                                <TableCell className="text-sm">{ruche.race}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <Badge className={getStatutColor(ruche.statut)}>
                                            {ruche.statut}
                                        </Badge>
                                        {ruche.statut === 'Malade' && ruche.maladie && (
                                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>{ruche.maladie}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {ruche.securisee ? (
                                        <Shield className="h-4 w-4 text-green-600 mx-auto" />
                                    ) : (
                                        <ShieldOff className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            onClick={() => setEditingRucheId(ruche.id)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Link href={`/dashboard/hives/${ruche.id}`}>
                                            <Button variant="ghost" size="sm">
                                                Voir
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {editingRucheId && (
                <EditRucheDialog
                    rucheId={editingRucheId}
                    open={!!editingRucheId}
                    onOpenChange={(open) => !open && setEditingRucheId(null)}
                />
            )}
        </>
    );
}
