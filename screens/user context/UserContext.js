import React, { createContext, useState, useContext } from 'react';

// Create the context
const UserContext = createContext();

// Create a provider component
export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);

  const login = (user) => {
    console.log('[USER_CONTEXT] User logged in:', user);
    setUserData(user);
  };

  const logout = () => {
    console.log('[USER_CONTEXT] User logged out');
    setUserData(null);
  };

  const updateUser = (updates) => {
    console.log('[USER_CONTEXT] Updating user data:', updates);
    setUserData(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ userData, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}