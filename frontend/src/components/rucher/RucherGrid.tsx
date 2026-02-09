'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Flower2, Mountain } from "lucide-react";
import Link from 'next/link';
import { RucherActions } from "./RucherActions";
import { RucherMiniMapWrapper } from "./RucherMiniMapWrapper";

interface RucherGridProps {
    ruchers: any[];
}

export function RucherGrid({ ruchers }: RucherGridProps) {
    if (ruchers.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ruchers.map((rucher) => (
                <Card key={rucher.id} className="group hover:shadow-lg transition-all duration-300 border-amber-200 hover:border-amber-400 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-amber-900 line-clamp-1" title={rucher.nom}>
                                    {rucher.nom}
                                </CardTitle>
                                <div className="flex items-center gap-1 text-xs text-amber-700/70">
                                    <MapPin className="h-3 w-3" />
                                    {rucher.latitude.toFixed(4)}, {rucher.longitude.toFixed(4)}
                                </div>
                            </div>
                            <RucherActions rucherId={rucher.id} rucherNom={rucher.nom} />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="mb-4 h-32 rounded-md overflow-hidden">
                            <RucherMiniMapWrapper
                                latitude={rucher.latitude}
                                longitude={rucher.longitude}
                                nom={rucher.nom}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Flower2 className="h-4 w-4 text-green-500" />
                                <span className="truncate" title={rucher.flore}>{rucher.flore}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mountain className="h-4 w-4 text-gray-400" />
                                <span>{rucher.altitude}m</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t border-amber-100 flex items-center justify-between">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                            {rucher.ruches?.length || 0} ruches
                        </Badge>
                        <Link href={`/dashboard/apiaries/${rucher.id}`}>
                            <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50">
                                Voir détails
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
