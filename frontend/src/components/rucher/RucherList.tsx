'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Flower2 } from "lucide-react";
import { RucherActions } from "./RucherActions";
import { LocationDisplay } from "./LocationDisplay";

interface RucherListProps {
    ruchers: any[];
}

export function RucherList({ ruchers }: RucherListProps) {
    if (ruchers.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed border-amber-200">
                <p>Aucun rucher trouvé</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-amber-50/50">
                    <TableRow>
                        <TableHead className="w-[300px]">Nom</TableHead>
                        <TableHead>Localisation</TableHead>
                        <TableHead className="text-center">Ruches</TableHead>
                        <TableHead>Flore</TableHead>
                        <TableHead className="text-center">Altitude</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ruchers.map((rucher) => (
                        <TableRow key={rucher.id} className="hover:bg-amber-50/30">
                            <TableCell className="font-medium text-amber-900">
                                {rucher.nom}
                            </TableCell>
                            <TableCell>
                                <LocationDisplay
                                    latitude={rucher.latitude}
                                    longitude={rucher.longitude}
                                />
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                    {rucher.ruches?.length || 0}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5">
                                    <Flower2 className="h-3 w-3 text-green-600" />
                                    <span className="text-sm">{rucher.flore}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                                {rucher.altitude}m
                            </TableCell>
                            <TableCell className="text-right">
                                <RucherActions rucherId={rucher.id} rucherNom={rucher.nom} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
