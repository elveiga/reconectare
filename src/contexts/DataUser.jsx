import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  changePasswordRequest,
  createUserRequest,
  deleteUserRequest,
  getUsersRequest,
  loginRequest,
  meRequest,
  updateUserRequest
} from '@/services/authApi';
import { clearRuntimeAuth, getRuntimeToken, getRuntimeUser, setRuntimeAuth } from '@/lib/authSession';

const DataUserContext = createContext();

export const useUsers = () => {
  const ctx = useContext(DataUserContext);
  if (!ctx) throw new Error('useUsers must be used within DataUserProvider');
  return ctx;
};

export const DataUserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getRuntimeUser());
  const [token, setToken] = useState(() => getRuntimeToken());
  const [authLoading, setAuthLoading] = useState(true);

  const persistAuth = (nextToken, user) => {
    setToken(nextToken || '');
    setCurrentUser(user || null);

    if (nextToken || user) {
      setRuntimeAuth(nextToken || '', user || null);
    } else {
      clearRuntimeAuth();
    }
  };

  const loadUsers = async (authToken = token, authUser = currentUser) => {
    if (!authToken || authUser?.role !== 'Admin') {
      setUsers([]);
      return [];
    }

    try {
      const response = await getUsersRequest(authToken);
      const nextUsers = response.users || [];
      setUsers(nextUsers);
      return nextUsers;
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      return [];
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await meRequest(token);
        persistAuth(token, response.user || null);
        await loadUsers(token, response.user || null);
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        persistAuth('', null);
        setUsers([]);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async ({ email, senha }) => {
    try {
      const response = await loginRequest({ email, senha });
      persistAuth(response.token, response.user);
      await loadUsers(response.token, response.user);
      return {
        success: true,
        user: response.user,
        requiresPasswordChange: Boolean(response.requiresPasswordChange || response.user?.mustChangePassword)
      };
    } catch (error) {
      return { success: false, message: error.message || 'Credenciais inválidas' };
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!token) {
      return { success: false, message: 'Sessão inválida. Faça login novamente.' };
    }

    try {
      const response = await changePasswordRequest(token, { currentPassword, newPassword });
      if (response?.user) {
        persistAuth(token, response.user);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao alterar senha' };
    }
  };

  // Logout
  const logout = () => {
    persistAuth('', null);
    setUsers([]);
  };

  // Criar usuário
  const createUser = async (userData) => {
    try {
      const response = await createUserRequest(token, userData);
      setUsers((prev) => [...prev, response.user]);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao criar usuário' };
    }
  };

  // Atualizar usuário
  const updateUser = async (id, updates) => {
    try {
      const response = await updateUserRequest(token, id, updates);
      const updatedUser = response.user;

      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));

      if (currentUser && currentUser.id === Number(id)) {
        if (updatedUser.blocked) {
          logout();
        } else {
          persistAuth(token, updatedUser);
        }
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao atualizar usuário' };
    }
  };

  // Deletar usuário
  const deleteUser = async (id) => {
    try {
      await deleteUserRequest(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));

      if (currentUser && currentUser.id === Number(id)) {
        logout();
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Erro ao deletar usuário' };
    }
  };

  const value = {
    users,
    currentUser,
    token,
    authLoading,
    login,
    changePassword,
    logout,
    createUser,
    updateUser,
    deleteUser,
    loadUsers
  };

  return <DataUserContext.Provider value={value}>{children}</DataUserContext.Provider>;
};

export default DataUserContext;
