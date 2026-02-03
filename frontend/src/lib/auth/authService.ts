const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8081/v1/graphql';

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
}

class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

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
      await this.createEntreprise({
        nom: data.entreprise_nom,
        adresse: data.entreprise_adresse,
      }, authData.access_token);
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

  async getMe(token?: string): Promise<any> {
    const authToken = token || this.getToken();

    if (!authToken) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${DJANGO_API_URL}/api/auth/me`, {
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

    // Extraire l'entreprise_id depuis le tableau entreprises
    if (userData.entreprises && userData.entreprises.length > 0) {
      userData.entreprise_id = userData.entreprises[0].id;
      userData.entreprise_nom = userData.entreprises[0].nom;
      userData.entreprise_role = userData.entreprises[0].role;
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
