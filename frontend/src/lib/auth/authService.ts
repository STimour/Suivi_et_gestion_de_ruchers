import { toast } from 'sonner';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://api.localhost:8088';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://hasura.localhost:8088/v1/graphql';

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  entreprise_nom: string;
  entreprise_adresse: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    entreprises?: Array<{
      id: string;
      nom: string;
      role: string;
    }>;
    entreprise_id?: string;
    entreprise_nom?: string;
    entreprise_role?: string;
  };
}

export interface EntrepriseResponse {
  id: string;
  nom: string;
  adresse: string;
  access_token?: string;
}

class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

  // Wrapper fetch avec gestion des erreurs 401/403
  private async fetchWithErrorHandling(url: string, options: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      toast.error('Session expirée', {
        description: 'Veuillez vous reconnecter'
      });
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      toast.error('Accès refusé', {
        description: 'Permissions insuffisantes'
      });
      throw new Error('Vous n\'avez pas les permissions nécessaires.');
    }

    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // 1. Register user
    const registerResponse = await fetch(`${DJANGO_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        nom: data.nom,
        prenom: data.prenom,
      }),
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.json();
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }

    const authData: AuthResponse = await registerResponse.json();

    // Stocker le token
    this.setToken(authData.access_token);
    if (authData.refresh_token) {
      this.setRefreshToken(authData.refresh_token);
    }

    // 2. Create entreprise
    try {
      const entrepriseData = await this.createEntreprise({
        nom: data.entreprise_nom,
        adresse: data.entreprise_adresse,
      }, authData.access_token);

      // Mettre à jour le token avec celui qui contient l'entreprise_id
      if (entrepriseData.access_token) {
        this.setToken(entrepriseData.access_token);
        authData.access_token = entrepriseData.access_token;

        // Ajouter les infos d'entreprise à l'objet user
        authData.user.entreprises = [{
          id: entrepriseData.id,
          nom: entrepriseData.nom,
          role: 'AdminEntreprise',
        }];
        authData.user.entreprise_id = entrepriseData.id;
        authData.user.entreprise_nom = entrepriseData.nom;
        authData.user.entreprise_role = 'AdminEntreprise';
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error);
      // On ne bloque pas l'inscription si la création d'entreprise échoue
    }

    return authData;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${DJANGO_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email ou mot de passe incorrect');
    }

    const authData: AuthResponse = await response.json();

    this.setToken(authData.access_token);
    if (authData.refresh_token) {
      this.setRefreshToken(authData.refresh_token);
    }

    // Extract entreprise_id from entreprises array
    if (authData.user.entreprises && authData.user.entreprises.length > 0) {
      authData.user.entreprise_id = authData.user.entreprises[0].id;
      authData.user.entreprise_nom = authData.user.entreprises[0].nom;
      authData.user.entreprise_role = authData.user.entreprises[0].role;
    }

    return authData;
  }

  async switchEntreprise(entrepriseId: string): Promise<{ access_token: string; entreprise: any }> {
    const token = this.getToken();

    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await this.fetchWithErrorHandling(`${DJANGO_API_URL}/api/auth/switch-entreprise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ entreprise_id: entrepriseId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du changement d\'entreprise');
    }

    const data = await response.json();

    // Update token
    this.setToken(data.access_token);

    return data;
  }

  async logout(): Promise<void> {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${DJANGO_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }

    this.clearTokens();
  }

  // Décoder le JWT pour extraire l'entreprise_id active
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du JWT:', error);
      return null;
    }
  }

  async getMe(token?: string): Promise<any> {
    const authToken = token || this.getToken();

    if (!authToken) {
      throw new Error('Non authentifié');
    }

    const response = await this.fetchWithErrorHandling(`${DJANGO_API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil');
    }

    const data = await response.json();

    // L'API retourne { user: { ... } }
    const userData = data.user || data;

    // Décoder le JWT pour trouver l'entreprise active
    const jwtPayload = this.decodeJWT(authToken);
    const activeEntrepriseId = jwtPayload?.['https://hasura.io/jwt/claims']?.['x-hasura-entreprise-id'];

    // Trouver l'entreprise active dans le tableau entreprises
    if (userData.entreprises && userData.entreprises.length > 0) {
      const activeEntreprise = userData.entreprises.find(
        (e: any) => e.id === activeEntrepriseId
      ) || userData.entreprises[0];

      userData.entreprise_id = activeEntreprise.id;
      userData.entreprise_nom = activeEntreprise.nom;
      userData.entreprise_role = activeEntreprise.role;
    }

    return userData;
  }

  // Récupérer l'entreprise_id de l'utilisateur via GraphQL
  private async getUserEntrepriseId(token: string, userId: string): Promise<string | null> {
    const query = `
      query GetUserEntreprise($userId: uuid!) {
        utilisateurs_entreprises(where: { utilisateur_id: { _eq: $userId } }, limit: 1) {
          entreprise_id
        }
      }
    `;

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { userId },
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur GraphQL');
    }

    const result = await response.json();
    const userEntreprise = result.data?.utilisateurs_entreprises?.[0];

    return userEntreprise?.entreprise_id || null;
  }

  private async createEntreprise(data: { nom: string; adresse: string }, token: string): Promise<EntrepriseResponse> {
    const response = await fetch(`${DJANGO_API_URL}/api/entreprise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de l\'entreprise');
    }

    return response.json();
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.refreshTokenKey, token);
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.refreshTokenKey);
    }
    return null;
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
