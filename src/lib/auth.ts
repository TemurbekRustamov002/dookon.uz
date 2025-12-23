export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER' | 'WAREHOUSE' | 'SUPER_ADMIN' | 'PARTNER' | 'admin' | 'kassir';

export interface Session {
  role: string;
  name: string;
  storeName: string;
  plan?: string;
  userId?: string;
  email?: string;
}

export function saveSession(session: Session) {
  localStorage.setItem('session', JSON.stringify(session));
}

export function signOut() {
  localStorage.removeItem('session');
  // Token is HttpOnly cookie, must call /api/auth/logout to clear it from browser
}

export function getSession(): Session | null {
  const raw = localStorage.getItem('session');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function signIn(_email: string, _password: string): Session | null {
  // Deprecated: Login is now handled via API in Login.tsx
  return null;
}

