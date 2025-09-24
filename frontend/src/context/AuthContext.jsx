
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [admin, setAdmin] = useState(() => {
    const a = localStorage.getItem('admin_user');
    return a ? JSON.parse(a) : null;
  });

  // Fetch user data from backend on mount if user exists
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          let host = import.meta.env.VITE_HOST;
          if (!host) host = window.location.origin.replace(/:\d+$/, ':3001');
          const response = await fetch(`${host}/api/customers/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          if (response.ok) {
            const updatedUser = await response.json();
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            // ถ้า token ไม่ถูกต้อง ให้ล้างข้อมูล
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // ถ้าเกิด error ให้ล้างข้อมูล
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // sync user/admin เมื่อมีการเปลี่ยนแปลง localStorage (เช่น login/logout)
    const handleUserChanged = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
      const a = localStorage.getItem('admin_user');
      setAdmin(a ? JSON.parse(a) : null);
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
