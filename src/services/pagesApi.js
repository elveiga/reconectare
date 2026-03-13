const API_BASE = '/api/pages';

const parse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Erro na API');
  }
  return data;
};

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const getAllPageConfigsRequest = async () => {
  const response = await fetch(`${API_BASE}/configs`);
  return parse(response);
};

export const savePageConfigRequest = async (token, key, value) => {
  const response = await fetch(`${API_BASE}/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ value })
  });
  return parse(response);
};
