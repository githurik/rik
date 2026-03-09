import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSession, logout as authLogout, login as authLogin, AuthSession } from '../lib/auth';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getSession();
    setSession(existing);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const result = authLogin(username, password);

    if (result) {
      setSession(result);
      return true;
    }
    return false;
  };

  const logout = () => {
    authLogout();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
