// src/services/customerService.js
const host = import.meta.env.VITE_HOST;

export const fetchAllCustomers = async () => {
  const res = await fetch(`${host}/api/customers`);
  return res.json();
};

