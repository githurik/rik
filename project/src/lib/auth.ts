export interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'operator';
}

const HARDCODED_ADMINS: AdminUser[] = [
  {
    id: '222911',
    username: 'admin',
    password: '222911',
    role: 'admin',
  },
  {
    id: '001',
    username: 'operator',
    password: 'operator123',
    role: 'operator',
  },
];

const SESSION_KEY = 'rc_admin_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

export interface AuthSession {
  userId: string;
  username: string;
  role: 'admin' | 'operator';
  loginTime: number;
}

export function login(username: string, password: string): AuthSession | null {
  const user = HARDCODED_ADMINS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return null;
  }

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    loginTime: Date.now(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session: AuthSession = JSON.parse(stored);
    const age = Date.now() - session.loginTime;

    if (age > SESSION_EXPIRY) {
      logout();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
