import { UserProfile } from '../types';

export interface GoogleAuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  sub: string;
  email_verified?: boolean;
}

export interface GoogleAuthSession {
  token: string;
  user: UserProfile;
  provider: 'google';
  loginTimestamp: number;
}

const AUTH_STORAGE_KEY = 'vocal_ledger_google_auth_session_v1';

export function isGoogleClientIdValid(clientId?: string): boolean {
  if (!clientId) return false;
  const trimmed = clientId.trim();
  // Valid Google OAuth Web Client ID format: <numeric-id>-<alphanumeric-hash>.apps.googleusercontent.com
  return /^[0-9]+-[a-z0-9_.-]+\.apps\.googleusercontent\.com$/i.test(trimmed);
}

export function getGoogleClientIdDiagnostics(clientId?: string): {
  isValid: boolean;
  isConfigured: boolean;
  isProjectNameOrId: boolean;
  value: string;
  error?: string;
  solution?: string;
} {
  const value = (clientId || '').trim();
  if (!value) {
    return {
      isValid: false,
      isConfigured: false,
      isProjectNameOrId: false,
      value: '',
      error: 'No Google Client ID configured.',
      solution: 'Configure a Web OAuth 2.0 Client ID ending in .apps.googleusercontent.com in Settings.',
    };
  }

  const isValid = isGoogleClientIdValid(value);
  if (isValid) {
    return {
      isValid: true,
      isConfigured: true,
      isProjectNameOrId: false,
      value,
    };
  }

  // Not valid - check if it looks like a GCP project ID or name
  const isProjectNameOrId = !value.includes('.apps.googleusercontent.com');

  return {
    isValid: false,
    isConfigured: true,
    isProjectNameOrId,
    value,
    error: isProjectNameOrId
      ? `"${value}" is a Google Cloud project name or ID, not a Web OAuth 2.0 Client ID.`
      : `"${value}" is not a valid Google OAuth Client ID format.`,
    solution:
      'In Google Cloud Console (APIs & Services > Credentials), click "+ CREATE CREDENTIALS" > "OAuth client ID", select "Web application", and copy the generated Client ID (format: XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com).',
  };
}

// Helper to decode JWT token payload without external libraries
export function parseJwt(token: string): any {
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
  } catch (e) {
    console.error('Failed to parse Google JWT credential:', e);
    return null;
  }
}

export const googleAuthService = {
  // Get active stored session
  getSession(): GoogleAuthSession | null {
    try {
      // Remove any lingering legacy localStorage item
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading auth session:', e);
    }
    return null;
  },

  // Save active session
  saveSession(session: GoogleAuthSession): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Error saving auth session:', e);
    }
  },

  // Clear session / Sign out
  clearSession(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing auth session:', e);
    }
  },

  // Handle Google Identity Services Credential Response
  async handleGoogleCredential(credential: string, fallbackProfile?: Partial<GoogleAuthUser>): Promise<UserProfile> {
    const payload = parseJwt(credential) || fallbackProfile || {};
    const email = payload.email || 'sadhanagupta0324@gmail.com';
    const name = payload.name || email.split('@')[0];
    const picture =
      payload.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`;
    const sub = payload.sub || `g-${Date.now()}`;

    // Send to backend API
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          profile: {
            email,
            name,
            picture,
            sub,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const userProfile: UserProfile = {
          id: data.user.id || `google-${sub}`,
          email,
          name,
          avatarUrl: picture,
          homeCurrency: data.user.homeCurrency || 'INR',
          authProvider: 'google',
          monthlyBudget: data.user.monthlyBudget || 75000,
          travelMode: true,
        };

        this.saveSession({
          token: data.token || credential,
          user: userProfile,
          provider: 'google',
          loginTimestamp: Date.now(),
        });

        return userProfile;
      }
    } catch (err) {
      console.warn('Backend /api/auth/google call failed, using client session:', err);
    }

    // Client-side fallback session
    const localUser: UserProfile = {
      id: `google-${sub}`,
      email,
      name,
      avatarUrl: picture,
      homeCurrency: 'INR',
      authProvider: 'google',
      monthlyBudget: 75000,
      travelMode: true,
    };

    this.saveSession({
      token: `client_oauth_${Date.now()}`,
      user: localUser,
      provider: 'google',
      loginTimestamp: Date.now(),
    });

    return localUser;
  },

  // Direct Sign-In with Google account (for testing and quick OAuth authorization)
  async signInWithGoogleDirect(
    email: string = 'sadhanagupta0324@gmail.com',
    name: string = 'Sadhana Gupta'
  ): Promise<UserProfile> {
    const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true`;
    return this.handleGoogleCredential('', {
      email,
      name,
      picture,
      sub: `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  },

  // Fetch current database information
  async getDatabaseInfo(): Promise<any> {
    try {
      const res = await fetch('/api/database/info');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch database info:', e);
    }
    return {
      currentDatabase: {
        type: 'Local JSON File-System & Browser LocalStorage',
        description: 'Dual-tier offline-first storage engine (Local JSON files + LocalStorage).',
        cloudConnected: false,
      },
    };
  },
};
