const API_BASE = '/api';

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

export const getListingsRequest = async (queryString = '') => {
  const response = await fetch(`${API_BASE}/listings${queryString ? `?${queryString}` : ''}`);
  return parse(response);
};

export const createListingRequest = async (token, payload) => {
  const response = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return parse(response);
};

export const updateListingRequest = async (token, id, payload) => {
  const response = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return parse(response);
};

export const updateListingStatusRequest = async (token, id, status) => {
  const response = await fetch(`${API_BASE}/listings/${id}/status`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ status })
  });
  return parse(response);
};

export const deleteListingRequest = async (token, id) => {
  const response = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: headers(token)
  });
  return parse(response);
};

export const getCatalogRequest = async () => {
  const response = await fetch(`${API_BASE}/catalog`);
  return parse(response);
};

export const addBrandRequest = async (token, name) => {
  const response = await fetch(`${API_BASE}/catalog/brands`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name })
  });
  return parse(response);
};

export const addEquipmentTypeRequest = async (token, name) => {
  const response = await fetch(`${API_BASE}/catalog/equipment-types`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name })
  });
  return parse(response);
};
