import React, { createContext, useContext, useState } from 'react';

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {id, email, name}
  const [token, setToken] = useState(null);

  const login = (userObj, jwt) => { 
    setUser(userObj); 
    setToken(jwt); 
  };
  
  const logout = () => { 
    setUser(null); 
    setToken(null); 
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);

