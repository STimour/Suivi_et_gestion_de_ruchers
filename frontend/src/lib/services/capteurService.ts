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
}

export const capteurService = new CapteurService();
