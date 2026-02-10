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
}

export const capteurService = new CapteurService();
