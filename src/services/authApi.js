const API_BASE = '/api';

const buildHeaders = (token, extra = {}) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extra
});

const parseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro na requisição');
  }
  return data;
};

export const loginRequest = async ({ email, senha }) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ email, senha })
  });

  return parseJson(response);
};

export const meRequest = async (token) => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: buildHeaders(token)
  });

  return parseJson(response);
};

export const getUsersRequest = async (token) => {
  const response = await fetch(`${API_BASE}/users`, {
    headers: buildHeaders(token)
  });

  return parseJson(response);
};

export const changePasswordRequest = async (token, payload) => {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload)
  });

  return parseJson(response);
};

export const createUserRequest = async (token, payload) => {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload)
  });

  return parseJson(response);
};

export const updateUserRequest = async (token, id, payload) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(payload)
  });

  return parseJson(response);
};

export const deleteUserRequest = async (token, id) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token)
  });

  return parseJson(response);
};
