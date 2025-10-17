const fallbackHost = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/:\d+$/, ':3001');
  }
  return 'http://localhost:3001';
};

const baseUrl = '/api/cart';

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    
  }
  return headers;
};

const request = async (path = '', { method = 'GET', body } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || '??????????????????????????';
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
};

export const fetchCartItems = async () => {
  const data = await request('');
  return data.items || [];
};

export const addCartItem = async (productId, quantity = 1) => {
  const data = await request('', {
    method: 'POST',
    body: { product_id: productId, quantity },
  });
  return data.items || [];
};

export const updateCartItem = async (productId, quantity) => {
  const data = await request(`/${productId}`, {
    method: 'PUT',
    body: { quantity },
  });
  return data.items || [];
};

export const removeCartItem = async (productId) => {
  const data = await request(`/${productId}`, { method: 'DELETE' });
  return data.items || [];
};

export const clearCartItems = async () => {
  const data = await request('', { method: 'DELETE' });
  return data.items || [];
};
