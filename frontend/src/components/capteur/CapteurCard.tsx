'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, MapPinOff } from 'lucide-react';
import { toast } from 'sonner';
import { getCapteurTypeLabel, getCapteurTypeIcon } from '@/lib/constants/capteur.constants';
import { capteurService } from '@/lib/services/capteurService';

interface CapteurCardProps {
    capteur: {
        id: string;
        type: string;
        identifiant: string;
        actif: boolean;
        batteriePct?: number;
        derniereCommunication?: string;
        gpsAlertActive?: boolean;
    };
    canDelete?: boolean;
    onDeleted?: () => void;
}

export function CapteurCard({ capteur, canDelete, onDeleted }: CapteurCardProps) {
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsActive, setGpsActive] = useState(capteur.gpsAlertActive ?? false);

    const Icon = getCapteurTypeIcon(capteur.type);
    const typeLabel = getCapteurTypeLabel(capteur.type);
    const isGps = capteur.type === 'GPS';

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setDeleting(true);
        try {
            await capteurService.deleteCapteur(capteur.id);
            toast.success('Capteur supprimé');
            onDeleted?.();
        } catch (error: any) {
            toast.error('Erreur', { description: error.message });
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleToggleGpsAlert = async () => {
        setGpsLoading(true);
        try {
            if (gpsActive) {
                await capteurService.deactivateGpsAlert(capteur.id);
                setGpsActive(false);
                toast.success('Alerte GPS désactivée');
            } else {
                await capteurService.activateGpsAlert(capteur.id, 100);
                setGpsActive(true);
                toast.success('Alerte GPS activée', {
                    description: 'Seuil : 100m depuis la position actuelle',
                });
            }
        } catch (error: any) {
            toast.error('Erreur', { description: error.message });
        } finally {
            setGpsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="relative">
            <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">{typeLabel}</span>
                    </div>
                    <Badge className={capteur.actif
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }>
                        {capteur.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                </div>

                <div>
                    <span className="text-xs text-gray-500">Identifiant</span>
                    <p className="font-mono text-sm text-gray-900">{capteur.identifiant}</p>
                </div>

                {capteur.batteriePct != null && (
                    <div>
                        <span className="text-xs text-gray-500">Batterie</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${
                                        capteur.batteriePct > 50
                                            ? 'bg-green-500'
                                            : capteur.batteriePct > 20
                                              ? 'bg-yellow-500'
                                              : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, capteur.batteriePct)}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                                {capteur.batteriePct}%
                            </span>
                        </div>
                    </div>
                )}

                {capteur.derniereCommunication && (
                    <div>
                        <span className="text-xs text-gray-500">Dernière communication</span>
                        <p className="text-sm text-gray-700">
                            {formatDate(capteur.derniereCommunication)}
                        </p>
                    </div>
                )}

                {/* GPS Alert toggle */}
                {isGps && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {gpsActive ? (
                                    <MapPin className="h-4 w-4 text-green-600" />
                                ) : (
                                    <MapPinOff className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-xs font-medium text-gray-700">
                                    Alerte GPS
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant={gpsActive ? 'destructive' : 'default'}
                                onClick={handleToggleGpsAlert}
                                disabled={gpsLoading}
                                className={`h-7 text-xs gap-1 ${
                                    gpsActive
                                        ? ''
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {gpsLoading
                                    ? 'Chargement...'
                                    : gpsActive
                                      ? 'Désactiver'
                                      : 'Activer'
                                }
                            </Button>
                        </div>
                    </div>
                )}

                {canDelete && (
                    <div className="pt-2 border-t">
                        {confirmDelete ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-600">Confirmer ?</span>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-7 text-xs"
                                >
                                    {deleting ? 'Suppression...' : 'Oui, supprimer'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={deleting}
                                    className="h-7 text-xs"
                                >
                                    Annuler
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs gap-1"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
