import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiUrl } from '../config';

interface User {
  ID: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Try to get token from localStorage
        const storedToken = localStorage.getItem('jwt_token');
        
        if (storedToken) {
          // Validate token by fetching user data
          const response = await fetch(apiUrl('/api/auth/me'), {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('jwt_token');
            setUser(null);
            setToken(null);
          }
        } else {
          // No token, try cookie-based session for backwards compatibility
          const response = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('jwt_token', jwtToken);
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/logout'), { method: 'POST', credentials: 'include' });
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwt_token');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout }}>
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
