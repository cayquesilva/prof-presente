import { useState, useEffect, createContext, useContext } from "react";
import { authAPI } from "../lib/api";
import {
  saveAuthData,
  getUserData,
  isAuthenticated,
  clearAuthData,
} from "../lib/auth";
import api from '../lib/api';


// Contexto de autenticação
const AuthContext = createContext();

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Tenta carregar o usuário do localStorage ao iniciar
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const userData = getUserData();
        if (userData) {
          setUser(userData);
        } else {
          // Tentar obter dados do perfil do servidor
          try {
            const response = await authAPI.getProfile();
            setUser(response.data);
          } catch (error) {
            console.error("Erro ao obter perfil:", error);
            clearAuthData();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Função de login
  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user: loggedInUser, token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro de login",
      };
    }
  };

  // Função de registro
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error("Erro no registro:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao registrar usuário",
      };
    }
  };

  // Função de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login'; // Força o redirecionamento
  };

  // Atualizar dados do usuário
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    saveAuthData(getUserData()?.token, updatedUser);
  };

  const updateAuthUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    updateAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
