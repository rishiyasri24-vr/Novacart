/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, AuthSession } from '../../shared/types.js';

interface AuthContextType {
  session: AuthSession;
  setRole: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_SESSION: AuthSession = {
  userId: 'usr_sarah_jenkins_88',
  name: 'Sarah Jenkins',
  email: 'sarah.j@example.com',
  role: 'shopper',
  storeId: 'STORE-CA-082',
  cartId: 'CART-BAY-409',
  token: 'novacart_jwt_sig_7f8a9b2c3d4e5f6a',
  expiresAt: Date.now() + 86400000,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>(() => {
    const saved = localStorage.getItem('novacart_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SESSION;
  });

  useEffect(() => {
    localStorage.setItem('novacart_session', JSON.stringify(session));
  }, [session]);

  const setRole = (role: UserRole) => {
    let name = 'Sarah Jenkins';
    let email = 'sarah.j@example.com';
    let userId = 'usr_sarah_jenkins_88';

    if (role === 'store_associate') {
      name = 'Marcus Vance (Aisle Associate)';
      email = 'm.vance@retailstore.com';
      userId = 'emp_marcus_vance_22';
    } else if (role === 'security_auditor') {
      name = 'Elena Rostova (LP & Security Officer)';
      email = 'e.rostova@loss-prevention.net';
      userId = 'sec_elena_rostova_09';
    }

    setSession(prev => ({
      ...prev,
      role,
      name,
      email,
      userId,
    }));
  };

  const logout = () => {
    setSession(DEFAULT_SESSION);
  };

  return (
    <AuthContext.Provider value={{ session, setRole, logout, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
