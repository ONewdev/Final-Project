import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try { const a = localStorage.getItem('admin_user'); return a ? JSON.parse(a) : null; } catch { return null; }
  });

  // Validate auth on mount: prefer JWT, fallback to session; clear stale local user
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      let host = import.meta.env.VITE_HOST;
      if (!host && typeof window !== 'undefined') host = window.location.origin.replace(/:\\d+$/, ':3001');
      const stored = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

      try {
        if (token && stored) {
          const res = await fetch(`${host}/api/customers/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          });
          if (res.ok) {
            const updated = await res.json();
            setUser(updated);
            try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
            return;
          }
        }

        if (stored) {
          const resMe = await fetch(`${host}/api/customers/me`, { credentials: 'include' });
          if (resMe.ok) {
            setUser(stored);
            return;
          }
        }

        // Clear stale
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleUserChanged = () => {
      try { const u = localStorage.getItem('user'); setUser(u ? JSON.parse(u) : null); } catch { setUser(null); }
      try { const a = localStorage.getItem('admin_user'); setAdmin(a ? JSON.parse(a) : null); } catch { setAdmin(null); }
    };
    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, admin, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

