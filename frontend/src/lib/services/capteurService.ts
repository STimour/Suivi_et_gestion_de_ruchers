const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://api.localhost:8088';

function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface AssociateCapteurData {
    ruche_id: string;
    type: string;
    identifiant: string;
    name?: string;
}

export interface RucherGpsAlertStatus {
    rucherId: string;
    hasGpsCapteur: boolean;
    hasActiveAlert: boolean;
    activeAlertsCount: number;
    capteurs: Array<{
        id: string;
        rucheId: string;
        rucheImmatriculation: string;
        identifiant: string;
        gpsAlertActive: boolean;
        thresholdMeters: number;
        lastCheckedAt: string | null;
        lastAlertAt: string | null;
    }>;
}

export interface CapteurGpsAlertStatus {
    capteurId: string;
    gpsAlertActive: boolean;
    thresholdMeters?: number;
    lastCheckedAt?: string | null;
    lastAlertAt?: string | null;
    hasAlert: boolean;
    alertesCount: number;
    latestAlerte: {
        id: string;
        type: string;
        message: string;
        date: string | null;
    } | null;
}

export interface CapteurGpsPosition {
    capteurId: string;
    identifiant: string;
    latitude: number;
    longitude: number;
    fixTime: string | null;
    positionId: number | null;
}

class CapteurService {
    async associateCapteur(data: AssociateCapteurData): Promise<any> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/associate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 409 || error?.error === 'capteur_already_exists') {
                throw new Error('Ce capteur est déjà associé à une ruche.');
            }
            throw new Error(error.message || error.error || "Erreur lors de l'association du capteur");
        }

        return response.json();
    }

    async deleteCapteur(capteurId: string): Promise<void> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/delete`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || 'Erreur lors de la suppression du capteur');
        }
    }

    async activateGpsAlert(capteurId: string, thresholdMeters: number = 100): Promise<any> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/gps-alert/activate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ thresholdMeters }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            const code = error.error;
            if (code === 'gps_position_unavailable') {
                throw new Error('Position GPS indisponible. Le capteur n\'a pas encore envoyé de position à Traccar.');
            }
            throw new Error(error.message || code || "Erreur lors de l'activation de l'alerte GPS");
        }

        return response.json();
    }

    async deactivateGpsAlert(capteurId: string): Promise<any> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/gps-alert/deactivate`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || "Erreur lors de la désactivation de l'alerte GPS");
        }

        return response.json();
    }

    async getRucherGpsAlertStatus(rucherId: string): Promise<RucherGpsAlertStatus> {
        const response = await fetch(`${DJANGO_API_URL}/api/ruchers/${rucherId}/gps-alert/status`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || "Erreur lors de la récupération du statut d'alerte GPS");
        }

        return response.json();
    }

    async getCapteurGpsAlertStatus(capteurId: string): Promise<CapteurGpsAlertStatus> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/gps-alert/status`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || "Erreur lors de la récupération des alertes GPS");
        }

        return response.json();
    }

    async getCapteurGpsPosition(capteurId: string): Promise<CapteurGpsPosition> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/gps-position`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || 'Erreur lors de la récupération de la position GPS');
        }

        return response.json();
    }

    async clearCapteurGpsAlert(capteurId: string): Promise<{ status: string; deleted: number }> {
        const response = await fetch(`${DJANGO_API_URL}/api/capteurs/${capteurId}/gps-alert/clear`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || "Erreur lors de la suppression de l'alerte GPS");
        }

        return response.json();
    }
}

export const capteurService = new CapteurService();
